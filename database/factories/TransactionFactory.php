<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        $balanceBefore = fake()->randomFloat(2, 0, 100);
        $amount = fake()->randomFloat(2, 1, 50);

        return [
            'user_id' => User::factory(),
            'transaction_type' => fake()->randomElement(['coin_insert', 'print_deduction', 'refund']),
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceBefore + $amount,
            'print_job_id' => null,
            'description' => fake()->sentence(),
            'session_id' => fake()->uuid(),
        ];
    }

    public function coinInsert(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'coin_insert',
            'amount' => fake()->randomElement([1.00, 5.00, 10.00, 20.00]),
            'description' => 'Coin inserted',
        ]);
    }

    public function printDeduction(): static
    {
        return $this->state(function (array $attributes) {
            $amount = fake()->randomFloat(2, 5, 50);

            return [
                'transaction_type' => 'print_deduction',
                'amount' => $amount,
                'balance_after' => $attributes['balance_before'] - $amount,
                'description' => 'Print job payment',
            ];
        });
    }

    public function refund(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'refund',
            'description' => 'Refund - Print job failed',
        ]);
    }
}
