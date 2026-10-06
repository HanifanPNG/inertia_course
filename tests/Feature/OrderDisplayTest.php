<?php

use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected to the login page', function () {
    $this->get(route('orders.display'))->assertRedirect(route('login'));
});

test('any authenticated user can view the display', function (string $role) {
    $user = User::factory()->{$role}()->create();

    $this->actingAs($user)
        ->get(route('orders.display'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('orders/display')
            ->where('filter', 'all')
        );
})->with(['admin' => 'admin', 'cashier' => 'cashier']);

test('the display lists today orders with their status', function () {
    Order::factory()->completed()->create(['order_number' => 1]);
    Order::factory()->create(['order_number' => 2]);
    Order::factory()->onDate(today()->subDay()->toDateString())->create(['order_number' => 3]);

    $this->actingAs(User::factory()->cashier()->create())
        ->get(route('orders.display'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('orders', 2)
            ->where('orders.0.number', 2)
            ->where('orders.0.status', 'pending')
            ->where('orders.0.status_label', 'Pending')
            ->where('orders.1.number', 1)
            ->where('orders.1.status', 'completed')
            ->where('counts.all', 2)
            ->where('counts.pending', 1)
            ->where('counts.completed', 1)
        );
});

test('the display can be filtered by status', function () {
    Order::factory()->completed()->create(['order_number' => 1]);
    Order::factory()->completed()->create(['order_number' => 2]);
    Order::factory()->create(['order_number' => 3]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('orders.display', ['status' => 'pending']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('filter', 'pending')
            ->has('orders', 1)
            ->where('orders.0.number', 3)
        );
});

test('the display shows an empty state without orders', function () {
    $this->actingAs(User::factory()->cashier()->create())
        ->get(route('orders.display'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('orders', 0)
            ->where('counts.all', 0)
        );
});

test('the display rejects an unknown status filter', function () {
    $this->actingAs(User::factory()->cashier()->create())
        ->get(route('orders.display', ['status' => 'shipped']))
        ->assertInvalid('status');
});
