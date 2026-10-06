<?php

use App\Http\Controllers\Cashier\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:cashier'])->group(function () {
    Route::get('cashier/dashboard', [OrderController::class, 'dashboard'])
        ->name('cashier.dashboard');

    Route::get('cashier/orders', [OrderController::class, 'index'])
        ->name('cashier.orders.index');
    Route::get('cashier/orders/create', [OrderController::class, 'create'])
        ->name('cashier.orders.create');
    Route::post('cashier/orders', [OrderController::class, 'store'])
        ->name('cashier.orders.store');
    Route::post('cashier/orders/checkout', [OrderController::class, 'checkout'])
        ->name('cashier.orders.checkout');
    Route::get('cashier/orders/{order}', [OrderController::class, 'show'])
        ->name('cashier.orders.show');
    Route::get('cashier/orders/{order}/print', [OrderController::class, 'print'])
        ->name('cashier.orders.print');
    Route::get('cashier/orders/{order}/edit', [OrderController::class, 'edit'])
        ->name('cashier.orders.edit');
    Route::put('cashier/orders/{order}', [OrderController::class, 'update'])
        ->name('cashier.orders.update');
    Route::patch('cashier/orders/{order}/status', [OrderController::class, 'updateStatus'])
        ->name('cashier.orders.status.update');
    Route::delete('cashier/orders/{order}', [OrderController::class, 'destroy'])
        ->name('cashier.orders.destroy');
});
