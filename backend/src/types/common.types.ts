// Types communs utilisés dans toute l'application

// Type pour les identifiants (UUID)
export type ID = string;

// Type pour les timestamps
export type Timestamp = string;

// Statuts possibles pour un scan
export type ScanStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// Niveaux de sévérité pour les vulnérabilités et recommandations
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

// Catégories de vulnérabilités
export type VulnerabilityCategory =
    | 'headers'
    | 'ssl_tls'
    | 'ports'
    | 'configuration'
    | 'technologies'
    | 'general';

// Grade de sécurité (A+ à F)
export type SecurityGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

// Environnement d'exécution
export type Environment = 'development' | 'production' | 'test';

// Type pour les erreurs standardisées
export interface AppError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Timestamp;
}

// Type pour la pagination
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Type pour les résultats paginés
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Type pour les métadonnées de requête
export interface RequestMetadata {
    requestId: ID;
    timestamp: Timestamp;
    userAgent?: string;
    ip?: string;
}

// Type pour les statistiques générales
export interface Statistics {
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    averageScore: number;
}

// Type pour les options de configuration
export interface ConfigOptions {
    timeout?: number;
    retries?: number;
    verbose?: boolean;
}
