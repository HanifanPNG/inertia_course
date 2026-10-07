<?php

use App\Http\Middleware\RoleMiddleware;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

test('guests are redirected to login from role protected routes', function (string $routeName) {
    $this->get(route($routeName))->assertRedirect(route('login'));
})->with(['admin.dashboard', 'cashier.dashboard']);

test('an admin can access the admin dashboard', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.dashboard'))
        ->assertOk();
});

test('a cashier cannot access the admin dashboard', function () {
    $this->actingAs(User::factory()->cashier()->create())
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('a cashier can access the cashier dashboard', function () {
    $this->actingAs(User::factory()->cashier()->create())
        ->get(route('cashier.dashboard'))
        ->assertOk();
});

test('an admin cannot access the cashier dashboard', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('cashier.dashboard'))
        ->assertForbidden();
});

test('the shared dashboard entry sends both roles to their own dashboard', function (string $factoryState, string $routeName) {
    $this->actingAs(User::factory()->{$factoryState}()->create())
        ->get(route('dashboard'))
        ->assertRedirect(route($routeName));
})->with([
    'admin' => ['admin', 'admin.dashboard'],
    'cashier' => ['cashier', 'cashier.dashboard'],
]);

test('the middleware accepts any of the listed roles', function (User $user) {
    $middleware = new RoleMiddleware;
    $request = Request::create('/admin');
    $request->setUserResolver(fn (): User => $user);

    $response = $middleware->handle(
        $request,
        fn (): Response => response('ok'),
        User::ROLE_ADMIN,
        User::ROLE_CASHIER,
    );

    expect($response->getContent())->toBe('ok');
})->with([
    'admin' => fn () => User::factory()->admin()->create(),
    'cashier' => fn () => User::factory()->cashier()->create(),
]);

test('the middleware forbids a user whose role is not listed', function () {
    $middleware = new RoleMiddleware;
    $request = Request::create('/admin');
    $request->setUserResolver(fn (): User => User::factory()->cashier()->create());

    expect(fn () => $middleware->handle(
        $request,
        fn (): Response => response('ok'),
        User::ROLE_ADMIN,
    ))->toThrow(HttpException::class);
});

test('the middleware forbids a request without an authenticated user', function () {
    $middleware = new RoleMiddleware;
    $request = Request::create('/admin');

    expect(fn () => $middleware->handle(
        $request,
        fn (): Response => response('ok'),
        User::ROLE_ADMIN,
    ))->toThrow(HttpException::class);
});
