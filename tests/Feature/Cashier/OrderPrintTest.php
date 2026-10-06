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
    $this->admin = User::factory()->admin()->create();
    $this->category = Category::factory()->create();
    $this->food = Product::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Nasi Goreng',
        'price' => 25000,
    ]);
    $this->paidOrder = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'order_number' => 7,
        'total_amount' => 50000,
        'status' => OrderStatus::Completed,
    ]);
    OrderItem::factory()->create([
        'order_id' => $this->paidOrder->id,
        'product_id' => $this->food->id,
        'quantity' => 2,
        'price' => 25000,
        'subtotal' => 50000,
    ]);
    Payment::factory()->create([
        'order_id' => $this->paidOrder->id,
        'method' => PaymentMethod::Cash,
        'amount' => 60000,
        'paid_at' => now(),
    ]);
});

test('only cashiers can print a receipt', function () {
    $this->actingAs($this->admin)
        ->get(route('cashier.orders.print', $this->paidOrder))
        ->assertForbidden();

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.print', $this->paidOrder))
        ->assertOk();
});

test('a guest cannot print a receipt', function () {
    $this->get(route('cashier.orders.print', $this->paidOrder))
        ->assertRedirect(route('login'));
});

test('an unpaid order has no receipt to print', function () {
    $pendingOrder = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::Pending,
    ]);

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.print', $pendingOrder))
        ->assertForbidden();
});

test('a receipt shows the order, its items, and its payment', function () {
    $this->actingAs($this->cashier)
        ->withSession(['client_names.'.$this->paidOrder->id => 'Budi'])
        ->get(route('cashier.orders.print', $this->paidOrder))
        ->assertOk()
        ->assertViewIs('cashier.orders.print')
        ->assertViewHas('storeName', config('app.name'))
        ->assertViewHas('printedAt')
        ->assertViewHas('order', fn (array $order) => $order['order_number'] === 7
            && $order['cashier'] === $this->cashier->name
            && $order['client_name'] === 'Budi'
            && $order['total_amount'] === 50000.0
            && $order['items'][0]['product_name'] === 'Nasi Goreng'
            && $order['items'][0]['quantity'] === 2
            && $order['payment']['amount'] === 60000.0
            && $order['payment']['change'] === 10000.0);
});

test('a receipt renders the order as a printable document', function () {
    $response = $this->actingAs($this->cashier)
        ->get(route('cashier.orders.print', $this->paidOrder));

    $response->assertOk()
        ->assertSee('size: 80mm auto')
        ->assertSee('window.print()')
        ->assertSee('Nasi Goreng')
        ->assertSee('Rp 50.000')
        ->assertSee('Rp 60.000')
        ->assertSee('Rp 10.000');
});

test('the order pages tell whether a receipt can be printed', function () {
    $pendingOrder = Order::factory()->create([
        'user_id' => $this->cashier->id,
        'status' => OrderStatus::Pending,
    ]);

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.show', $this->paidOrder))
        ->assertInertia(fn ($page) => $page->where('order.can_be_printed', true));

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.show', $pendingOrder))
        ->assertInertia(fn ($page) => $page->where('order.can_be_printed', false));

    $this->actingAs($this->cashier)
        ->get(route('cashier.orders.index'))
        ->assertInertia(fn ($page) => $page
            ->where('orders', fn ($orders) => collect($orders)->every(
                fn (array $order): bool => $order['can_be_printed'] === ($order['id'] === $this->paidOrder->id),
            ))
        );
});
