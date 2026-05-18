export interface AuthResponse {
    token: string;
    refreshToken: string;
}

export interface AuthRequest {
    username: string;
    password: string;
}
