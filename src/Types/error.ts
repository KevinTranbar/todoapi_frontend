export interface ApiError {
    status: number;
    error: string;
    message: string;
    timestamp: string;
    path: string;
    errors?: Record<string, string>;
}