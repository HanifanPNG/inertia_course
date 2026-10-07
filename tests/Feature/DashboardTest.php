<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('the shared dashboard entry forwards each role to its own dashboard', function (string $factoryState, string $routeName) {
    $this->actingAs(User::factory()->{$factoryState}()->create())
        ->get(route('dashboard'))
        ->assertRedirect(route($routeName));
})->with([
    'admin' => ['admin', 'admin.dashboard'],
    'cashier' => ['cashier', 'cashier.dashboard'],
]);
