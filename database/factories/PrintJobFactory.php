<?php

namespace Database\Factories;

use App\Models\PrintJob;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PrintJobFactory extends Factory
{
    protected $model = PrintJob::class;

    public function definition(): array
    {
        $pages = fake()->numberBetween(1, 50);
        $copies = fake()->numberBetween(1, 5);
        $costPerPage = fake()->randomElement([3.00, 5.00]);

        return [
            'user_id' => User::factory(),
            'file_path' => 'uploads/'.fake()->uuid().'.pdf',
            'file_name' => fake()->word().'.pdf',
            'file_size' => fake()->numberBetween(10000, 5000000),
            'file_type' => 'application/pdf',
            'pages' => $pages,
            'current_page' => 0,
            'copies' => $copies,
            'cost' => $pages * $copies * $costPerPage,
            'color_mode' => fake()->randomElement(['grayscale', 'color']),
            'paper_size' => fake()->randomElement(['A4', 'Letter']),
            'orientation' => 'portrait',
            'status' => 'pending',
            'priority' => 0,
            'retry_count' => 0,
            'cups_job_id' => null,
            'error_message' => null,
            'printer_name' => 'Brother_DCP_T720DW',
        ];
    }

    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'processing',
            'cups_job_id' => fake()->numberBetween(1000, 9999),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'current_page' => $attributes['pages'],
            'cups_job_id' => fake()->numberBetween(1000, 9999),
            'completed_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'error_message' => fake()->sentence(),
            'cups_job_id' => fake()->numberBetween(1000, 9999),
        ]);
    }
}
