<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Completed = 'completed';

    /**
     * Label yang ditampilkan ke user.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Paid => 'Paid',
            self::Completed => 'Completed',
        };
    }

    /**
     * Determine whether an order may move to the given status.
     *
     * Alur status (Tech Spec §7): PENDING → PAID → COMPLETED.
     */
    public function canTransitionTo(self $status): bool
    {
        return match ($this) {
            self::Pending => $status === self::Paid,
            self::Paid => $status === self::Completed,
            self::Completed => false,
        };
    }
}
