<?php

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->cashier = User::factory()->cashier()->create();
    $this->category = Category::factory()->create(['name' => 'Makanan']);
});

test('only admins can manage products', function (string $routeName) {
    $this->actingAs($this->cashier)->get(route($routeName))->assertForbidden();

    $this->actingAs($this->admin)->get(route($routeName))->assertOk();
})->with([
    'index' => 'admin.products.index',
    'create' => 'admin.products.create',
]);

test('the product list shows products with their category', function () {
    $product = Product::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Nasi Goreng',
        'price' => 25000,
    ]);
    $other = Product::factory()->create(['name' => 'Es Teh']);

    $this->actingAs($this->admin)
        ->get(route('admin.products.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/products/index')
            ->has('products', 2)
            ->where('products.0.name', 'Es Teh')
            ->where('products.1.name', 'Nasi Goreng')
            ->where('products.1.price', '25000.00')
            ->where('products.1.category.name', 'Makanan')
        );
});

test('the product form receives the available categories', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.products.create'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/products/create')
            ->has('categories', 1)
            ->where('categories.0.id', $this->category->id)
            ->where('categories.0.name', 'Makanan')
        );
});

test('a product can be created', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => 'Nasi Goreng',
            'description' => 'Nasi goreng khas restoran',
            'price' => 25000.50,
            'is_active' => 1,
        ])
        ->assertRedirect(route('admin.products.index'));

    $product = Product::where('name', 'Nasi Goreng')->sole();

    expect($product->category_id)->toBe($this->category->id)
        ->and($product->description)->toBe('Nasi goreng khas restoran')
        ->and($product->price)->toEqual('25000.50')
        ->and($product->is_active)->toBeTrue();
});

test('a product is active by default when is_active is not sent', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => 'Es Teh',
            'price' => 8000,
        ]);

    expect(Product::where('name', 'Es Teh')->sole()->is_active)->toBeTrue();
});

test('a product can be created as inactive', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => 'Menu Habis',
            'price' => 8000,
            'is_active' => 0,
        ]);

    expect(Product::where('name', 'Menu Habis')->sole()->is_active)->toBeFalse();
});

test('a product requires a name', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => '',
            'price' => 8000,
        ])
        ->assertSessionHasErrors('name');

    expect(Product::count())->toBe(0);
});

test('a product requires an existing category', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), ['name' => 'Es Teh', 'price' => 8000])
        ->assertSessionHasErrors('category_id');

    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => 9999,
            'name' => 'Es Teh',
            'price' => 8000,
        ])
        ->assertSessionHasErrors('category_id');

    expect(Product::count())->toBe(0);
});

test('a product name must be unique', function () {
    Product::factory()->create(['name' => 'Nasi Goreng']);

    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
        ])
        ->assertSessionHasErrors('name');

    expect(Product::where('name', 'Nasi Goreng')->count())->toBe(1);
});

test('a product name is unique in the database too', function () {
    Product::factory()->create(['name' => 'Nasi Goreng']);

    expect(fn () => Product::create([
        'category_id' => $this->category->id,
        'name' => 'Nasi Goreng',
        'price' => 25000,
    ]))->toThrow(QueryException::class);
});

test('a product keeps its own name when updated', function () {
    $product = Product::factory()->create(['name' => 'Nasi Goreng']);

    $this->actingAs($this->admin)
        ->put(route('admin.products.update', $product), [
            'category_id' => $this->category->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
        ])
        ->assertSessionHasNoErrors();

    expect($product->fresh()->name)->toBe('Nasi Goreng');
});

test('a product name cannot be taken by another product', function () {
    Product::factory()->create(['name' => 'Nasi Goreng']);
    $product = Product::factory()->create(['name' => 'Es Teh']);

    $this->actingAs($this->admin)
        ->put(route('admin.products.update', $product), [
            'category_id' => $this->category->id,
            'name' => 'Nasi Goreng',
            'price' => 8000,
        ])
        ->assertSessionHasErrors('name');

    expect($product->fresh()->name)->toBe('Es Teh');
});

test('a product image can be uploaded', function () {
    Storage::fake('public');

    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
            'image' => fakeImage('nasi.png'),
        ])
        ->assertRedirect(route('admin.products.index'));

    $product = Product::where('name', 'Nasi Goreng')->sole();

    expect($product->image)->not->toBeNull()
        ->and($product->image_url)->toContain('/storage/products/');

    Storage::disk('public')->assertExists($product->image);
});

test('a product image is optional', function () {
    Storage::fake('public');

    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => 'Es Teh',
            'price' => 8000,
        ]);

    $product = Product::where('name', 'Es Teh')->sole();

    expect($product->image)->toBeNull()
        ->and($product->image_url)->toBeNull();
});

test('a non image upload is rejected', function () {
    Storage::fake('public');

    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => 'Es Teh',
            'price' => 8000,
            'image' => UploadedFile::fake()->create('menu.pdf', 100),
        ])
        ->assertSessionHasErrors('image');

    expect(Product::count())->toBe(0);
});

test('replacing a product image deletes the previous file', function () {
    Storage::fake('public');

    $product = Product::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Nasi Goreng',
    ]);
    $oldPath = fakeImage('lama.png')->store('products', 'public');
    $product->update(['image' => $oldPath]);

    $this->actingAs($this->admin)
        ->put(route('admin.products.update', $product), [
            'category_id' => $this->category->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
            'image' => fakeImage('baru.png'),
        ]);

    $product = $product->fresh();

    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($product->image);
    expect($product->image)->not->toBe($oldPath);
});

test('deleting a product deletes its image', function () {
    Storage::fake('public');

    $product = Product::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Nasi Goreng',
    ]);
    $path = fakeImage('nasi.png')->store('products', 'public');
    $product->update(['image' => $path]);

    $this->actingAs($this->admin)
        ->delete(route('admin.products.destroy', $product))
        ->assertRedirect(route('admin.products.index'));

    Storage::disk('public')->assertMissing($path);
});

test('an image is not required when updating a product', function () {
    Storage::fake('public');

    $product = Product::factory()->create(['category_id' => $this->category->id]);
    $path = fakeImage('nasi.png')->store('products', 'public');
    $product->update(['image' => $path]);

    $this->actingAs($this->admin)
        ->put(route('admin.products.update', $product), [
            'category_id' => $this->category->id,
            'name' => 'Nasi Goreng Baru',
            'price' => 25000,
        ])
        ->assertSessionHasNoErrors();

    expect($product->fresh()->image)->toBe($path);

    Storage::disk('public')->assertExists($path);
});

test('a product requires a non negative price', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => 'Es Teh',
            'price' => -1,
        ])
        ->assertSessionHasErrors('price');

    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => 'Es Teh',
            'price' => 'bukan angka',
        ])
        ->assertSessionHasErrors('price');

    expect(Product::count())->toBe(0);
});

test('a price above the column capacity is rejected', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.products.store'), [
            'category_id' => $this->category->id,
            'name' => 'Menu Mahal',
            'price' => 100000000,
        ])
        ->assertSessionHasErrors('price');

    expect(Product::count())->toBe(0);
});

test('a product can be updated', function () {
    $product = Product::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Nasi Goreng',
        'is_active' => true,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.products.update', $product), [
            'category_id' => $this->category->id,
            'name' => 'Nasi Goreng Spesial',
            'price' => 27500,
            'is_active' => 0,
        ])
        ->assertRedirect(route('admin.products.index'));

    expect($product->fresh()->name)->toBe('Nasi Goreng Spesial')
        ->and($product->fresh()->price)->toEqual('27500.00')
        ->and($product->fresh()->is_active)->toBeFalse();
});

test('the edit form receives the product and the categories', function () {
    $product = Product::factory()->create(['category_id' => $this->category->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.products.edit', $product))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/products/edit')
            ->where('product.id', $product->id)
            ->where('product.category_id', $this->category->id)
            ->has('categories', 1)
        );
});

test('a product without order items can be deleted', function () {
    $product = Product::factory()->create();

    $this->actingAs($this->admin)
        ->delete(route('admin.products.destroy', $product))
        ->assertRedirect(route('admin.products.index'));

    expect(Product::count())->toBe(0);
});

test('a product used in an order can be deleted and keeps the order history', function () {
    $product = Product::factory()->create(['name' => 'Nasi Goreng']);
    $order = Order::factory()->create();
    $item = OrderItem::factory()->forProduct($product, 2)->create([
        'order_id' => $order->id,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.products.destroy', $product))
        ->assertRedirect(route('admin.products.index'));

    expect(Product::count())->toBe(0)
        ->and(Order::count())->toBe(1)
        ->and($item->fresh()->product_id)->toBeNull()
        ->and($item->fresh()->product_name)->toBe('Nasi Goreng');
});

test('products cannot be managed by a guest', function () {
    $this->post(route('admin.products.store'), [
        'category_id' => $this->category->id,
        'name' => 'Es Teh',
        'price' => 8000,
    ])->assertRedirect(route('login'));

    expect(Product::count())->toBe(0);
});
