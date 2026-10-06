<?php

use App\Models\User;

test('seeding creates an admin and a cashier account', function () {
    $this->seed();

    expect(User::where('email', 'admin@example.com')->sole())
        ->role->toBe(User::ROLE_ADMIN)
        ->email_verified_at->not->toBeNull();

    expect(User::where('email', 'cashier@example.com')->sole())
        ->role->toBe(User::ROLE_CASHIER)
        ->email_verified_at->not->toBeNull();
});

test('seeded accounts can log in', function () {
    $this->seed();

    $this->post(route('login.store'), [
        'email' => 'admin@example.com',
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
});

test('seeding can be run repeatedly without duplicating accounts', function () {
    $this->seed();
    $this->seed();

    expect(User::whereIn('email', ['admin@example.com', 'cashier@example.com'])->count())
        ->toBe(2);
});
