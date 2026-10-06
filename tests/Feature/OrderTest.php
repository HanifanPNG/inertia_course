<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\QueryException;

test('a new order starts as pending with a zero total', function () {
    $order = new Order;

    expect($order->status)->toBe(OrderStatus::Pending)
        ->and($order->total_amount)->toBe('0.00');
});

test('a created order is dated today', function () {
    $order = Order::factory()->create();

    expect($order->order_date->toDateString())->toBe(now()->toDateString());
});

test('an order belongs to the cashier who created it', function () {
    $cashier = User::factory()->cashier()->create();

    $order = Order::factory()->create(['user_id' => $cashier->id]);

    expect($order->user->is($cashier))->toBeTrue()
        ->and($cashier->orders()->count())->toBe(1);
});

test('the order number is unique per order date', function () {
    Order::factory()->create(['order_number' => 125, 'order_date' => '2026-10-04']);

    expect(fn () => Order::factory()->create([
        'order_number' => 125,
        'order_date' => '2026-10-04',
    ]))->toThrow(QueryException::class);
});

test('the same order number is allowed on a different date', function () {
    Order::factory()->create(['order_number' => 125, 'order_date' => '2026-10-04']);

    expect(fn () => Order::factory()->create([
        'order_number' => 125,
        'order_date' => '2026-10-05',
    ]))->not->toThrow(QueryException::class);
});

test('orders can be filtered by status', function () {
    Order::factory()->create(['status' => OrderStatus::Pending]);
    Order::factory()->paid()->create();
    Order::factory()->completed()->create();

    expect(Order::status(OrderStatus::Paid)->count())->toBe(1)
        ->and(Order::status(OrderStatus::Pending)->count())->toBe(1)
        ->and(Order::status(OrderStatus::Completed)->count())->toBe(1);
});

test('orders can be filtered by date', function () {
    Order::factory()->onDate('2026-10-04')->create();
    Order::factory()->onDate('2026-10-05')->create();

    expect(Order::onDate(now()->parse('2026-10-04'))->count())->toBe(1);
});

test('an invalid status is rejected', function () {
    expect(fn () => Order::factory()->create(['status' => 'refunded']))
        ->toThrow(ValueError::class);
});

test('a cashier with orders cannot be deleted', function () {
    $cashier = User::factory()->cashier()->create();
    Order::factory()->create(['user_id' => $cashier->id]);

    expect(fn () => $cashier->delete())->toThrow(QueryException::class);
});
