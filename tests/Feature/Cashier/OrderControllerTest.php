<?php

use App\Enums\OrderStatus;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->cashier = User::factory()->cashier()->create();
    $this->admin = User::factory()->admin()->create();
    $this->category = Category::factory()->create(['name' => 'Makanan']);
    $this->food = Product::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Nasi Goreng',
        'price' => 25000,
    ]);
    $this->drink = Product::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Es Teh',
        'price' => 8000,
    ]);
});

test('only cashiers can manage orders', function (string $routeName) {
    $this->actingAs($this->admin)->get(route($routeName))->assertForbidden();

    $this->actingAs($this->cashier)->get(route($routeName))->assertOk();
})->with([
    'index' => 'cashier.orders.index',
]);

test('an order can be created with its items', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.store'), [
            'items' => [
                ['product_id' => $this->food->id, 'quantity' => 2],
                ['product_id' => $this->drink->id, 'quantity' => 1],
            ],
        ])
        ->assertRedirect();

    $order = Order::sole();

    expect($order->user_id)->toBe($this->cashier->id)
        ->and($order->status)->toBe(OrderStatus::Pending)
        ->and($order->order_number)->toBe(1)
        ->and($order->order_date->toDateString())->toBe(today()->toDateString())
        ->and($order->total_amount)->toEqual('58000.00');

    expect($order->orderItems)->toHaveCount(2);

    $foodItem = $order->orderItems->firstWhere('product_id', $this->food->id);

    expect($foodItem->quantity)->toBe(2)
        ->and($foodItem->price)->toEqual('25000.00')
        ->and($foodItem->subtotal)->toEqual('50000.00');
});

test('order numbers are sequential per day and reset the next day', function () {
    $this->actingAs($this->cashier)->post(route('cashier.orders.store'), [
        'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
    ]);
    $this->actingAs($this->cashier)->post(route('cashier.orders.store'), [
        'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
    ]);

    expect(Order::pluck('order_number')->all())->toBe([1, 2]);

    Order::query()->update(['order_date' => today()->subDay()]);

    $this->actingAs($this->cashier)->post(route('cashier.orders.store'), [
        'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
    ]);

    expect(Order::where('order_date', today())->sole()->order_number)->toBe(1)
        ->and(Order::count())->toBe(3);
});

test('the same product twice is merged into one order item', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.store'), [
            'items' => [
                ['product_id' => $this->food->id, 'quantity' => 1],
                ['product_id' => $this->food->id, 'quantity' => 3],
            ],
        ])
        ->assertRedirect();

    $order = Order::sole();

    expect($order->orderItems)->toHaveCount(1)
        ->and($order->orderItems->sole()->quantity)->toBe(4)
        ->and($order->total_amount)->toEqual('100000.00');
});

test('an order requires at least one item', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.store'), ['items' => []])
        ->assertSessionHasErrors('items');

    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.store'), [])
        ->assertSessionHasErrors('items');

    expect(Order::count())->toBe(0);
});

test('item quantity must be an integer of at least one', function (string $quantity) {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.store'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => $quantity]],
        ])
        ->assertSessionHasErrors('items.0.quantity');

    expect(Order::count())->toBe(0);
})->with([
    'zero' => '0',
    'negative' => '-2',
    'fractional' => '1.5',
    'text' => 'dua',
]);

test('an order cannot contain an inactive product', function () {
    $inactive = Product::factory()->inactive()->create([
        'category_id' => $this->category->id,
    ]);

    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.store'), [
            'items' => [['product_id' => $inactive->id, 'quantity' => 1]],
        ])
        ->assertSessionHasErrors('items.0.product_id');

    expect(Order::count())->toBe(0);
});

test('an order cannot contain an unknown product', function () {
    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.store'), [
            'items' => [['product_id' => 9999, 'quantity' => 1]],
        ])
        ->assertSessionHasErrors('items.0.product_id');

    expect(Order::count())->toBe(0);
});

test('the point of sale only offers active products grouped by category', function () {
    Product::factory()->inactive()->create([
        'category_id' => $this->category->id,
        'name' => 'Menu Habis',
    ]);
    $other = Category::factory()->create(['name' => 'Minuman']);
    Product::factory()->create(['category_id' => $other->id, 'name' => 'Kopi']);

    $this->actingAs($this->cashier)
        ->get(route('cashier.dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('cashier/dashboard')
            ->has('categories', 2)
            ->where('categories.0.name', 'Makanan')
            ->has('categories.0.products', 2)
            ->where('categories.1.name', 'Minuman')
            ->has('categories.1.products', 1)
        );
});

test('the order list shows orders with their cashier', function () {
    Order::factory()->create([
        'user_id' => $this->cashier->id,
        'order_number' => 7,
        'total_amount' => 58000,
    ]);

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('cashier/orders/index')
            ->has('orders', 1)
            ->where('orders.0.order_number', 7)
            ->where('orders.0.total_amount', '58000.00')
            ->where('orders.0.status', 'pending')
            ->where('orders.0.user.name', $this->cashier->name)
        );
});

test('the order list rejects a malformed date filter', function () {
    Order::factory()->create(['user_id' => $this->cashier->id]);

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.index', ['order_date' => 'bukan-tanggal']))
        ->assertSessionHasErrors('order_date');
});

test('the order list can be filtered by date', function () {
    Order::factory()->create([
        'user_id' => $this->cashier->id,
        'order_date' => today()->subDays(3),
    ]);
    Order::factory()->create([
        'user_id' => $this->cashier->id,
        'order_date' => today(),
    ]);

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.index', ['order_date' => today()->toDateString()]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('orders', 1)
            ->where('filters.order_date', today()->toDateString())
        );
});

test('an order detail shows its items and total', function () {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'order_number' => 12,
        'total_amount' => 58000,
    ]);
    OrderItem::factory()->create([
        'order_id' => $order->id,
        'product_id' => $this->food->id,
        'quantity' => 2,
        'price' => 25000,
        'subtotal' => 50000,
    ]);

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.show', $order))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('cashier/orders/show')
            ->where('order.order_number', 12)
            ->where('order.total_amount', '58000.00')
            ->where('order.status', 'pending')
            ->where('order.can_be_completed', false)
            ->where('order.can_be_edited', true)
            ->where('order.can_be_deleted', true)
            ->has('order.items', 1)
            ->where('order.items.0.quantity', 2)
            ->where('order.items.0.subtotal', '50000.00')
            ->where('order.items.0.product_name', 'Nasi Goreng')
        );
});

test('a paid order can be completed', function () {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::Paid,
    ]);

    $this->actingAs($this->cashier)
        ->patch(route('cashier.orders.status.update', $order), ['status' => 'completed'])
        ->assertRedirect(route('cashier.orders.show', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::Completed);
});

test('a pending order cannot be completed directly', function () {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::Pending,
    ]);

    $this->actingAs($this->cashier)
        ->patch(route('cashier.orders.status.update', $order), ['status' => 'completed'])
        ->assertRedirect(route('cashier.orders.show', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::Pending);
});

test('a completed order cannot be changed back', function () {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::Completed,
    ]);

    $this->actingAs($this->cashier)
        ->patch(route('cashier.orders.status.update', $order), ['status' => 'completed'])
        ->assertRedirect(route('cashier.orders.show', $order));

    expect($order->fresh()->status)->toBe(OrderStatus::Completed);
});

test('a pending status cannot be requested through the status route', function () {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::Paid,
    ]);

    $this->actingAs($this->cashier)
        ->patch(route('cashier.orders.status.update', $order), ['status' => 'pending'])
        ->assertSessionHasErrors('status');

    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
});

test('an admin cannot create an order', function () {
    $this->actingAs($this->admin)
        ->post(route('cashier.orders.store'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
        ])
        ->assertForbidden();

    expect(Order::count())->toBe(0);
});

test('a guest cannot create an order', function () {
    $this->post(route('cashier.orders.store'), [
        'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
    ])->assertRedirect(route('login'));

    expect(Order::count())->toBe(0);
});

test('a pending order can be edited', function () {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::Pending,
        'total_amount' => 25000,
    ]);
    OrderItem::factory()->forProduct($this->food, 1)->create(['order_id' => $order->id]);

    $this->actingAs($this->cashier)
        ->put(route('cashier.orders.update', $order), [
            'items' => [
                ['product_id' => $this->food->id, 'quantity' => 3],
                ['product_id' => $this->drink->id, 'quantity' => 1],
            ],
        ])
        ->assertRedirect(route('cashier.orders.show', $order));

    $order = $order->fresh();

    expect($order->total_amount)->toEqual('83000.00')
        ->and($order->orderItems)->toHaveCount(2)
        ->and($order->orderItems->firstWhere('product_id', $this->food->id)->quantity)->toBe(3)
        ->and($order->orderItems->firstWhere('product_id', $this->food->id)->product_name)
        ->toBe('Nasi Goreng');
});

test('the edit form only offers active products', function () {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::Pending,
    ]);
    Product::factory()->inactive()->create([
        'category_id' => $this->category->id,
        'name' => 'Menu Habis',
    ]);

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.edit', $order))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('cashier/orders/edit')
            ->where('order.id', $order->id)
            ->where('items', [])
            ->has('categories.0.products', 2)
        );
});

test('a non pending order cannot be edited', function (string $status) {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::from($status),
    ]);

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.edit', $order))
        ->assertForbidden();

    $this->actingAs($this->cashier)
        ->put(route('cashier.orders.update', $order), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
        ])
        ->assertForbidden();

    expect($order->fresh()->orderItems)->toHaveCount(0);
})->with(['paid', 'completed']);

test('a pending order can be deleted', function () {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::Pending,
    ]);
    OrderItem::factory()->create(['order_id' => $order->id]);

    $this->actingAs($this->cashier)
        ->delete(route('cashier.orders.destroy', $order))
        ->assertRedirect(route('cashier.orders.index'));

    expect(Order::count())->toBe(0)
        ->and(OrderItem::count())->toBe(0);
});

test('a non pending order cannot be deleted', function (string $status) {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::from($status),
    ]);

    $this->actingAs($this->cashier)
        ->delete(route('cashier.orders.destroy', $order))
        ->assertForbidden();

    expect(Order::count())->toBe(1);
})->with(['paid', 'completed']);

test('a cashier cannot change the items of another cashier order', function () {
    $order = Order::factory()->create([
        'user_id' => User::factory()->cashier()->create()->id,
        'status' => OrderStatus::Pending,
    ]);

    $this->actingAs($this->cashier)
        ->put(route('cashier.orders.update', $order), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
        ])
        ->assertRedirect();

    expect($order->fresh()->orderItems)->toHaveCount(0);
});

test('a cashier cannot delete another cashier order', function () {
    $order = Order::factory()->create([
        'user_id' => User::factory()->cashier()->create()->id,
        'status' => OrderStatus::Pending,
    ]);

    $this->actingAs($this->cashier)
        ->delete(route('cashier.orders.destroy', $order))
        ->assertRedirect();

    expect(Order::count())->toBe(1);
});

test('an admin cannot edit or delete orders', function () {
    $order = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::Pending,
    ]);

    $this->actingAs($this->admin)
        ->get(route('cashier.orders.edit', $order))
        ->assertForbidden();

    $this->actingAs($this->admin)
        ->put(route('cashier.orders.update', $order), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
        ])
        ->assertForbidden();

    $this->actingAs($this->admin)
        ->delete(route('cashier.orders.destroy', $order))
        ->assertForbidden();

    expect(Order::count())->toBe(1);
});

test('the order date is stored in the application timezone', function () {
    Carbon::setTestNow('2026-10-04 23:30:00');

    $this->actingAs($this->cashier)
        ->post(route('cashier.orders.store'), [
            'items' => [['product_id' => $this->food->id, 'quantity' => 1]],
        ]);

    expect(Order::sole()->order_date->toDateString())->toBe('2026-10-04');

    Carbon::setTestNow();
});
