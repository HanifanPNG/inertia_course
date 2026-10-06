<?php

use App\Http\Controllers\OrderDisplayController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('orders/display', [OrderDisplayController::class, 'index'])
        ->name('orders.display');
});

require __DIR__.'/admin.php';
require __DIR__.'/cashier.php';
require __DIR__.'/settings.php';
