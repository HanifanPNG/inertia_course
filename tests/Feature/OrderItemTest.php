<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;

test('an order item belongs to an order and a product', function () {
    $order = Order::factory()->create();
    $product = Product::factory()->create(['price' => '17000']);

    $item = OrderItem::factory()->forProduct($product, 2)->create(['order_id' => $order->id]);

    expect($item->order->is($order))->toBeTrue()
        ->and($item->product->is($product))->toBeTrue()
        ->and($order->orderItems()->count())->toBe(1)
        ->and($product->orderItems()->count())->toBe(1);
});

test('an order item stores price and subtotal as decimals', function () {
    $product = Product::factory()->create(['price' => '17000']);

    $item = OrderItem::factory()->forProduct($product, 3)->create();

    expect($item->price)->toBe('17000.00')
        ->and($item->subtotal)->toBe('51000.00')
        ->and($item->quantity)->toBe(3);
});

test('changing the product price does not change past order items', function () {
    $product = Product::factory()->create(['price' => '17000']);
    $item = OrderItem::factory()->forProduct($product, 2)->create();

    $product->update(['price' => '25000']);

    expect($item->fresh()->price)->toBe('17000.00')
        ->and($item->fresh()->subtotal)->toBe('34000.00');
});

test('deleting an order deletes its order items', function () {
    $order = Order::factory()->create();
    OrderItem::factory()->create(['order_id' => $order->id]);

    $order->delete();

    expect(OrderItem::count())->toBe(0);
});

test('a product that has been ordered can still be deleted', function () {
    $product = Product::factory()->create(['name' => 'Nasi Goreng']);
    $item = OrderItem::factory()->forProduct($product, 2)->create();

    $product->delete();

    $item = $item->fresh();

    expect($item->product_id)->toBeNull()
        ->and($item->product)->toBeNull()
        ->and($item->product_label)->toBe('Nasi Goreng');
});

test('the product name snapshot survives a product rename', function () {
    $product = Product::factory()->create(['name' => 'Nasi Goreng']);
    $item = OrderItem::factory()->forProduct($product, 1)->create();

    $product->update(['name' => 'Nasi Goreng Spesial']);

    expect($item->fresh()->product_label)->toBe('Nasi Goreng');
});

test('an order item stores the product name at the time of the order', function () {
    $product = Product::factory()->create(['name' => 'Es Teh']);
    $item = OrderItem::factory()->forProduct($product, 1)->create();

    expect($item->product_name)->toBe('Es Teh');
});
