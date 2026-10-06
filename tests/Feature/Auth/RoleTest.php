<?php

use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('users are created with the cashier role by default', function () {
    $user = User::factory()->create();

    expect($user->role)->toBe(User::ROLE_CASHIER)
        ->and($user->isCashier())->toBeTrue()
        ->and($user->isAdmin())->toBeFalse();
});

test('admin factory state assigns the admin role', function () {
    $user = User::factory()->admin()->create();

    expect($user->role)->toBe(User::ROLE_ADMIN)
        ->and($user->isAdmin())->toBeTrue()
        ->and($user->isCashier())->toBeFalse();
});

test('registration ignores a role submitted in the payload', function () {
    $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => User::ROLE_ADMIN,
    ])->assertRedirect(route('dashboard', absolute: false));

    expect(User::where('email', 'test@example.com')->sole()->role)
        ->toBe(User::ROLE_CASHIER);
});
