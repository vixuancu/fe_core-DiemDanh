interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data: T;
}

interface ApiListEnvelope<T> {
    success: boolean;
    message: string;
    data: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}