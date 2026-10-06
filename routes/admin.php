<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\ProductController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::inertia('admin/dashboard', 'admin/index')->name('admin.dashboard');

    Route::get('admin/categories', [CategoryController::class, 'index'])
        ->name('admin.categories.index');
    Route::get('admin/categories/create', [CategoryController::class, 'create'])
        ->name('admin.categories.create');
    Route::post('admin/categories', [CategoryController::class, 'store'])
        ->name('admin.categories.store');
    Route::get('admin/categories/{category}/edit', [CategoryController::class, 'edit'])
        ->name('admin.categories.edit');
    Route::put('admin/categories/{category}', [CategoryController::class, 'update'])
        ->name('admin.categories.update');
    Route::delete('admin/categories/{category}', [CategoryController::class, 'destroy'])
        ->name('admin.categories.destroy');

    Route::get('admin/products', [ProductController::class, 'index'])
        ->name('admin.products.index');
    Route::get('admin/products/create', [ProductController::class, 'create'])
        ->name('admin.products.create');
    Route::post('admin/products', [ProductController::class, 'store'])
        ->name('admin.products.store');
    Route::get('admin/products/{product}/edit', [ProductController::class, 'edit'])
        ->name('admin.products.edit');
    Route::put('admin/products/{product}', [ProductController::class, 'update'])
        ->name('admin.products.update');
    Route::delete('admin/products/{product}', [ProductController::class, 'destroy'])
        ->name('admin.products.destroy');
});
