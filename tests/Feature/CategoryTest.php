<?php

use App\Models\Category;

test('a category can be created', function () {
    $category = Category::create([
        'name' => 'Makanan',
        'description' => 'Menu makanan utama',
    ]);

    expect($category)->toBeInstanceOf(Category::class)
        ->and($category->name)->toBe('Makanan')
        ->and($category->exists)->toBeTrue();
});

test('a category description is optional', function () {
    $category = Category::create(['name' => 'Camilan']);

    expect($category->description)->toBeNull();
});

test('seeding creates the default categories and can be repeated', function () {
    $this->seed();
    $this->seed();

    expect(Category::count())->toBe(4)
        ->and(Category::where('name', 'Makanan')->sole()->description)
        ->toBe('Menu makanan utama');
});
