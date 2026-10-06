<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Produk sekarang boleh dihapus tanpa menggagalkan transaksi lama. Nama
     * produk pada `order_items` disimpan sebagai snapshot, sama seperti `price`
     * dan `subtotal`, supaya struk historis tetap utuh meski produknya hilang.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('product_name')->nullable()->after('product_id');
        });

        $this->backfillProductNames();

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('product_id')->nullable()->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropColumn('product_name');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('product_id')->nullable(false)->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->restrictOnDelete();
        });
    }

    /**
     * Fill the product name snapshot for existing order items.
     */
    private function backfillProductNames(): void
    {
        DB::table('order_items')
            ->select(['order_items.id', 'products.name'])
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->orderBy('order_items.id')
            ->chunk(500, function ($items): void {
                foreach ($items as $item) {
                    DB::table('order_items')
                        ->where('id', $item->id)
                        ->update(['product_name' => $item->name]);
                }
            });
    }
};
