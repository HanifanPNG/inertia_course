<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $price = fake()->randomFloat(2, 8_000, 150_000);
        $quantity = fake()->numberBetween(1, 5);

        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'product_name' => function (array $attributes): string {
                $product = Product::find($attributes['product_id']);

                return $product instanceof Product ? $product->name : 'Produk dihapus';
            },
            'quantity' => $quantity,
            'price' => $price,
            'subtotal' => round($price * $quantity, 2),
        ];
    }

    /**
     * Indicate the order item records the given quantity of a product.
     */
    public function forProduct(Product $product, int $quantity): static
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => $quantity,
            'price' => $product->price,
            'subtotal' => round((float) $product->price * $quantity, 2),
        ]);
    }
}
