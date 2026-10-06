<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_number' => fake()->unique()->numberBetween(1, 10000),
            'order_date' => now()->toDateString(),
            'user_id' => User::factory()->cashier(),
            'total_amount' => fake()->randomFloat(2, 10_000, 500_000),
            'status' => OrderStatus::Pending,
        ];
    }

    /**
     * Indicate that the order has been paid.
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Paid,
        ]);
    }

    /**
     * Indicate that the order has been completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Completed,
        ]);
    }

    /**
     * Indicate that the order belongs to the given date.
     */
    public function onDate(string $date): static
    {
        return $this->state(fn (array $attributes) => [
            'order_date' => $date,
        ]);
    }
}
