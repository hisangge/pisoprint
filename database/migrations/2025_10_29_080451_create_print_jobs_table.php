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
        Schema::create('print_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path', 500);
            $table->bigInteger('file_size');
            $table->string('file_type', 50);
            $table->integer('pages');
            $table->integer('current_page')->nullable();
            $table->decimal('cost', 10, 2);
            $table->string('status', 20)->default('pending');
            $table->integer('priority')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->integer('retry_count')->default(0);
            $table->string('printer_name', 100)->nullable();
            $table->integer('cups_job_id')->nullable();
            $table->string('color_mode', 20)->default('grayscale');
            $table->string('paper_size', 20)->default('Letter');
            $table->string('orientation', 20)->default('portrait');
            $table->integer('copies')->default(1);
            $table->timestamps();

            // Indexes for better query performance
            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
            $table->index('cups_job_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('print_jobs');
    }
};
