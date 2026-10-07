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

class DashboardController extends Controller
{
    use SummarizesSales;

    /**
     * Short Indonesian month names, used for the monthly revenue axis.
     *
     * @var array<int, string>
     */
    private const MONTH_SHORT = [
        1 => 'Jan',
        2 => 'Feb',
        3 => 'Mar',
        4 => 'Apr',
        5 => 'Mei',
        6 => 'Jun',
        7 => 'Jul',
        8 => 'Agu',
        9 => 'Sep',
        10 => 'Okt',
        11 => 'Nov',
        12 => 'Des',
    ];

    /**
     * How many buckets each revenue chart looks back.
     *
     * @var array<string, int>
     */
    private const CHART_WINDOWS = [
        'daily' => 14,
        'weekly' => 8,
        'monthly' => 6,
    ];

    /**
     * Show the admin dashboard with today's key numbers and the revenue trend.
     */
    public function index(Request $request): Response
    {
        $data = $request->validate([
            'chart' => ['nullable', 'in:daily,weekly,monthly'],
        ]);

        $period = $data['chart'] ?? 'daily';

        $today = $this->settledOrders()->onDate(today());

        return Inertia::render('admin/dashboard', [
            'summary' => [
                'revenue' => $this->revenue($today),
                'transactions' => Order::query()->onDate(today())->count(),
                'items_sold' => $this->itemsSold($today),
                'paid_orders' => $today->count(),
            ],
            'bestSellers' => $this->bestSellers($today, 5)
                ->map(fn ($row): array => [
                    'name' => $row->product_name,
                    'quantity' => (int) $row->quantity,
                ])
                ->all(),
            'chart' => $this->revenueSeries($period),
        ]);
    }

    /**
     * The revenue of the last periods, bucketed by day, week, or month.
     *
     * Empty buckets are kept as zero so the axis stays continuous: a closed day
     * with no sales is information, not a gap to be drawn over.
     *
     * @return array{period: string, window: string, points: array<int, array{key: string, label: string, value: float, is_current: bool}>}
     */
    private function revenueSeries(string $period): array
    {
        $buckets = $this->buckets($period);
        $window = count($buckets);

        $revenueByDay = DB::table('orders')
            ->selectRaw('DATE(order_date) as day, SUM(total_amount) as revenue')
            ->whereIn('status', [
                OrderStatus::Paid->value,
                OrderStatus::Completed->value,
            ])
            ->whereDate('order_date', '>=', $buckets[0]['from'])
            ->whereDate('order_date', '<=', $buckets[$window - 1]['to'])
            ->groupBy('day')
            ->pluck('revenue', 'day');

        $currentKey = $buckets[$window - 1]['key'];

        $points = array_map(function (array $bucket) use ($revenueByDay, $currentKey): array {
            $total = 0.0;

            for (
                $day = CarbonImmutable::parse($bucket['from']);
                $day->lessThanOrEqualTo($bucket['to']);
                $day = $day->addDay()
            ) {
                $total += (float) ($revenueByDay[$day->toDateString()] ?? 0);
            }

            return [
                'key' => $bucket['key'],
                'label' => $bucket['label'],
                'value' => round($total, 2),
                'is_current' => $bucket['key'] === $currentKey,
            ];
        }, $buckets);

        return [
            'period' => $period,
            'window' => match ($period) {
                'weekly' => $window.' minggu terakhir',
                'monthly' => $window.' bulan terakhir',
                default => $window.' hari terakhir',
            },
            'points' => $points,
        ];
    }

    /**
     * The bucket boundaries of the chart, oldest first.
     *
     * @return array<int, array{key: string, label: string, from: string, to: string}>
     */
    private function buckets(string $period): array
    {
        $window = self::CHART_WINDOWS[$period] ?? self::CHART_WINDOWS['daily'];
        $today = CarbonImmutable::today()->startOfDay();
        $buckets = [];

        for ($offset = $window - 1; $offset >= 0; $offset--) {
            if ($period === 'monthly') {
                $start = $today->subMonths($offset)->startOfMonth();
                $end = $start->endOfMonth();

                $buckets[] = [
                    'key' => $start->format('Y-m'),
                    'label' => self::MONTH_SHORT[(int) $start->format('n')],
                    'from' => $start->toDateString(),
                    'to' => $end->toDateString(),
                ];

                continue;
            }

            $anchor = $period === 'weekly'
                ? $today->subWeeks($offset)->startOfWeek()
                : $today->subDays($offset);

            $end = $period === 'weekly' ? $anchor->endOfWeek() : $anchor;

            $buckets[] = [
                'key' => $anchor->format($period === 'weekly' ? 'Y-\WW' : 'Y-m-d'),
                'label' => $anchor->format('d/m'),
                'from' => $anchor->toDateString(),
                'to' => $end->toDateString(),
            ];
        }

        return $buckets;
    }
}
