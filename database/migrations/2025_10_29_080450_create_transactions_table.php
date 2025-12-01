<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('transaction_type', 20); // coin_insert, print_deduct, admin_add, refund
            $table->decimal('amount', 10, 2);
            $table->decimal('balance_before', 10, 2);
            $table->decimal('balance_after', 10, 2);
            $table->unsignedBigInteger('print_job_id')->nullable();
            $table->integer('coin_count')->nullable();
            $table->decimal('coin_value', 10, 2)->nullable();
            $table->string('description')->nullable();
            $table->string('session_id', 100)->nullable();
            $table->string('esp32_id', 50)->nullable();
            $table->boolean('is_verified')->default(true);
            $table->timestamps();

            // Indexes for better query performance
            $table->index('user_id');
            $table->index('transaction_type');
            $table->index('created_at');
            $table->index('session_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
