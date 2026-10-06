<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;

beforeEach(function () {
    $this->cashier = User::factory()->cashier()->create();
    $this->category = Category::factory()->create();
    $this->food = Product::factory()->create([
        'category_id' => $this->category->id,
        'price' => 25000,
    ]);
    $this->drink = Product::factory()->create([
        'category_id' => $this->category->id,
        'price' => 8000,
    ]);
});

test('the cashier dashboard shows the menu and payment methods', function () {
    $this->actingAs($this->cashier)
        ->get(route('cashier.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('cashier/dashboard')
            ->has('categories', 1)
            ->has('paymentMethods', 3)
            ->where('paymentMethods.0.value', 'cash')
            ->where('qrisImageUrl', '/images/qris.png')
        );
});

test('the create order page redirects to the dashboard', function () {
    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.create'))
        ->assertRedirect(route('cashier.dashboard'));
});

test('a cash payment covers the total and completes the order', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 2]],
            'client_name' => 'Budi',
            'payment_method' => 'cash',
            'amount_paid' => 50000,
        ])
        ->assertRedirect();

    $order = Order::sole();

    expect($order->status)->toBe(OrderStatus::Completed)
        ->and($order->total_amount)->toEqual('50000.00')
        ->and($order->payment->method)->toBe(PaymentMethod::Cash)
        ->and($order->payment->amount)->toEqual('50000.00')
        ->and($order->payment->paid_at)->not->toBeNull();
});

test('an exact cash payment is accepted', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
            'client_name' => 'Budi',
            'payment_method' => 'cash',
            'amount_paid' => 25000,
        ]);

    expect(Order::sole()->payment->amount)->toEqual('25000.00');
});

test('cash below the total is rejected and nothing is stored', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 2]],
            'client_name' => 'Budi',
            'payment_method' => 'cash',
            'amount_paid' => 10000,
        ])
        ->assertSessionHasErrors('amount_paid');

    expect(Order::count())->toBe(0)
        ->and(OrderItem::count())->toBe(0)
        ->and(Payment::count())->toBe(0);
});

test('a cash payment requires an amount', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
            'client_name' => 'Budi',
            'payment_method' => 'cash',
        ])
        ->assertSessionHasErrors('amount_paid');

    expect(Order::count())->toBe(0);
});

test('a qris payment is recorded as paid in full and completes the order', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [
                ['product_id' => $this->food->id, 'quantity' => 1],
                ['product_id' => $this->drink->id, 'quantity' => 1],
            ],
            'client_name' => 'Budi',
            'payment_method' => 'qris',
        ]);

    $order = Order::sole();

    expect($order->status)->toBe(OrderStatus::Completed)
        ->and($order->total_amount)->toEqual('33000.00')
        ->and($order->payment->method)->toBe(PaymentMethod::Qris)
        ->and($order->payment->amount)->toEqual('33000.00');
});

test('a debit payment is recorded as paid in full and completes the order', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
            'client_name' => 'Budi',
            'payment_method' => 'debit',
        ]);

    $order = Order::sole();

    expect($order->status)->toBe(OrderStatus::Completed)
        ->and($order->payment->method)->toBe(PaymentMethod::Debit)
        ->and($order->payment->amount)->toEqual('25000.00');
});

test('an invalid payment method is rejected', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
            'client_name' => 'Budi',
            'payment_method' => 'bitcoin',
        ])
        ->assertSessionHasErrors('payment_method');

    expect(Order::count())->toBe(0);
});

test('checkout requires at least one item', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [],
            'client_name' => 'Budi',
            'payment_method' => 'cash',
            'amount_paid' => 10000,
        ])
        ->assertSessionHasErrors('items');

    expect(Order::count())->toBe(0);
});

test('checkout rejects an inactive product', function () {
    $inactive = Product::factory()->inactive()->create([
        'category_id' => $this->category->id,
    ]);

    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $inactive->id, 'quantity' => 1]],
            'client_name' => 'Budi',
            'payment_method' => 'cash',
            'amount_paid' => 100000,
        ])
        ->assertSessionHasErrors('items.0.product_id');

    expect(Order::count())->toBe(0);
});

test('the same product twice is merged and paid once', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [
                ['product_id' => $this->food->id, 'quantity' => 1],
                ['product_id' => $this->food->id, 'quantity' => 2],
            ],
            'client_name' => 'Budi',
            'payment_method' => 'cash',
            'amount_paid' => 75000,
        ]);

    $order = Order::sole();

    expect($order->orderItems)->toHaveCount(1)
        ->and($order->total_amount)->toEqual('75000.00')
        ->and($order->payment->amount)->toEqual('75000.00');
});

test('checkout assigns the next order number for the day', function () {
    Order::factory()->create([
        'user_id' => $this->cashier->id,
        'order_number' => 7,
        'order_date' => today(),
    ]);

    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
            'client_name' => 'Budi',
            'payment_method' => 'qris',
        ]);

    expect(Order::where('order_number', 8)->exists())->toBeTrue();
});

test('an admin cannot checkout', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
            'client_name' => 'Budi',
            'payment_method' => 'qris',
        ])
        ->assertForbidden();

    expect(Order::count())->toBe(0);
});

test('a guest cannot checkout', function () {
    $this->post(route('cashier.orders.checkout'), [
        'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
        'client_name' => 'Budi',
        'payment_method' => 'qris',
    ])->assertRedirect(route('login'));

    expect(Order::count())->toBe(0);
});

test('the paid order cannot be settled twice', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
            'client_name' => 'Budi',
            'payment_method' => 'qris',
        ]);

    $order = Order::sole();

    expect(Payment::count())->toBe(1)
        ->and($order->status)->toBe(OrderStatus::Completed);
});

test('the checkout requires the client name', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
            'payment_method' => 'qris',
        ])
        ->assertSessionHasErrors('client_name');

    expect(Order::count())->toBe(0);
});

test('the receipt shows the client name and the time', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.checkout'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
            'client_name' => 'Budi Santoso',
            'payment_method' => 'qris',
        ])
        ->assertRedirect();

    $order = Order::sole();

    $this->get(route('cashier.orders.show', $order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('cashier/orders/show')
            ->where('order.client_name', 'Budi Santoso')
            ->where('order.time', $order->created_at->format('H:i')));
});
