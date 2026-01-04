// Utilitaires pour la securite
import crypto from 'crypto';

// Classe pour les operations de securite
export class SecurityUtil {
    // Generer un hash SHA-256
    static sha256(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // Generer un hash SHA-512
    static sha512(data: string): string {
        return crypto.createHash('sha512').update(data).digest('hex');
    }

    // Generer un token aleatoire securise
    static generateToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    // Generer un UUID v4
    static generateUuid(): string {
        return crypto.randomUUID();
    }

    // Sanitizer une chaine pour prevenir XSS
    static sanitizeHtml(input: string): string {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
        };
        return input.replace(/[&<>"'\/]/g, (char) => map[char]);
    }

    // Verifier si une chaine contient des caracteres dangereux
    static containsSqlInjection(input: string): boolean {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
            /(;|--|\|{2})/g,
            /('|('')|;|--|\/\*|\*\/)/g,
        ];
        return sqlPatterns.some((pattern) => pattern.test(input));
    }

    // Verifier si une chaine contient des patterns XSS
    static containsXss(input: string): boolean {
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
        ];
        return xssPatterns.some((pattern) => pattern.test(input));
    }

    // Verifier si une chaine contient des patterns de command injection
    static containsCommandInjection(input: string): boolean {
        const cmdPatterns = [
            /[;&|`$()]/g,
            /\b(exec|eval|system|passthru|shell_exec)\b/gi,
        ];
        return cmdPatterns.some((pattern) => pattern.test(input));
    }

    // Verifier si une URL est potentiellement dangereuse
    static isUrlSafe(url: string): boolean {
        try {
            const urlObj = new URL(url);

            // Bloquer les protocoles dangereux
            const dangerousProtocols = ['javascript:', 'data:', 'file:', 'vbscript:'];
            if (dangerousProtocols.some((proto) => urlObj.protocol === proto)) {
                return false;
            }

            // Bloquer localhost et IPs privees
            const hostname = urlObj.hostname.toLowerCase();
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
                return false;
            }

            // Bloquer les ranges IP privees
            const privateIpPatterns = [
                /^10\./,
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
                /^192\.168\./,
                /^169\.254\./,
            ];

            if (privateIpPatterns.some((pattern) => pattern.test(hostname))) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    // Masquer partiellement une donnee sensible (email, token, etc.)
    static maskSensitiveData(data: string, visibleChars: number = 4): string {
        if (data.length <= visibleChars * 2) {
            return '*'.repeat(data.length);
        }

        const start = data.substring(0, visibleChars);
        const end = data.substring(data.length - visibleChars);
        const masked = '*'.repeat(data.length - visibleChars * 2);

        return `${start}${masked}${end}`;
    }

    // Masquer un email
    static maskEmail(email: string): string {
        const [local, domain] = email.split('@');
        if (!domain) return this.maskSensitiveData(email);

        const maskedLocal = this.maskSensitiveData(local, 2);
        return `${maskedLocal}@${domain}`;
    }

    // Verifier la force d'un mot de passe
    static checkPasswordStrength(password: string): {
        score: number;
        strength: 'weak' | 'medium' | 'strong' | 'very-strong';
        feedback: string[];
    } {
        let score = 0;
        const feedback: string[] = [];

        // Longueur
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
        else feedback.push('Utilisez au moins 12 caracteres');

        // Minuscules
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Ajoutez des lettres minuscules');

        // Majuscules
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Ajoutez des lettres majuscules');

        // Chiffres
        if (/[0-9]/.test(password)) score += 1;
        else feedback.push('Ajoutez des chiffres');

        // Caracteres speciaux
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;
        else feedback.push('Ajoutez des caracteres speciaux (!@#$%^&*)');

        // Variete de caracteres
        const uniqueChars = new Set(password.split('')).size;
        if (uniqueChars >= password.length * 0.7) score += 1;

        // Determiner la force
        let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
        if (score <= 3) strength = 'weak';
        else if (score <= 5) strength = 'medium';
        else if (score <= 7) strength = 'strong';
        else strength = 'very-strong';

        return { score, strength, feedback };
    }

    // Generer un hash de mot de passe (pour comparaison simple)
    static hashPassword(password: string, salt?: string): string {
        const actualSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512').toString('hex');
        return `${actualSalt}:${hash}`;
    }

    // Verifier un mot de passe hashe
    static verifyPassword(password: string, hashedPassword: string): boolean {
        const [salt, originalHash] = hashedPassword.split(':');
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return hash === originalHash;
    }

    // Generer un code OTP (One-Time Password)
    static generateOtp(length: number = 6): string {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }

    // Rate limiting simple en memoire (a utiliser avec precaution)
    private static rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

    static checkRateLimit(
        identifier: string,
        maxRequests: number,
        windowMs: number
    ): { allowed: boolean; remaining: number; resetAt: number } {
        const now = Date.now();
        const record = this.rateLimitStore.get(identifier);

        if (!record || now > record.resetAt) {
            // Nouvelle fenetre
            this.rateLimitStore.set(identifier, {
                count: 1,
                resetAt: now + windowMs,
            });
            return {
                allowed: true,
                remaining: maxRequests - 1,
                resetAt: now + windowMs,
            };
        }

        if (record.count >= maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: record.resetAt,
            };
        }

        record.count += 1;
        return {
            allowed: true,
            remaining: maxRequests - record.count,
            resetAt: record.resetAt,
        };
    }

    // Nettoyer le rate limit store periodiquement
    static cleanupRateLimitStore(): void {
        const now = Date.now();
        for (const [key, value] of this.rateLimitStore.entries()) {
            if (now > value.resetAt) {
                this.rateLimitStore.delete(key);
            }
        }
    }
}

// Export par defaut
export default SecurityUtil;
