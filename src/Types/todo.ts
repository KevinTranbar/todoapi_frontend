export interface Todo {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
    createdAt: string;
}

export interface TodoRequest {
    title: string;
    description?: string;
    completed: boolean;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}