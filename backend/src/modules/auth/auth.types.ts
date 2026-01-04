// Types pour l'authentification

export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name?: string;
        created_at: string;
    };
    session: {
        access_token: string;
        refresh_token: string;
        expires_at: number;
        expires_in: number;
    };
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface UserProfile {
    id: string;
    email: string;
    name?: string;
    created_at: string;
    scans_count?: number;
}
