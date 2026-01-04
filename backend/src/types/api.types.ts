// Types pour les requêtes et réponses de l'API

import { ScanStatus, SeverityLevel, ID, Timestamp } from './common.types';

// Structure standard de réponse API (succès)
export interface ApiResponse<T = any> {
    success: true;
    data: T;
    message?: string;
    metadata?: {
        requestId: string;
        timestamp: Timestamp;
    };
}

// Structure standard de réponse API (erreur)
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    metadata?: {
        requestId: string;
        timestamp: Timestamp;
    };
}

// Type union pour toutes les réponses
export type ApiResult<T = any> = ApiResponse<T> | ApiErrorResponse;

// Requête pour démarrer un scan
export interface StartScanRequest {
    url: string;
    options?: {
        includeHeaders?: boolean;
        includeSsl?: boolean;
        includePorts?: boolean;
        includeTechnologies?: boolean;
    };
}

// Réponse après démarrage d'un scan
export interface StartScanResponse {
    scanId: ID;
    status: ScanStatus;
    url: string;
    createdAt: Timestamp;
    estimatedDuration?: number; // en secondes
}

// Réponse pour récupérer un scan
export interface GetScanResponse {
    id: ID;
    url: string;
    status: ScanStatus;
    score?: number;
    grade?: string;
    createdAt: Timestamp;
    completedAt?: Timestamp;
    results?: ScanResults;
}

// Résultats complets d'un scan
export interface ScanResults {
    headers?: HeadersAnalysis;
    ssl?: SslAnalysis;
    ports?: PortsAnalysis;
    technologies?: TechnologiesAnalysis;
    score: ScoreBreakdown;
    recommendations: Recommendation[];
}

// Analyse des headers HTTP
export interface HeadersAnalysis {
    score: number;
    headers: {
        [key: string]: {
            present: boolean;
            value?: string;
            secure: boolean;
            recommendation?: string;
        };
    };
    missingHeaders: string[];
}

// Analyse SSL/TLS
export interface SslAnalysis {
    score: number;
    grade: string;
    certificate?: {
        valid: boolean;
        issuer: string;
        subject: string;
        validFrom: Timestamp;
        validTo: Timestamp;
        daysUntilExpiration: number;
    };
    protocols: string[];
    vulnerabilities: string[];
}

// Analyse des ports
export interface PortsAnalysis {
    score: number;
    openPorts: Array<{
        port: number;
        service: string;
        risk: SeverityLevel;
    }>;
    totalScanned: number;
}

// Analyse des technologies
export interface TechnologiesAnalysis {
    score: number;
    technologies: Array<{
        name: string;
        version?: string;
        category: string;
        outdated?: boolean;
        vulnerabilities?: string[];
    }>;
}

// Décomposition du score
export interface ScoreBreakdown {
    total: number;
    grade: string;
    breakdown: {
        headers: number;
        ssl: number;
        ports: number;
        technologies: number;
        misconfiguration: number;
    };
}

// Recommandation de sécurité
export interface Recommendation {
    id: string;
    severity: SeverityLevel;
    category: string;
    title: string;
    description: string;
    solution: string;
    impact: string;
    resources?: string[];
}

// Réponse pour la liste des scans
export interface ListScansResponse {
    scans: Array<{
        id: ID;
        url: string;
        status: ScanStatus;
        score?: number;
        createdAt: Timestamp;
    }>;
    total: number;
    page: number;
    limit: number;
}

// Requête pour générer un PDF
export interface GeneratePdfRequest {
    scanId: ID;
    options?: {
        includeRecommendations?: boolean;
        includeCharts?: boolean;
    };
}

// Réponse pour la génération de PDF
export interface GeneratePdfResponse {
    pdfUrl: string;
    expiresAt: Timestamp;
}

// Health check response
export interface HealthCheckResponse {
    status: 'UP' | 'DOWN';
    service: string;
    version: string;
    timestamp: Timestamp;
    database?: 'connected' | 'disconnected';
}
