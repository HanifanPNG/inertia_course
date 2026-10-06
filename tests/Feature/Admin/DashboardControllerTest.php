<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->cashier = User::factory()->cashier()->create();
});

test('guests are redirected to the login page', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});

test('only admins can view the dashboard', function () {
    $this->actingAs($this->cashier)->get(route('admin.dashboard'))->assertForbidden();

    $this->actingAs($this->admin)->get(route('admin.dashboard'))->assertOk();
});

test('the dashboard summarises today sales', function () {
    $nasi = Product::factory()->create(['name' => 'Nasi Goreng', 'price' => 25_000]);
    $es = Product::factory()->create(['name' => 'Es Teh', 'price' => 5_000]);

    $order = Order::factory()->completed()->create(['total_amount' => 85_000]);
    OrderItem::factory()->forProduct($nasi, 3)->create(['order_id' => $order->id]);
    OrderItem::factory()->forProduct($es, 1)->create(['order_id' => $order->id]);

    Order::factory()->completed()->create(['total_amount' => 15_000]);
    Order::factory()->create(['total_amount' => 40_000]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/dashboard')
            ->where('summary.revenue', '100000.00')
            ->where('summary.transactions', 3)
            ->where('summary.items_sold', 4)
            ->where('summary.paid_orders', 2)
            ->where('bestSellers.0.name', 'Nasi Goreng')
            ->where('bestSellers.0.quantity', 3)
        );
});

test('the dashboard excludes other days', function () {
    Order::factory()->completed()->onDate(today()->subDay()->toDateString())
        ->create(['total_amount' => 99_000]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('summary.revenue', '0.00')
            ->where('summary.transactions', 0)
            ->has('bestSellers', 0)
        );
});

test('the dashboard shows an empty state without sales', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('summary.transactions', 0)
            ->has('bestSellers', 0)
        );
});
