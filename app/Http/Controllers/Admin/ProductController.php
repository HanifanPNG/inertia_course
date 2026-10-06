<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Show the product list page.
     */
    public function index(): Response
    {
        return Inertia::render('admin/products/index', [
            'products' => Product::query()
                ->with('category:id,name')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Show the product create page.
     */
    public function create(): Response
    {
        return Inertia::render('admin/products/create', [
            'categories' => $this->categoryOptions(),
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(ProductRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        Product::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Produk berhasil ditambahkan.']);

        return to_route('admin.products.index');
    }

    /**
     * Show the product edit page.
     */
    public function edit(Product $product): Response
    {
        return Inertia::render('admin/products/edit', [
            'product' => $product,
            'categories' => $this->categoryOptions(),
        ]);
    }

    /**
     * Update the given product.
     */
    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        unset($data['image']);

        if ($request->hasFile('image')) {
            $this->deleteImage($product);
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Produk berhasil diperbarui.']);

        return to_route('admin.products.index');
    }

    /**
     * Delete the given product.
     *
     * Order items keep a `product_name` snapshot and the foreign key is set to
     * null on delete, so past transactions stay intact.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $this->deleteImage($product);
        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Produk berhasil dihapus.']);

        return to_route('admin.products.index');
    }

    /**
     * Remove the stored image of the given product, if any.
     */
    private function deleteImage(Product $product): void
    {
        if ($product->image !== null) {
            Storage::disk('public')->delete($product->image);
        }
    }

    /**
     * Categories offered by the product form.
     *
     * @return Collection<int, array{id: int, name: string}>
     */
    private function categoryOptions(): Collection
    {
        return Category::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
            ]);
    }
}
