<?php

namespace Database\Seeders;

use App\Models\PrintJob;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PrintJobTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting to seed print jobs and transactions...');

        // Get or create users
        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Creating test users...');
            $users = collect([
                User::factory()->create([
                    'name' => 'John Doe',
                    'email' => 'john@pisoprint.com',
                    'balance' => 0,
                ]),
                User::factory()->create([
                    'name' => 'Jane Smith',
                    'email' => 'jane@pisoprint.com',
                    'balance' => 0,
                ]),
                User::factory()->create([
                    'name' => 'Bob Wilson',
                    'email' => 'bob@pisoprint.com',
                    'balance' => 0,
                ]),
            ]);
        }

        $fileNames = [
            'Resume_2025.pdf',
            'Thesis_Final_Draft.pdf',
            'Project_Proposal.pdf',
            'Business_Plan.pdf',
            'Meeting_Minutes.pdf',
            'Invoice_12345.pdf',
            'Receipt_Nov2025.pdf',
            'Contract_Agreement.pdf',
            'Research_Paper.pdf',
            'Assignment_Module1.pdf',
            'Presentation_Slides.pdf',
            'Monthly_Report.pdf',
            'Budget_Plan_2025.pdf',
            'Wedding_Invitation.pdf',
            'Birth_Certificate.pdf',
        ];

        // Create 100 transactions and corresponding print jobs
        for ($i = 0; $i < 100; $i++) {
            $user = $users->random();

            // Randomly decide the flow: coin insert first or just print
            $hasCoinInsert = rand(1, 100) <= 80; // 80% have coin inserts

            $createdAt = now()->subDays(rand(0, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59));

            $sessionId = Str::uuid()->toString();
            $balanceBefore = $user->balance;

            // 1. Coin Insert Transaction (if applicable)
            if ($hasCoinInsert) {
                $coinCount = rand(1, 10);
                $coinValue = 5.00; // ₱5 per coin
                $totalCoins = $coinCount * $coinValue;

                $coinTransaction = Transaction::create([
                    'user_id' => $user->id,
                    'transaction_type' => 'coin_insert',
                    'amount' => $totalCoins,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceBefore + $totalCoins,
                    'description' => "Inserted {$coinCount} coin(s) worth ₱{$totalCoins}",
                    'session_id' => $sessionId,
                    'esp32_id' => 'ESP32-'.rand(1000, 9999),
                    'coin_count' => $coinCount,
                    'coin_value' => $coinValue,
                    'is_verified' => true,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                // Update user balance
                $user->balance = $coinTransaction->balance_after;
                $user->save();

                $balanceBefore = $user->balance;
                $createdAt = $createdAt->copy()->addSeconds(rand(5, 30));
            }

            // 2. Create Print Job
            $colorMode = rand(1, 100) <= 70 ? 'grayscale' : 'color'; // 70% grayscale
            $pages = rand(1, 50);
            $copies = rand(1, 5);
            $paperSize = ['A4', 'Letter', 'Legal'][array_rand(['A4', 'Letter', 'Legal'])];
            $orientation = ['portrait', 'landscape'][array_rand(['portrait', 'landscape'])];

            // Calculate cost
            $pricePerPage = $colorMode === 'color' ? 5.00 : 2.00;
            $cost = $pages * $copies * $pricePerPage;

            // Determine status based on balance
            $canAfford = $user->balance >= $cost;

            if (! $canAfford) {
                // Insufficient balance - create pending job
                $status = 'pending';
            } else {
                // Sufficient balance - randomly assign status
                $statusDistribution = [
                    'completed' => 60,   // 60%
                    'printing' => 15,    // 15%
                    'failed' => 10,      // 10%
                    'cancelled' => 10,   // 10%
                    'pending' => 5,      // 5%
                ];

                $rand = rand(1, 100);
                $cumulative = 0;
                $status = 'pending';

                foreach ($statusDistribution as $s => $percentage) {
                    $cumulative += $percentage;
                    if ($rand <= $cumulative) {
                        $status = $s;
                        break;
                    }
                }
            }

            $printJob = PrintJob::create([
                'user_id' => $user->id,
                'file_name' => $fileNames[array_rand($fileNames)],
                'file_path' => storage_path('app/uploads/'.Str::uuid().'.pdf'),
                'file_size' => rand(100000, 5000000),
                'file_type' => 'application/pdf',
                'pages' => $pages,
                'copies' => $copies,
                'color_mode' => $colorMode,
                'paper_size' => $paperSize,
                'orientation' => $orientation,
                'cost' => $cost,
                'status' => $status,
                'printer_name' => config('hardware.default_printer'),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            // Set print job timestamps based on status
            if (in_array($status, ['printing', 'completed', 'failed'])) {
                $printJob->started_at = $createdAt->copy()->addMinutes(rand(1, 5));
                $printJob->save();

                if (in_array($status, ['completed', 'failed'])) {
                    $printJob->completed_at = $printJob->started_at->copy()->addMinutes(rand(1, 10));

                    if ($status === 'completed') {
                        $printJob->current_page = $pages * $copies;
                    }

                    if ($status === 'failed') {
                        $printJob->error_message = collect([
                            'Printer connection lost',
                            'Paper jam detected',
                            'Out of paper',
                            'Printer offline',
                            'Print spooler error',
                        ])->random();
                        $printJob->retry_count = rand(0, 3);
                    }

                    $printJob->save();
                }
            }

            // 3. Create Print Deduction Transaction (only if status requires payment)
            if (in_array($status, ['completed', 'printing', 'failed']) && $canAfford) {
                $printTransaction = Transaction::create([
                    'user_id' => $user->id,
                    'print_job_id' => $printJob->id,
                    'transaction_type' => 'print_deduct',
                    'amount' => $cost,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceBefore - $cost,
                    'description' => "Printed {$printJob->file_name} ({$pages} page(s), {$copies} cop(ies), {$colorMode})",
                    'session_id' => $sessionId,
                    'is_verified' => true,
                    'created_at' => $createdAt->copy()->addSeconds(rand(1, 5)),
                    'updated_at' => $createdAt->copy()->addSeconds(rand(1, 5)),
                ]);

                // Update user balance
                $user->balance = $printTransaction->balance_after;
                $user->save();
            }

            if ($i % 10 === 0) {
                $this->command->info("Created {$i} print jobs and transactions...");
            }
        }

        $this->command->info('Successfully created 100 print jobs with related transactions!');
        $this->command->info('Summary:');
        $this->command->info('- Total Print Jobs: '.PrintJob::count());
        $this->command->info('- Total Transactions: '.Transaction::count());
        $this->command->info('- Coin Insert Transactions: '.Transaction::where('transaction_type', 'coin_insert')->count());
        $this->command->info('- Print Deduct Transactions: '.Transaction::where('transaction_type', 'print_deduct')->count());
    }
}
