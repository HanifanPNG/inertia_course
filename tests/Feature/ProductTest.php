<?php

use App\Models\Category;
use App\Models\Product;

test('a product can be created for a category', function () {
    $category = Category::factory()->create();

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Nasi Goreng Spesial',
        'price' => '28000',
    ]);

    expect($product->category->is($category))->toBeTrue()
        ->and($product->price)->toBe('28000.00')
        ->and($product->is_active)->toBeTrue();
});

test('a product price keeps two decimal places', function () {
    $product = Product::factory()->create(['price' => 15000]);

    expect($product->price)->toBe('15000.00');
});

test('a product can be marked inactive', function () {
    expect(Product::factory()->inactive()->create()->is_active)->toBeFalse();
});

test('a category has many products', function () {
    $category = Category::factory()->create();

    $category->products()->createMany([
        ['name' => 'Es Teh Manis', 'price' => '8000'],
        ['name' => 'Kopi Susu', 'price' => '22000'],
    ]);
    Product::factory()->create();

    expect($category->products()->pluck('name')->all())
        ->toBe(['Es Teh Manis', 'Kopi Susu']);
});

test('deleting a category deletes its products', function () {
    $category = Category::factory()->create();
    $category->products()->create(['name' => 'Kentang Goreng', 'price' => '18000']);

    $category->delete();

    expect(Product::count())->toBe(0);
});

test('seeding creates the demo menu and can be repeated', function () {
    $this->seed();
    $this->seed();

    expect(Product::count())->toBe(9)
        ->and(Product::where('name', 'Nasi Goreng Spesial')->sole()->price)
        ->toBe('28000.00');
});
