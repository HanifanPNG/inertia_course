<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Debit card payments are no longer offered: the counter only takes cash
     * and QRIS.
     *
     * Rows already stored with `method = 'debit'` are removed, because the
     * `PaymentMethod` enum no longer knows how to read that value and a receipt
     * must never name a method the shop does not accept. The money those orders
     * carried stays on the order total and the orders keep their status, so the
     * sales reports do not change.
     */
    public function up(): void
    {
        DB::table('payments')->where('method', 'debit')->delete();
    }

    /**
     * The removed payment rows cannot be reconstructed, so there is nothing
     * meaningful to undo here.
     */
    public function down(): void
    {
        //
    }
};
