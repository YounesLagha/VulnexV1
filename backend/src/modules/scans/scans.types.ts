// Types pour le module de gestion des scans

import type { ScanResultData } from '../../types';

export type ScanType = 'headers' | 'ssl' | 'technologies' | 'full';
export type ScanMode = 'free' | 'full';

export interface ScanRecord {
    id: string;
    user_id: string | null;
    url: string;
    score: number;
    scan_type: ScanType;
    mode: ScanMode;
    results: ScanResultData; // Structure complète incluant headers, ssl, score, etc.
    ai_analysis: string | null;
    ai_tokens_used: number | null;
    created_at: string;
    updated_at: string;
}

export interface CreateScanInput {
    user_id?: string;
    url: string;
    score: number;
    scan_type: ScanType;
    mode: ScanMode;
    results: ScanResultData; // Structure complète incluant headers, ssl, score, etc.
    ai_analysis?: string;
    ai_tokens_used?: number;
}

export interface ScanFilters {
    user_id?: string;
    url?: string;
    scan_type?: ScanType;
    mode?: ScanMode;
    min_score?: number;
    max_score?: number;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}

export interface UserScanStats {
    user_id: string;
    total_scans: number;
    average_score: number;
    best_score: number;
    worst_score: number;
    unique_urls: number;
    last_scan_at: string;
}

export interface ScanListResponse {
    scans: ScanRecord[];
    total: number;
    page: number;
    limit: number;
}
