<?php

use App\Models\User;

test('the dashboard entry sends an admin to the admin dashboard', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('dashboard'))
        ->assertRedirect(route('admin.dashboard'));
});

test('the dashboard entry sends a cashier to the point of sale', function () {
    $this->actingAs(User::factory()->cashier()->create())
        ->get(route('dashboard'))
        ->assertRedirect(route('cashier.dashboard'));
});

test('a guest cannot use the dashboard entry', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('the root url reaches the role dashboard', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get('/')
        ->assertRedirect(route('dashboard'));
});
