<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'method' => PaymentMethod::Cash,
            'amount' => fake()->randomFloat(2, 10_000, 500_000),
            'paid_at' => now(),
        ];
    }

    /**
     * Indicate the payment was made with the given method.
     */
    public function method(PaymentMethod $method): static
    {
        return $this->state(fn (array $attributes) => [
            'method' => $method,
        ]);
    }

    /**
     * Indicate the payment has not been marked as paid yet.
     */
    public function unpaid(): static
    {
        return $this->state(fn (array $attributes) => [
            'paid_at' => null,
        ]);
    }
}
