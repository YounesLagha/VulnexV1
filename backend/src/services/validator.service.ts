// Service de validation réutilisable
import { REGEX_PATTERNS } from '../config/constants';

// Classe pour les validations courantes
export class Validator {
    // Valider une URL
    static isValidUrl(url: string): boolean {
        try {
            // Vérifier avec le regex d'abord
            if (!REGEX_PATTERNS.URL.test(url)) {
                return false;
            }

            // Vérification supplémentaire avec l'objet URL
            const urlObj = new URL(url);

            // Accepter seulement HTTP et HTTPS
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    // Valider un domaine
    static isValidDomain(domain: string): boolean {
        return REGEX_PATTERNS.DOMAIN.test(domain);
    }

    // Valider une adresse IPv4
    static isValidIPv4(ip: string): boolean {
        return REGEX_PATTERNS.IP_V4.test(ip);
    }

    // Valider un email
    static isValidEmail(email: string): boolean {
        return REGEX_PATTERNS.EMAIL.test(email);
    }

    // Valider un UUID
    static isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    // Valider un numéro de port
    static isValidPort(port: number): boolean {
        return Number.isInteger(port) && port >= 1 && port <= 65535;
    }

    // Extraire le domaine depuis une URL
    static extractDomain(url: string): string | null {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return null;
        }
    }

    // Extraire le protocole depuis une URL
    static extractProtocol(url: string): string | null {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol.replace(':', '');
        } catch {
            return null;
        }
    }

    // Normaliser une URL (ajouter https:// si manquant, retirer trailing slash)
    static normalizeUrl(url: string): string {
        let normalized = url.trim();

        // Ajouter https:// si aucun protocole
        if (!/^https?:\/\//i.test(normalized)) {
            normalized = `https://${normalized}`;
        }

        // Retirer le trailing slash
        normalized = normalized.replace(/\/$/, '');

        return normalized;
    }

    // Sanitizer une chaîne de caractères (prévention XSS basique)
    static sanitizeString(input: string): string {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // Vérifier si une chaîne contient des caractères potentiellement dangereux
    static containsDangerousChars(input: string): boolean {
        // Détecter les patterns d'injection SQL, XSS, command injection
        const dangerousPatterns = [
            /<script[^>]*>.*?<\/script>/gi,  // Script tags
            /javascript:/gi,                  // JavaScript protocol
            /on\w+\s*=/gi,                   // Event handlers
            /'.*?(\bor\b|\band\b).*?'/gi,    // SQL injection basique
            /;.*?(drop|delete|insert|update|select)/gi, // SQL commands
            /\$\{.*?\}/g,                    // Template injection
            /`.*?`/g,                        // Backticks
        ];

        return dangerousPatterns.some((pattern) => pattern.test(input));
    }

    // Valider que l'URL ne pointe pas vers localhost ou IP privées (sécurité)
    static isSafeUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();

            // Bloquer localhost
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
                return false;
            }

            // Bloquer les IP privées (ranges RFC 1918)
            const ipv4Patterns = [
                /^10\./,                    // 10.0.0.0/8
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
                /^192\.168\./,              // 192.168.0.0/16
                /^169\.254\./,              // 169.254.0.0/16 (link-local)
            ];

            if (ipv4Patterns.some((pattern) => pattern.test(hostname))) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    // Valider un tableau de ports
    static areValidPorts(ports: number[]): boolean {
        return ports.every((port) => this.isValidPort(port));
    }

    // Limiter la longueur d'une chaîne
    static truncate(str: string, maxLength: number): string {
        if (str.length <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength - 3) + '...';
    }
}

// Export par défaut
export default Validator;
