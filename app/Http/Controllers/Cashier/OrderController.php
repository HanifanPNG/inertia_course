<?php

namespace App\Http\Controllers\Cashier;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Cashier\CheckoutRequest;
use App\Http\Requests\Cashier\OrderItemsRequest;
use App\Http\Requests\Cashier\OrderStatusRequest;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /**
     * Number of attempts before giving up when two cashiers create an order
     * with the same order number at the same time.
     */
    private const MAX_ORDER_NUMBER_ATTEMPTS = 3;

    /**
     * Show the order list page.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'order_date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $date = isset($filters['order_date'])
            ? Carbon::createFromFormat('Y-m-d', $filters['order_date'])
            : null;

        return Inertia::render('cashier/orders/index', [
            'orders' => Order::query()
                ->with('user:id,name')
                ->withCount('orderItems')
                ->when($date, fn ($query) => $query->onDate($date))
                ->latest('order_date')
                ->latest('id')
                ->get()
                ->map(fn (Order $order): array => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'order_date' => $order->order_date->toDateString(),
                    'total_amount' => $order->total_amount,
                    'status' => $order->status->value,
                    'items_count' => $order->order_items_count,
                    'user' => ['name' => $order->user->name],
                ]),
            'filters' => [
                'order_date' => $date?->toDateString(),
            ],
        ]);
    }

    /**
     * Show the point of sale page with the menu and an empty cart.
     */
    public function create(): RedirectResponse
    {
        return to_route('cashier.dashboard');
    }

    /**
     * Show the cashier point of sale: menu, cart, and payment in one page.
     */
    public function dashboard(): Response
    {
        return Inertia::render('cashier/dashboard', [
            'categories' => $this->menuByCategory($this->sellableProducts()),
            'paymentMethods' => $this->paymentMethods(),
            'qrisImageUrl' => '/images/qris.png',
        ]);
    }

    /**
     * Store a newly created order together with its items.
     */
    public function store(OrderItemsRequest $request): RedirectResponse
    {
        $order = $this->createOrderWithItems(
            $request->validated('items'),
            $request->user(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Pesanan #{$order->order_number} berhasil dibuat.",
        ]);

        return to_route('cashier.orders.show', $order);
    }

    /**
     * Create the order, its items, and its payment, then settle the order.
     *
     * Payment is captured in the same request so the cashier never leaves the
     * point of sale. A successful payment moves the order straight to
     * `completed`: `pending → paid → completed`. For cash the `amount_paid`
     * must cover the total, otherwise the cashier is asked for a higher amount.
     * QRIS and debit are recorded as paid in full.
     */
    public function checkout(CheckoutRequest $request): RedirectResponse
    {
        $method = PaymentMethod::from($request->validated('payment_method'));
        $items = $request->validated('items');

        $order = $this->createOrderWithItems($items, $request->user());

        $amountPaid = $method === PaymentMethod::Cash
            ? round((float) $request->validated('amount_paid'), 2)
            : (float) $order->total_amount;

        if ($method === PaymentMethod::Cash && $amountPaid < (float) $order->total_amount) {
            $order->orderItems()->delete();
            $order->delete();

            throw ValidationException::withMessages([
                'amount_paid' => 'Uang yang dibayarkan kurang dari total pesanan.',
            ]);
        }

        $this->settleOrder($order, $method, $amountPaid);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Pesanan #{$order->order_number} sudah dibayar dan diselesaikan.",
        ]);

        return to_route('cashier.orders.show', $order);
    }

    /**
     * Show the order detail page, which doubles as the receipt.
     */
    public function show(Order $order): Response
    {
        return Inertia::render('cashier/orders/show', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'order_date' => $order->order_date->toDateString(),
                'total_amount' => $order->total_amount,
                'status' => $order->status->value,
                'can_be_completed' => $order->status === OrderStatus::Paid,
                'can_be_edited' => $order->status === OrderStatus::Pending,
                'can_be_deleted' => $order->status === OrderStatus::Pending,
                'user' => ['name' => $order->user->name],
                'items' => $order->orderItems()
                    ->get()
                    ->map(fn ($item): array => [
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'subtotal' => $item->subtotal,
                        'product_name' => $item->product_label,
                    ]),
            ],
        ]);
    }

    /**
     * Show the page for editing a pending order.
     */
    public function edit(Request $request, Order $order): Response|RedirectResponse
    {
        if (! $this->isPending($request, $order)) {
            return back();
        }

        return Inertia::render('cashier/orders/edit', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'order_date' => $order->order_date->toDateString(),
                'total_amount' => $order->total_amount,
            ],
            'categories' => $this->menuByCategory($this->sellableProducts()),
            'items' => $order->orderItems()
                ->whereNotNull('product_id')
                ->get(['product_id', 'quantity'])
                ->map(fn ($item): array => [
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                ]),
        ]);
    }

    /**
     * Replace the items of a pending order.
     */
    public function update(OrderItemsRequest $request, Order $order): RedirectResponse
    {
        if (! $this->isPending($request, $order)) {
            return back();
        }

        $quantities = $this->quantitiesPerProduct($request->validated('items'));

        $order->getConnection()->transaction(function () use ($order, $quantities): void {
            $order->orderItems()->delete();

            $total = 0.0;

            foreach ($quantities as $productId => $quantity) {
                $product = Product::query()->findOrFail($productId);
                $subtotal = round((float) $product->price * $quantity, 2);

                $order->orderItems()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $quantity,
                    'price' => $product->price,
                    'subtotal' => $subtotal,
                ]);

                $total += $subtotal;
            }

            $order->update(['total_amount' => round($total, 2)]);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Pesanan #{$order->order_number} berhasil diperbarui.",
        ]);

        return to_route('cashier.orders.show', $order);
    }

    /**
     * Delete a pending order.
     */
    public function destroy(Request $request, Order $order): RedirectResponse
    {
        if (! $this->isPending($request, $order)) {
            return back();
        }

        $orderNumber = $order->order_number;
        $order->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Pesanan #{$orderNumber} berhasil dihapus.",
        ]);

        return to_route('cashier.orders.index');
    }

    /**
     * Update the order status.
     */
    public function updateStatus(OrderStatusRequest $request, Order $order): RedirectResponse
    {
        if (! $order->status->canTransitionTo(OrderStatus::from($request->validated('status')))) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Pesanan dengan status {$order->status->value} tidak dapat diubah.",
            ]);

            return to_route('cashier.orders.show', $order);
        }

        $order->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status pesanan diperbarui.']);

        return to_route('cashier.orders.show', $order);
    }

    /**
     * Guard order edits and deletions: only pending orders may change.
     *
     * Cashier gets a clear explanation instead of a silent no-op, other users
     * get a 403.
     */
    private function isPending(Request $request, Order $order): bool
    {
        abort_unless(
            $order->status === OrderStatus::Pending,
            403,
            'Hanya pesanan dengan status pending yang dapat diubah atau dihapus.',
        );

        if ($request->user()->is($order->user)) {
            return true;
        }

        Inertia::flash('toast', [
            'type' => 'error',
            'message' => "Pesanan #{$order->order_number} milik kasir lain sehingga tidak dapat diubah atau dihapus.",
        ]);

        return false;
    }

    /**
     * The products that can be added to an order.
     *
     * @return Collection<int, Product>
     */
    private function sellableProducts(): Collection
    {
        return Product::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'category_id', 'name', 'price', 'image']);
    }

    /**
     * Create the order and its items inside a database transaction.
     *
     * Order numbers restart at 1 every day and must be unique per date, so the
     * next number is read inside the transaction. A unique constraint violation
     * means another cashier took the same number first, so the transaction is
     * retried with a fresh number.
     *
     * @param  array<int, array{product_id: int|string, quantity: int|string}>  $items
     */
    private function createOrderWithItems(array $items, User $cashier): Order
    {
        $quantities = $this->quantitiesPerProduct($items);

        for ($attempt = 1; ; $attempt++) {
            try {
                return DB::transaction(function () use ($quantities, $cashier): Order {
                    $order = Order::create([
                        'order_number' => $this->nextOrderNumber(),
                        'order_date' => today(),
                        'user_id' => $cashier->id,
                        'status' => OrderStatus::Pending,
                    ]);

                    $total = 0.0;

                    foreach ($quantities as $productId => $quantity) {
                        $product = Product::query()->findOrFail($productId);
                        $subtotal = round((float) $product->price * $quantity, 2);

                        $order->orderItems()->create([
                            'product_id' => $product->id,
                            'product_name' => $product->name,
                            'quantity' => $quantity,
                            'price' => $product->price,
                            'subtotal' => $subtotal,
                        ]);

                        $total += $subtotal;
                    }

                    $order->update(['total_amount' => round($total, 2)]);

                    return $order;
                });
            } catch (QueryException $exception) {
                if ($attempt >= self::MAX_ORDER_NUMBER_ATTEMPTS || ! $this->isUniqueConstraintViolation($exception)) {
                    throw $exception;
                }
            }
        }
    }

    /**
     * Record the payment and settle the order as `completed`.
     *
     * Everything happens inside one transaction so an order never ends up with
     * a payment but without the matching status.
     */
    private function settleOrder(Order $order, PaymentMethod $method, float $amountPaid): void
    {
        DB::transaction(function () use ($order, $method, $amountPaid): void {
            $order->payment()->create([
                'method' => $method,
                'amount' => $amountPaid,
                'paid_at' => now(),
            ]);

            $order->update(['status' => OrderStatus::Completed]);
        });
    }

    /**
     * Payment methods offered at the point of sale.
     *
     * @return array<int, array{value: string, label: string}>
     */
    private function paymentMethods(): array
    {
        return array_map(
            fn (PaymentMethod $method): array => [
                'value' => $method->value,
                'label' => $method->label(),
            ],
            PaymentMethod::cases(),
        );
    }

    /**
     * The next order number for today, starting at 1.
     */
    private function nextOrderNumber(): int
    {
        $lastNumber = Order::query()
            ->onDate(today())
            ->max('order_number');

        return ((int) $lastNumber) + 1;
    }

    /**
     * Merge duplicated products into a single quantity per product.
     *
     * The cart may contain the same product twice, but an order item only ever
     * stores one row per product.
     *
     * @param  array<int, array{product_id: int|string, quantity: int|string}>  $items
     * @return array<int, int>
     */
    private function quantitiesPerProduct(array $items): array
    {
        $quantities = [];

        foreach ($items as $item) {
            $productId = (int) $item['product_id'];
            $quantities[$productId] = ($quantities[$productId] ?? 0) + (int) $item['quantity'];
        }

        return $quantities;
    }

    /**
     * Determine whether the exception is a unique constraint violation.
     */
    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        return $exception->getCode() === '23000';
    }

    /**
     * Group the sellable menu by category for the point of sale menu list.
     *
     * @param  Collection<int, Product>  $products
     * @return array<int, array{id: int, name: string, products: array<int, array{id: int, name: string, price: string}>}>
     */
    private function menuByCategory(Collection $products): array
    {
        return Category::query()
            ->whereIn('id', $products->pluck('category_id')->unique())
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'products' => $products
                    ->where('category_id', $category->id)
                    ->map(fn (Product $product): array => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'price' => $product->price,
                        'image_url' => $product->image_url,
                    ])
                    ->values()
                    ->all(),
            ])
            ->all();
    }
}
