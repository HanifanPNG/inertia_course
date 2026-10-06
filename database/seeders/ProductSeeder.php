<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Menu demo. `category` harus cocok dengan `name` di `CategorySeeder`.
     *
     * @var list<array{category: string, name: string, price: string}>
     */
    private const PRODUCTS = [
        ['category' => 'Makanan', 'name' => 'Nasi Goreng Spesial', 'price' => '28000'],
        ['category' => 'Makanan', 'name' => 'Mie Goreng Jahe', 'price' => '26000'],
        ['category' => 'Makanan', 'name' => 'Ayam Bakar Madu', 'price' => '35000'],
        ['category' => 'Minuman', 'name' => 'Es Teh Manis', 'price' => '8000'],
        ['category' => 'Minuman', 'name' => 'Kopi Susu Gula Aren', 'price' => '22000'],
        ['category' => 'Camilan', 'name' => 'Kentang Goreng', 'price' => '18000'],
        ['category' => 'Camilan', 'name' => 'Kerupuk Udang', 'price' => '15000'],
        ['category' => 'Dessert', 'name' => 'Es Krim Stroberi', 'price' => '19000'],
        ['category' => 'Dessert', 'name' => 'Pisang Cokelat', 'price' => '17000'],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = Category::query()
            ->whereIn('name', array_column(self::PRODUCTS, 'category'))
            ->pluck('id', 'name');

        foreach (self::PRODUCTS as $product) {
            Product::updateOrCreate(
                ['name' => $product['name']],
                [
                    'category_id' => $categories[$product['category']],
                    'price' => $product['price'],
                    'is_active' => true,
                ],
            );
        }
    }
}
