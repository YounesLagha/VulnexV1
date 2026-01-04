// Types sp�cifiques aux scans de s�curit�

import { ID, Timestamp, ScanStatus, SeverityLevel, SecurityGrade } from './common.types';

// Configuration d'un scan
export interface ScanConfig {
    url: string;
    userId?: ID;
    options: ScanOptions;
}

// Options de scan
export interface ScanOptions {
    includeHeaders: boolean;
    includeSsl: boolean;
    includePorts: boolean;
    includeTechnologies: boolean;
    customPorts?: number[];
    timeout?: number;
}

// Entit� compl�te d'un scan (stock�e en base de donn�es)
export interface Scan {
    id: ID;
    url: string;
    status: ScanStatus;
    userId?: ID;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    completedAt?: Timestamp;
    results?: ScanResultData;
    error?: string;
}

// R�sultats bruts d'un scan
export interface ScanResultData {
    headers?: HeadersScanResult;
    ssl?: SslScanResult;
    ports?: PortsScanResult;
    technologies?: TechnologiesScanResult;
    score?: ScoreData;
    recommendations?: RecommendationData[];
}

// R�sultat du scan des headers HTTP
export interface HeadersScanResult {
    score: number;
    scannedAt: Timestamp;
    headers: {
        [headerName: string]: HeaderInfo;
    };
    missingHeaders: string[];
    recommendations: string[];
    // M�tadonn�es de scan pour transparence (V2)
    scanMetadata?: {
        originalUrl: string; // URL fournie par l'utilisateur
        scannedUrl: string; // URL r�ellement scann�e (apr�s redirections)
        httpsUpgraded: boolean; // true si HTTP → HTTPS upgrade
        upgradeReason: string; // Raison de l'upgrade ou non
    };
    // Détail du scoring pour transparence (V2)
    scoreBreakdown?: {
        rawScore: number; // Score brut sur 64 points
        maxScore: number; // Score maximum (64)
        normalizedScore: number; // Score normalisé sur 100
        details: ScoreDetail[];
    };
}

// Détail du calcul de score par header
export interface ScoreDetail {
    headerName: string;
    status: 'MISSING' | 'PRESENT_SECURE' | 'PRESENT_INSECURE' | 'PENALTY';
    pointsEarned: number;
    maxPoints: number;
    explanation: string;
}

// Information sur un header HTTP
export interface HeaderInfo {
    present: boolean;
    value?: string;
    secure: boolean;
    weight: number;
    recommendation?: string;
}

// R�sultat du scan SSL/TLS
export interface SslScanResult {
    score: number;
    grade: SecurityGrade;
    scannedAt: Timestamp;
    hasHttps: boolean;
    certificate?: CertificateInfo;
    protocols: ProtocolInfo[];
    ciphers: CipherInfo[];
    vulnerabilities: VulnerabilityInfo[];
}

// Information sur le certificat SSL
export interface CertificateInfo {
    valid: boolean;
    issuer: string;
    subject: string;
    serialNumber: string;
    validFrom: Timestamp;
    validTo: Timestamp;
    daysUntilExpiration: number;
    selfSigned: boolean;
    signatureAlgorithm: string;
}

// Information sur un protocole SSL/TLS
export interface ProtocolInfo {
    name: string;
    version: string;
    enabled: boolean;
    secure: boolean;
}

// Information sur un cipher
export interface CipherInfo {
    name: string;
    strength: number;
    secure: boolean;
}

// R�sultat du scan de ports
export interface PortsScanResult {
    score: number;
    scannedAt: Timestamp;
    totalScanned: number;
    openPorts: OpenPortInfo[];
    closedPorts: number[];
    filteredPorts: number[];
}

// Information sur un port ouvert
export interface OpenPortInfo {
    port: number;
    protocol: 'tcp' | 'udp';
    service: string;
    version?: string;
    state: 'open' | 'filtered' | 'closed';
    risk: SeverityLevel;
    recommendation?: string;
}

// R�sultat de la d�tection de technologies
export interface TechnologiesScanResult {
    score: number;
    scannedAt: Timestamp;
    technologies: TechnologyInfo[];
    frameworks: TechnologyInfo[];
    cms?: TechnologyInfo;
    server?: TechnologyInfo;
    analytics: TechnologyInfo[];
}

// Information sur une technologie d�tect�e
export interface TechnologyInfo {
    name: string;
    version?: string;
    category: string;
    confidence: number;
    icon?: string;
    website?: string;
    outdated?: boolean;
    latestVersion?: string;
    vulnerabilities?: KnownVulnerability[];
}

// Vuln�rabilit� connue d'une technologie
export interface KnownVulnerability {
    id: string;
    severity: SeverityLevel;
    description: string;
    cveId?: string;
    publishedDate?: Timestamp;
}

// Donn�es du score de s�curit�
export interface ScoreData {
    total: number;
    grade: SecurityGrade;
    calculatedAt: Timestamp;
    breakdown: ScoreBreakdownData;
    history?: ScoreHistoryEntry[];
}

// D�composition d�taill�e du score
export interface ScoreBreakdownData {
    headers: CategoryScore;
    ssl: CategoryScore;
    ports: CategoryScore;
    technologies: CategoryScore;
    misconfiguration: CategoryScore;
}

// Score par cat�gorie
export interface CategoryScore {
    score: number;
    maxScore: number;
    weight: number;
    weightedScore: number;
    issues: number;
}

// Entr�e d'historique de score
export interface ScoreHistoryEntry {
    date: Timestamp;
    score: number;
    grade: SecurityGrade;
}

// Donn�e de recommandation
export interface RecommendationData {
    id: string;
    severity: SeverityLevel;
    category: string;
    title: string;
    description: string;
    solution: string;
    impact: string;
    priority: number;
    resources?: ResourceLink[];
    affectedComponents?: string[];
}

// Lien vers une ressource externe
export interface ResourceLink {
    title: string;
    url: string;
    type: 'documentation' | 'tutorial' | 'tool' | 'article';
}

// Informations de vuln�rabilit� g�n�rique
export interface VulnerabilityInfo {
    id: string;
    name: string;
    severity: SeverityLevel;
    description: string;
    affected?: string;
    fixed?: boolean;
    cveId?: string;
}

// Statistiques d'un scan
export interface ScanStatistics {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    duration: number; // en millisecondes
}
