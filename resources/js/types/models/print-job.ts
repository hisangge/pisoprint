export type PrintJobStatus =
    | 'pending'
    | 'processing'
    | 'printing'
    | 'completed'
    | 'failed'
    | 'cancelled';

export type ColorMode = 'bw' | 'grayscale' | 'color';

export type Orientation = 'portrait' | 'landscape';

export interface PrintJob {
    id: number;
    user_id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
    pages: number;
    cost: number;
    status: PrintJobStatus;
    priority: number;
    started_at: string | null;
    completed_at: string | null;
    error_message: string | null;
    printer_name: string | null;
    cups_job_id: number | null;
    color_mode: ColorMode;
    paper_size: string;
    orientation: Orientation;
    copies: number;
    created_at: string;
    updated_at: string;
}

export interface PrintJobFormData {
    color_mode: ColorMode;
    copies: number;
    orientation: Orientation;
}
