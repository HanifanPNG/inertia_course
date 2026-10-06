<?php

namespace App\Concerns;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

trait SummarizesSales
{
    /**
     * Orders that count as a sale: paid or completed.
     *
     * @return Builder<Order>
     */
    protected function settledOrders(): Builder
    {
        return Order::query()->whereIn('status', [
            OrderStatus::Paid,
            OrderStatus::Completed,
        ]);
    }

    /**
     * Total revenue of the given orders.
     *
     * @param  Builder<Order>  $orders
     */
    protected function revenue(Builder $orders): string
    {
        return number_format((float) (clone $orders)->sum('total_amount'), 2, '.', '');
    }

    /**
     * Number of ordered items across the given orders.
     *
     * @param  Builder<Order>  $orders
     */
    protected function itemsSold(Builder $orders): int
    {
        return (int) OrderItem::query()
            ->whereIn('order_id', (clone $orders)->select('id'))
            ->sum('quantity');
    }

    /**
     * Best selling products across the given orders.
     *
     * Uses the `product_name` snapshot so deleted products still appear. The
     * fallback for legacy rows without a snapshot is handled by the query only
     * needing the name column.
     *
     * @param  Builder<Order>  $orders
     * @return Collection<int, OrderItem>
     */
    protected function bestSellers(Builder $orders, int $limit = 5): Collection
    {
        return OrderItem::query()
            ->whereIn('order_id', (clone $orders)->select('id'))
            ->selectRaw('product_name, SUM(quantity) as quantity')
            ->groupBy('product_name')
            ->orderByDesc('quantity')
            ->limit($limit)
            ->get();
    }

    /**
     * Revenue per payment method for the given orders.
     *
     * @param  Builder<Order>  $orders
     * @return array<int, array{method: string, label: string, amount: string}>
     */
    protected function paymentBreakdown(Builder $orders): array
    {
        $row = Order::query()
            ->join('payments', 'payments.order_id', '=', 'orders.id')
            ->whereIn('orders.id', (clone $orders)->select('id'))
            ->selectRaw('payments.method as method, SUM(payments.amount) as amount')
            ->groupBy('payments.method')
            ->pluck('amount', 'method');

        return array_map(
            fn (PaymentMethod $method): array => [
                'method' => $method->value,
                'label' => $method->label(),
                'amount' => number_format((float) ($row[$method->value] ?? 0), 2, '.', ''),
            ],
            PaymentMethod::cases(),
        );
    }
}
