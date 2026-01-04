// Configuration des constantes globales de l'application

// D�lais et timeouts
export const TIMEOUTS = {
    HTTP_REQUEST: 10000,        // 10 secondes pour les requ�tes HTTP
    SSL_CHECK: 5000,            // 5 secondes pour la v�rification SSL
    PORT_SCAN: 2000,            // 2 secondes par port
    DATABASE_QUERY: 30000,      // 30 secondes pour les requ�tes DB complexes
} as const;

// Limites de l'application
export const LIMITS = {
    MAX_PORTS_TO_SCAN: 20,      // Nombre maximum de ports � scanner
    MAX_CONCURRENT_SCANS: 5,    // Nombre de scans simultan�s par utilisateur
    MAX_URL_LENGTH: 2048,       // Longueur maximum d'une URL
    RATE_LIMIT_REQUESTS: 10,    // Nombre de requ�tes autoris�es
    RATE_LIMIT_WINDOW: 60000,   // Fen�tre de rate limiting (1 minute)
} as const;

// Configuration du rate limiting
export const RATE_LIMITS = {
    WINDOW_MS: 15 * 60 * 1000,           // 15 minutes
    MAX_REQUESTS_PER_WINDOW: 100,        // 100 requ�tes par fen�tre
    SCAN_WINDOW_MS: 60 * 60 * 1000,      // 1 heure
    MAX_SCANS_PER_WINDOW: 10,            // 10 scans par heure
} as const;

// Ports communs � scanner (s�curit�)
export const COMMON_PORTS = [
    21,     // FTP
    22,     // SSH
    23,     // Telnet
    25,     // SMTP
    53,     // DNS
    80,     // HTTP
    110,    // POP3
    143,    // IMAP
    443,    // HTTPS
    465,    // SMTPS
    587,    // SMTP (submission)
    993,    // IMAPS
    995,    // POP3S
    3306,   // MySQL
    3389,   // RDP
    5432,   // PostgreSQL
    6379,   // Redis
    8080,   // HTTP alternatif
    8443,   // HTTPS alternatif
    27017,  // MongoDB
] as const;

// Headers de s�curit� HTTP � v�rifier
export const SECURITY_HEADERS = {
    REQUIRED: [
        'strict-transport-security',
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
    ],
    RECOMMENDED: [
        'content-security-policy',
        'referrer-policy',
        'permissions-policy',
    ],
    DEPRECATED: [
        'x-xss-protection',         // D�pr�ci� mais encore v�rifi�
    ],
} as const;

// Pond�ration pour le calcul du score de s�curit�
export const SCORE_WEIGHTS = {
    HTTP_HEADERS: 30,       // 30% du score total
    SSL_TLS: 25,            // 25% du score total
    OPEN_PORTS: 20,         // 20% du score total
    TECHNOLOGIES: 15,       // 15% du score total
    MISCONFIGURATION: 10,   // 10% du score total
} as const;

// Seuils de score
export const SCORE_THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 70,
    AVERAGE: 50,
    POOR: 30,
    CRITICAL: 0,
} as const;

// Messages d'erreur standards
export const ERROR_MESSAGES = {
    INVALID_URL: 'URL invalide ou inaccessible',
    SCAN_IN_PROGRESS: 'Un scan est d�j� en cours pour cette URL',
    SCAN_NOT_FOUND: 'Scan introuvable',
    UNAUTHORIZED: 'Non autoris�',
    RATE_LIMIT_EXCEEDED: 'Trop de requ�tes, veuillez r�essayer plus tard',
    INTERNAL_ERROR: 'Erreur interne du serveur',
    DATABASE_ERROR: 'Erreur de base de donn�es',
    VALIDATION_ERROR: 'Erreur de validation des donn�es',
} as const;

// Statuts de scan possibles
export const SCAN_STATUS = {
    PENDING: 'pending',         // En attente
    IN_PROGRESS: 'in_progress', // En cours
    COMPLETED: 'completed',     // Termin�
    FAILED: 'failed',           // �chou�
    CANCELLED: 'cancelled',     // Annul�
} as const;

// Niveaux de s�v�rit� pour les recommandations
export const SEVERITY_LEVELS = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info',
} as const;

// Cat�gories de vuln�rabilit�s
export const VULNERABILITY_CATEGORIES = {
    HEADERS: 'headers',
    SSL_TLS: 'ssl_tls',
    PORTS: 'ports',
    CONFIGURATION: 'configuration',
    TECHNOLOGIES: 'technologies',
    GENERAL: 'general',
} as const;

// Configuration des API externes
export const EXTERNAL_APIS = {
    WAPPALYZER: {
        BASE_URL: 'https://api.wappalyzer.com/v2',
        TIMEOUT: 10000,
    },
} as const;

// Expressions r�guli�res utiles
export const REGEX_PATTERNS = {
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    DOMAIN: /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
    IP_V4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;
