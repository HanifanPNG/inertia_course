<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\SummarizesSales;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    use SummarizesSales;

    /**
     * Show the sales report (daily or monthly) for a filtered period.
     */
    public function index(Request $request): Response
    {
        $filters = $this->filters($request);
        $report = $this->report($filters['from'], $filters['to']);

        return Inertia::render('admin/reports/index', [
            'filters' => [
                'period' => $filters['period'],
                'date' => $filters['date'],
                'month' => $filters['month'],
            ],
            'report' => $report,
        ]);
    }

    /**
     * Download the report rows as a CSV file.
     */
    public function export(Request $request): StreamedResponse
    {
        $filters = $this->filters($request);
        $report = $this->report($filters['from'], $filters['to']);

        $name = sprintf(
            'sales-report-%s-%s.csv',
            $filters['period'],
            $filters['period'] === 'daily' ? $filters['date'] : $filters['month'],
        );

        return new StreamedResponse(function () use ($report): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Tanggal', 'Jumlah Transaksi', 'Total Pendapatan']);

            foreach ($report['rows'] as $row) {
                fputcsv($handle, [
                    $row['date'],
                    $row['transactions'],
                    $row['revenue'],
                ]);
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => HeaderUtils::makeDisposition(
                HeaderUtils::DISPOSITION_ATTACHMENT,
                $name,
            ),
        ]);
    }

    /**
     * Normalize and validate the report filters.
     *
     * @return array{period: 'daily'|'monthly', date: string, month: string, from: CarbonImmutable, to: CarbonImmutable}
     */
    private function filters(Request $request): array
    {
        $data = $request->validate([
            'period' => ['nullable', 'in:daily,monthly'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'month' => ['nullable', 'date_format:Y-m'],
        ]);

        $period = $data['period'] ?? 'daily';

        if ($period === 'daily') {
            $date = CarbonImmutable::createFromFormat('Y-m-d', ($data['date'] ?? '') ?: today()->toDateString());

            return [
                'period' => 'daily',
                'date' => $date->toDateString(),
                'month' => $date->format('Y-m'),
                'from' => $date->startOfDay(),
                'to' => $date->endOfDay(),
            ];
        }

        $month = CarbonImmutable::createFromFormat('Y-m', ($data['month'] ?? '') ?: today()->format('Y-m'));

        return [
            'period' => 'monthly',
            'date' => $month->toDateString(),
            'month' => $month->format('Y-m'),
            'from' => $month->startOfMonth()->startOfDay(),
            'to' => $month->endOfMonth()->endOfDay(),
        ];
    }

    /**
     * Build the sales report rows and summary for the given period.
     *
     * @return array{rows: array<int, array{date: string, transactions: int, paid_orders: int, revenue: string, items: int, best_seller: string}>, summary: array{transactions: int, paid_orders: int, revenue: string, items_sold: int, best_seller: array{name: string, quantity: int}|null, payments: array<int, array{method: string, label: string, amount: string}>}}
     */
    private function report(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $settled = $this->settledOrders()->betweenDates($from, $to);
        $range = [$from->toDateString(), $to->toDateString()];
        $settledStatuses = [
            OrderStatus::Paid->value,
            OrderStatus::Completed->value,
        ];

        $byDay = DB::table('orders')
            ->selectRaw('order_date, COUNT(*) as transactions')
            ->whereDate('order_date', '>=', $range[0])
            ->whereDate('order_date', '<=', $range[1])
            ->groupBy('order_date')
            ->orderBy('order_date')
            ->get();

        $settledByDay = DB::table('orders')
            ->selectRaw('order_date, SUM(total_amount) as revenue, COUNT(*) as paid_orders')
            ->whereDate('order_date', '>=', $range[0])
            ->whereDate('order_date', '<=', $range[1])
            ->whereIn('status', $settledStatuses)
            ->groupBy('order_date')
            ->get()
            ->keyBy('order_date');

        $salesByDay = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereDate('orders.order_date', '>=', $range[0])
            ->whereDate('orders.order_date', '<=', $range[1])
            ->whereIn('orders.status', $settledStatuses)
            ->selectRaw(
                'orders.order_date as order_date, order_items.product_name as product_name, SUM(order_items.quantity) as quantity'
            )
            ->groupBy('orders.order_date', 'order_items.product_name')
            ->get()
            ->groupBy('order_date');

        $rows = $byDay->map(function ($row) use ($settledByDay, $salesByDay): array {
            $settledRow = $settledByDay->get($row->order_date);
            $sales = $salesByDay->get($row->order_date, collect());
            $best = $sales->sortByDesc('quantity')->first();

            return [
                'date' => CarbonImmutable::parse((string) $row->order_date)->toDateString(),
                'transactions' => (int) $row->transactions,
                'paid_orders' => (int) ($settledRow->paid_orders ?? 0),
                'revenue' => number_format((float) ($settledRow->revenue ?? 0), 2, '.', ''),
                'items' => (int) $sales->sum('quantity'),
                'best_seller' => (string) ($best->product_name ?? '-'),
            ];
        })->all();

        $bestSeller = $this->bestSellers($settled, 1)->first();

        return [
            'rows' => $rows,
            'summary' => [
                'transactions' => Order::query()->betweenDates($from, $to)->count(),
                'paid_orders' => $settled->count(),
                'revenue' => $this->revenue($settled),
                'items_sold' => $this->itemsSold($settled),
                'best_seller' => $bestSeller ? [
                    'name' => (string) $bestSeller->product_name,
                    'quantity' => (int) $bestSeller->quantity,
                ] : null,
                'payments' => $this->paymentBreakdown($settled),
            ],
        ];
    }
}
