<?php

use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->cashier = User::factory()->cashier()->create();
});

test('guests are redirected to the login page', function () {
    $this->get(route('admin.reports.index'))->assertRedirect(route('login'));
});

test('only admins can view the report', function () {
    $this->actingAs($this->cashier)->get(route('admin.reports.index'))->assertForbidden();

    $this->actingAs($this->admin)->get(route('admin.reports.index'))->assertOk();
});

test('the report defaults to today', function () {
    Order::factory()->completed()->onDate(today()->toDateString())
        ->create(['total_amount' => 50_000]);
    Order::factory()->completed()->onDate(today()->subDay()->toDateString())
        ->create(['total_amount' => 70_000]);

    $this->actingAs($this->admin)
        ->get(route('admin.reports.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('admin/reports/index')
            ->where('filters.period', 'daily')
            ->where('filters.date', today()->toDateString())
            ->where('report.summary.revenue', '50000.00')
            ->where('report.summary.paid_orders', 1)
            ->where('report.rows.0.date', today()->toDateString())
            ->where('report.rows.0.revenue', '50000.00')
        );
});

test('the daily report can be filtered by a date', function () {
    Order::factory()->completed()->onDate('2026-10-01')->create(['total_amount' => 50_000]);
    Order::factory()->completed()->onDate('2026-10-02')->create(['total_amount' => 70_000]);

    $this->actingAs($this->admin)
        ->get(route('admin.reports.index', ['period' => 'daily', 'date' => '2026-10-02']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('filters.date', '2026-10-02')
            ->where('report.summary.revenue', '70000.00')
            ->has('report.rows', 1)
            ->where('report.rows.0.date', '2026-10-02')
        );
});

test('the monthly report aggregates a whole month', function () {
    Order::factory()->completed()->onDate('2026-10-01')->create(['total_amount' => 50_000]);
    Order::factory()->completed()->onDate('2026-10-15')->create(['total_amount' => 70_000]);
    Order::factory()->completed()->onDate('2026-09-30')->create(['total_amount' => 90_000]);
    Order::factory()->onDate('2026-10-20')->create(['total_amount' => 30_000]);

    $this->actingAs($this->admin)
        ->get(route('admin.reports.index', ['period' => 'monthly', 'month' => '2026-10']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('filters.period', 'monthly')
            ->where('filters.month', '2026-10')
            ->where('report.summary.revenue', '120000.00')
            ->where('report.summary.transactions', 3)
            ->where('report.summary.paid_orders', 2)
            ->has('report.rows', 3)
        );
});

test('the report groups revenue by payment method', function () {
    $cash = Order::factory()->completed()->create(['total_amount' => 10_000]);
    Payment::factory()->method(PaymentMethod::Cash)->create([
        'order_id' => $cash->id,
        'amount' => 10_000,
    ]);

    $qris = Order::factory()->completed()->create(['total_amount' => 20_000]);
    Payment::factory()->method(PaymentMethod::Qris)->create([
        'order_id' => $qris->id,
        'amount' => 20_000,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.reports.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('report.summary.payments.0.method', 'cash')
            ->where('report.summary.payments.0.amount', '10000.00')
            ->where('report.summary.payments.1.method', 'qris')
            ->where('report.summary.payments.1.amount', '20000.00')
            ->where('report.summary.payments.2.method', 'debit')
            ->where('report.summary.payments.2.amount', '0.00')
        );
});

test('the report rejects malformed dates', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.reports.index', ['period' => 'daily', 'date' => 'yesterday']))
        ->assertInvalid('date');
});

test('the report can be exported as csv', function () {
    Order::factory()->completed()->onDate('2026-10-02')->create(['total_amount' => 70_000]);

    $response = $this->actingAs($this->admin)
        ->get(route('admin.reports.export', ['period' => 'daily', 'date' => '2026-10-02']))
        ->assertOk();

    $csv = $response->streamedContent();

    expect($csv)
        ->toContain('Tanggal,"Jumlah Transaksi","Total Pendapatan"')
        ->toContain('2026-10-02,1,70000.00');
});
