<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->cashier = User::factory()->cashier()->create();
});

test('only admins can manage categories', function (string $routeName) {
    $this->actingAs($this->cashier)->get(route($routeName))->assertForbidden();

    $this->actingAs($this->admin)->get(route($routeName))->assertOk();
})->with([
    'index' => 'admin.categories.index',
    'create' => 'admin.categories.create',
]);

test('the category list shows categories with their product count', function () {
    $category = Category::factory()->create(['name' => 'Makanan']);
    $other = Category::factory()->create(['name' => 'Minuman']);
    Product::factory()->count(2)->create(['category_id' => $category->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.categories.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/categories/index')
            ->has('categories', 2)
            ->where('categories.0.name', 'Makanan')
            ->where('categories.0.products_count', 2)
            ->where('categories.1.name', 'Minuman')
            ->where('categories.1.products_count', 0)
        );
});

test('a category can be created', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.categories.store'), [
            'name' => 'Dessert',
            'description' => 'Penutup makan',
        ])
        ->assertRedirect(route('admin.categories.index'));

    expect(Category::where('name', 'Dessert')->sole()->description)->toBe('Penutup makan');
});

test('a category description is optional', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.categories.store'), ['name' => 'Promo']);

    expect(Category::where('name', 'Promo')->sole()->description)->toBeNull();
});

test('the category name is required', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.categories.store'), ['name' => ''])
        ->assertSessionHasErrors('name');

    expect(Category::count())->toBe(0);
});

test('the category name must be unique', function () {
    Category::factory()->create(['name' => 'Minuman']);

    $this->actingAs($this->admin)
        ->post(route('admin.categories.store'), ['name' => 'Minuman'])
        ->assertSessionHasErrors('name');

    expect(Category::count())->toBe(1);
});

test('a category can be updated', function () {
    $category = Category::factory()->create(['name' => 'Minuman']);

    $this->actingAs($this->admin)
        ->put(route('admin.categories.update', $category), [
            'name' => 'Minuman Dingin',
            'description' => null,
        ])
        ->assertRedirect(route('admin.categories.index'));

    expect($category->fresh()->name)->toBe('Minuman Dingin')
        ->and($category->fresh()->description)->toBeNull();
});

test('a category keeps its own name when updated', function () {
    $category = Category::factory()->create(['name' => 'Minuman']);

    $this->actingAs($this->admin)
        ->put(route('admin.categories.update', $category), ['name' => 'Minuman'])
        ->assertSessionHasNoErrors();

    expect($category->fresh()->name)->toBe('Minuman');
});

test('a category name cannot be taken by another category', function () {
    Category::factory()->create(['name' => 'Minuman']);
    $category = Category::factory()->create(['name' => 'Dessert']);

    $this->actingAs($this->admin)
        ->put(route('admin.categories.update', $category), ['name' => 'Minuman'])
        ->assertSessionHasErrors('name');

    expect($category->fresh()->name)->toBe('Dessert');
});

test('a category without products can be deleted', function () {
    $category = Category::factory()->create();

    $this->actingAs($this->admin)
        ->delete(route('admin.categories.destroy', $category))
        ->assertRedirect(route('admin.categories.index'));

    expect(Category::count())->toBe(0);
});

test('a category with products cannot be deleted', function () {
    $category = Category::factory()->create();
    Product::factory()->create(['category_id' => $category->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.categories.destroy', $category))
        ->assertRedirect(route('admin.categories.index'));

    expect(Category::count())->toBe(1);
});

test('the create form is not reachable by a guest', function () {
    $this->post(route('admin.categories.store'), ['name' => 'Dessert'])
        ->assertRedirect(route('login'));

    expect(Category::count())->toBe(0);
});
