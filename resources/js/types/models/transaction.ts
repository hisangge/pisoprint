export type TransactionType =
    | 'coin_insert'
    | 'print_deduct'
    | 'admin_add'
    | 'refund';

export interface Transaction {
    id: number;
    user_id: number;
    transaction_type: TransactionType;
    amount: number;
    balance_before: number;
    balance_after: number;
    print_job_id: number | null;
    coin_count: number | null;
    coin_value: number | null;
    description: string | null;
    session_id: string | null;
    esp32_id: string | null;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}
