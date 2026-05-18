import type { AuthResponse, AuthRequest } from '../Types/auth';

const API_BASE_URL = 'http://localhost:8080/api/auth';

export async function register(username: string, password: string): Promise<AuthResponse> { //Sends req to backend, backend sends back AuthResponse
    const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password } as AuthRequest)
    });
    if (!res.ok) throw await res.json();
    return res.json();
}

export async function login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password } as AuthRequest)
    });
    if (!res.ok) throw await res.json();
    return res.json();
}

export async function refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken'); //Pull refresh token from local storage
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) throw await res.json();
    return res.json();
}

export async function logout(): Promise<void> { //Don't check res since even if logout API call fails, we still want to clear local storage and log user out on frontend. Tradeoff: stale refresh token in backend (expieres naturally after 7 days)
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });
}
/*
1. Token rotation:
   → Each use revokes old token
   → Detects if stolen token was used
   → Alarm for user and developers

2. Clear on login:
   → Kills ALL old tokens including stolen ones
   → Attacker window = only between improper logout and next login

3. Clear on logout:
   → Explicit cleanup
   → No tokens left in DB after proper logout
   → Zero attack window after proper logout
*/