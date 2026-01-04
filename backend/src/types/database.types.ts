// Types générés depuis le schéma Supabase
// Ces types seront normalement auto-générés via: npx supabase gen types typescript
// Pour l'instant, nous définissons manuellement les types basés sur notre schéma

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

// Interface principale de la base de données
export interface Database {
    public: {
        Tables: {
            // Table des utilisateurs (gérée par Supabase Auth)
            users: {
                Row: {
                    id: string;
                    email: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            // Table des profils utilisateurs
            profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    username: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    username?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    username?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            // Table des scans
            scans: {
                Row: {
                    id: string;
                    user_id: string | null;
                    url: string;
                    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
                    results: Json | null;
                    score: number | null;
                    grade: string | null;
                    error: string | null;
                    created_at: string;
                    updated_at: string;
                    completed_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    url: string;
                    status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
                    results?: Json | null;
                    score?: number | null;
                    grade?: string | null;
                    error?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    completed_at?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    url?: string;
                    status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
                    results?: Json | null;
                    score?: number | null;
                    grade?: string | null;
                    error?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    completed_at?: string | null;
                };
            };
            // Table des rapports PDF générés
            reports: {
                Row: {
                    id: string;
                    scan_id: string;
                    user_id: string | null;
                    pdf_url: string;
                    expires_at: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    scan_id: string;
                    user_id?: string | null;
                    pdf_url: string;
                    expires_at: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    scan_id?: string;
                    user_id?: string | null;
                    pdf_url?: string;
                    expires_at?: string;
                    created_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            scan_status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
        };
    };
}

// Types helpers pour faciliter l'utilisation
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Exports de types spécifiques pour faciliter l'usage
export type DbUser = Tables<'users'>;
export type DbProfile = Tables<'profiles'>;
export type DbScan = Tables<'scans'>;
export type DbReport = Tables<'reports'>;

export type InsertUser = Inserts<'users'>;
export type InsertProfile = Inserts<'profiles'>;
export type InsertScan = Inserts<'scans'>;
export type InsertReport = Inserts<'reports'>;

export type UpdateUser = Updates<'users'>;
export type UpdateProfile = Updates<'profiles'>;
export type UpdateScan = Updates<'scans'>;
export type UpdateReport = Updates<'reports'>;
