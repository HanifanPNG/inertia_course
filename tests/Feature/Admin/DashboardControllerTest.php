<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->cashier = User::factory()->cashier()->create();
});

test('guests are redirected to the login page', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});

test('only admins can view the dashboard', function () {
    $this->actingAs($this->cashier)->get(route('admin.dashboard'))->assertForbidden();

    $this->actingAs($this->admin)->get(route('admin.dashboard'))->assertOk();
});

test('the dashboard summarises today sales', function () {
    $nasi = Product::factory()->create(['name' => 'Nasi Goreng', 'price' => 25_000]);
    $es = Product::factory()->create(['name' => 'Es Teh', 'price' => 5_000]);

    $order = Order::factory()->completed()->create(['total_amount' => 85_000]);
    OrderItem::factory()->forProduct($nasi, 3)->create(['order_id' => $order->id]);
    OrderItem::factory()->forProduct($es, 1)->create(['order_id' => $order->id]);

    Order::factory()->completed()->create(['total_amount' => 15_000]);
    Order::factory()->create(['total_amount' => 40_000]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/dashboard')
            ->where('summary.revenue', '100000.00')
            ->where('summary.transactions', 3)
            ->where('summary.items_sold', 4)
            ->where('summary.paid_orders', 2)
            ->where('bestSellers.0.name', 'Nasi Goreng')
            ->where('bestSellers.0.quantity', 3)
        );
});

test('the dashboard excludes other days', function () {
    Order::factory()->completed()->onDate(today()->subDay()->toDateString())
        ->create(['total_amount' => 99_000]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('summary.revenue', '0.00')
            ->where('summary.transactions', 0)
            ->has('bestSellers', 0)
        );
});

test('the dashboard shows an empty state without sales', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('summary.transactions', 0)
            ->has('bestSellers', 0)
        );
});

test('the dashboard chart covers the last fourteen days by default', function () {
    Order::factory()->completed()->create([
        'total_amount' => 50_000,
        'order_date' => today()->toDateString(),
    ]);
    Order::factory()->paid()->create([
        'total_amount' => 25_000,
        'order_date' => today()->subDays(3)->toDateString(),
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('chart.period', 'daily')
            ->where('chart.window', '14 hari terakhir')
            ->has('chart.points', 14)
            ->where('chart.points.13.key', today()->toDateString())
            ->where('chart.points.13.label', today()->format('d/m'))
            ->where('chart.points.13.value', 50_000)
            ->where('chart.points.13.is_current', true)
            ->where('chart.points.10.value', 25_000)
            ->where('chart.points.0.value', 0)
        );
});

test('the dashboard chart can look back by week and by month', function (string $period, int $points, string $window) {
    Order::factory()->completed()->create([
        'total_amount' => 75_000,
        'order_date' => today()->subDays(2)->toDateString(),
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard', ['chart' => $period]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('chart.period', $period)
            ->where('chart.window', $window)
            ->has('chart.points', $points)
            ->where('chart.points', fn ($series): bool => collect($series)
                ->last()['value'] === 75_000)
        );
})->with([
    'weekly' => ['weekly', 8, '8 minggu terakhir'],
    'monthly' => ['monthly', 6, '6 bulan terakhir'],
]);

test('the dashboard chart ignores orders that were never paid', function () {
    Order::factory()->create([
        'total_amount' => 500_000,
        'order_date' => today()->toDateString(),
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('chart.points.13.value', 0)
        );
});

test('the dashboard chart rejects an unknown period', function () {
    $this->actingAs($this->admin)
        ->from(route('admin.dashboard'))
        ->get(route('admin.dashboard', ['chart' => 'yearly']))
        ->assertRedirect(route('admin.dashboard'))
        ->assertSessionHasErrors('chart');
});
