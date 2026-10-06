<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Qris = 'qris';
    case Debit = 'debit';

    /**
     * Label yang ditampilkan ke user.
     */
    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::Qris => 'QRIS',
            self::Debit => 'Debit',
        };
    }
}
