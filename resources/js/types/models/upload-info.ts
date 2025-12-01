export interface UploadInfo {
    filename: string;
    original_name: string;
    path: string;
    size: number;
    pages: number;
    mime_type: string;
    preview_url?: string;
}

export interface CostCalculation {
    cost: number;
    price_per_page: number;
    total_pages: number;
}

export interface PaymentStatus {
    balance: number;
    required: number;
    remaining: number;
    payment_complete: boolean;
    timestamp?: string;
}
