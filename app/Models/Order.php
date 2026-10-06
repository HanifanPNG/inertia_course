<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Carbon\CarbonInterface;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_number
 * @property Carbon $order_date
 * @property int $user_id
 * @property string $total_amount
 * @property OrderStatus $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Collection<int, OrderItem> $orderItems
 * @property-read Payment|null $payment
 */
#[Fillable(['order_number', 'order_date', 'user_id', 'total_amount', 'status'])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    /**
     * The model's default values for new instances.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'total_amount' => 0,
        'status' => OrderStatus::Pending,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'total_amount' => 'decimal:2',
            'status' => OrderStatus::class,
        ];
    }

    /**
     * Scope a query to only include orders with the given status.
     *
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    #[Scope]
    protected function status(Builder $query, OrderStatus $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include orders from the given date.
     *
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    #[Scope]
    protected function onDate(Builder $query, CarbonInterface $date): Builder
    {
        return $query->whereDate('order_date', $date);
    }

    /**
     * Scope a query to only include orders between two dates, inclusive.
     *
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    #[Scope]
    protected function betweenDates(Builder $query, CarbonInterface $from, CarbonInterface $to): Builder
    {
        return $query
            ->whereDate('order_date', '>=', $from->toDateString())
            ->whereDate('order_date', '<=', $to->toDateString());
    }

    /**
     * Get the cashier that created the order.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the order items that belong to the order.
     *
     * @return HasMany<OrderItem, $this>
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the payment recorded for the order.
     *
     * @return HasOne<Payment, $this>
     */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }
}
