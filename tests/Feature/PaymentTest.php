<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\Payment;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;

test('a payment belongs to an order', function () {
    $order = Order::factory()->paid()->create();

    $payment = Payment::factory()->create([
        'order_id' => $order->id,
        'amount' => '66000',
    ]);

    expect($payment->order->is($order))->toBeTrue()
        ->and($order->payment->is($payment))->toBeTrue()
        ->and($payment->amount)->toBe('66000.00');
});

test('an order can only have one payment', function () {
    $order = Order::factory()->create();
    Payment::factory()->create(['order_id' => $order->id]);

    expect(fn () => Payment::factory()->create(['order_id' => $order->id]))
        ->toThrow(QueryException::class);
});

test('the payment method is stored as an enum', function (PaymentMethod $method, string $label) {
    $payment = Payment::factory()->method($method)->create();

    expect($payment->method)->toBe($method)
        ->and($payment->method->label())->toBe($label);
})->with([
    'cash' => [PaymentMethod::Cash, 'Cash'],
    'qris' => [PaymentMethod::Qris, 'QRIS'],
]);

test('the shop only offers cash and qris', function () {
    expect(array_column(PaymentMethod::cases(), 'value'))->toBe(['cash', 'qris'])
        ->and(PaymentMethod::tryFrom('debit'))->toBeNull();
});

test('an invalid payment method is rejected', function (string $method) {
    expect(fn () => Payment::factory()->create(['method' => $method]))
        ->toThrow(ValueError::class);
})->with(['transfer', 'debit']);

test('paid at is cast to a datetime and may be null', function () {
    expect(Payment::factory()->create()->paid_at)->toBeInstanceOf(CarbonInterface::class)
        ->and(Payment::factory()->unpaid()->create()->paid_at)->toBeNull();
});

test('deleting an order deletes its payment', function () {
    $order = Order::factory()->create();
    Payment::factory()->create(['order_id' => $order->id]);

    $order->delete();

    expect(Payment::count())->toBe(0);
});

test('a pending order has no payment yet', function () {
    $order = Order::factory()->create(['status' => OrderStatus::Pending]);

    expect($order->payment)->toBeNull();
});
