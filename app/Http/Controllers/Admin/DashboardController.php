<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\SummarizesSales;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use SummarizesSales;

    /**
     * Show the admin dashboard with today's key numbers.
     */
    public function index(): Response
    {
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
        ]);
    }
}
