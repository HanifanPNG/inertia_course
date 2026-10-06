<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Kategori default restoran, dipakai untuk master data & demo.
     *
     * @var list<array{name: string, description: string|null}>
     */
    private const CATEGORIES = [
        ['name' => 'Makanan', 'description' => 'Menu makanan utama'],
        ['name' => 'Minuman', 'description' => 'Minuman dingin dan hangat'],
        ['name' => 'Camilan', 'description' => null],
        ['name' => 'Dessert', 'description' => 'Penutup makan'],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::CATEGORIES as $category) {
            Category::updateOrCreate(
                ['name' => $category['name']],
                ['description' => $category['description']],
            );
        }
    }
}
