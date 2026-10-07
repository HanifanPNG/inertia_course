<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    /*
     * Every user has a real dashboard of their own: the owner reads reports,
     * the cashier opens the point of sale. `/dashboard` is the way in after
     * login, so it sends each role where it belongs instead of rendering an
     * empty placeholder page.
     */
    Route::get('dashboard', function (Request $request) {
        return redirect()->route(
            $request->user()->isAdmin() ? 'admin.dashboard' : 'cashier.dashboard',
        );
    })->name('dashboard');
});

require __DIR__.'/admin.php';
require __DIR__.'/cashier.php';
require __DIR__.'/settings.php';
