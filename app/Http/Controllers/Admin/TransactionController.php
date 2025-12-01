<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    /**
     * Display transaction history.
     */
    public function index(Request $request): Response
    {
        $perPage = $request->integer('per_page', 15);

        $query = Transaction::with(['user', 'printJob'])
            ->latest();

        // Filter by transaction type
        if ($request->filled('type')) {
            $query->where('transaction_type', $request->type);
        }

        // Filter by date range
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // Search by description or session ID
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('session_id', 'like', "%{$search}%");
            });
        }

        $transactions = $query->paginate($perPage)->through(fn ($transaction) => [
            'id' => $transaction->id,
            'type' => $transaction->transaction_type,
            'amount' => (float) $transaction->amount,
            'balanceBefore' => (float) $transaction->balance_before,
            'balanceAfter' => (float) $transaction->balance_after,
            'description' => $transaction->description,
            'sessionId' => $transaction->session_id,
            'esp32Id' => $transaction->esp32_id,
            'coinCount' => $transaction->coin_count,
            'coinValue' => $transaction->coin_value ? (float) $transaction->coin_value : null,
            'isVerified' => (bool) $transaction->is_verified,
            'createdAt' => $transaction->created_at->toIso8601String(),
            'user' => $transaction->user ? [
                'id' => $transaction->user->id,
                'name' => $transaction->user->name,
                'email' => $transaction->user->email,
            ] : null,
            'printJob' => $transaction->printJob ? [
                'id' => $transaction->printJob->id,
                'fileName' => $transaction->printJob->file_name,
                'status' => $transaction->printJob->status,
            ] : null,
        ]);

        // Calculate summary statistics
        $stats = [
            'totalRevenue' => round((float) Transaction::where('transaction_type', 'print_deduct')
                ->sum('amount') ?: 0, 2),
            'totalCoins' => round((float) Transaction::where('transaction_type', 'coin_insert')
                ->sum('amount') ?: 0, 2),
            'todayRevenue' => round((float) Transaction::where('transaction_type', 'print_deduct')
                ->whereDate('created_at', today())
                ->sum('amount') ?: 0, 2),
            'todayCoins' => round((float) Transaction::where('transaction_type', 'coin_insert')
                ->whereDate('created_at', today())
                ->sum('amount') ?: 0, 2),
        ];

        return Inertia::render('admin/transactions', [
            'transactions' => $transactions,
            'stats' => $stats,
            'filters' => $request->only(['type', 'from', 'to', 'search']),
        ]);
    }

    /**
     * Export transactions as CSV.
     */
    public function export(Request $request): HttpResponse
    {
        $query = Transaction::with(['user', 'printJob'])
            ->latest();

        // Apply same filters as index
        if ($request->filled('type')) {
            $query->where('transaction_type', $request->type);
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('session_id', 'like', "%{$search}%");
            });
        }

        $transactions = $query->get();

        // Generate CSV
        $csv = $this->generateCsv($transactions);

        $filename = 'transactions_'.now()->format('Y-m-d_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Generate CSV content from transactions.
     */
    protected function generateCsv($transactions): string
    {
        $output = fopen('php://temp', 'r+');

        // Add UTF-8 BOM for proper encoding in Excel
        fwrite($output, "\xEF\xBB\xBF");

        // CSV Headers
        fputcsv($output, [
            'ID',
            'Date',
            'Time',
            'Type',
            'Amount',
            'Balance Before',
            'Balance After',
            'Description',
            'User Name',
            'User Email',
            'Session ID',
            'ESP32 ID',
            'Coin Count',
            'Coin Value',
            'Print Job ID',
            'Print Job File',
            'Verified',
        ]);

        // CSV Rows
        foreach ($transactions as $transaction) {
            fputcsv($output, [
                $transaction->id,
                $transaction->created_at->format('Y-m-d'),
                $transaction->created_at->format('H:i:s'),
                $transaction->transaction_type,
                number_format($transaction->amount, 2, '.', ''),
                number_format($transaction->balance_before, 2, '.', ''),
                number_format($transaction->balance_after, 2, '.', ''),
                $transaction->description,
                $transaction->user?->name ?? 'Guest',
                $transaction->user?->email ?? '',
                $transaction->session_id,
                $transaction->esp32_id ?? '',
                $transaction->coin_count ?? '',
                $transaction->coin_value ? number_format($transaction->coin_value, 2, '.', '') : '',
                $transaction->printJob?->id ?? '',
                $transaction->printJob?->file_name ?? '',
                $transaction->is_verified ? 'Yes' : 'No',
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }
}
