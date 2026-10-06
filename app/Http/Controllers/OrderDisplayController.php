<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderDisplayController extends Controller
{
    /**
     * Show today's orders for a wall/TV display.
     */
    public function index(Request $request): Response
    {
        $data = $request->validate([
            'status' => ['nullable', 'in:all,pending,paid,completed'],
        ]);

        $filter = $data['status'] ?? 'all';

        $today = Order::query()->onDate(today());

        $orders = (clone $today)
            ->when($filter !== 'all', fn ($query) => $query->status(OrderStatus::from($filter)))
            ->orderByDesc('order_number')
            ->limit(100)
            ->get()
            ->map(fn (Order $order): array => [
                'id' => $order->id,
                'number' => $order->order_number,
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
            ])
            ->all();

        $counts = [
            'all' => (clone $today)->count(),
            'pending' => (clone $today)->status(OrderStatus::Pending)->count(),
            'paid' => (clone $today)->status(OrderStatus::Paid)->count(),
            'completed' => (clone $today)->status(OrderStatus::Completed)->count(),
        ];

        return Inertia::render('orders/display', [
            'orders' => $orders,
            'counts' => $counts,
            'filter' => $filter,
            'filters' => [
                ['value' => 'all', 'label' => 'All'],
                ['value' => 'pending', 'label' => 'Pending'],
                ['value' => 'paid', 'label' => 'Paid'],
                ['value' => 'completed', 'label' => 'Completed'],
            ],
        ]);
    }
}
