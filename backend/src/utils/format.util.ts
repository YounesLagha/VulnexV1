// Utilitaires pour le formatage de donnees
import type { SecurityGrade, SeverityLevel } from '../types/common.types';

// Classe pour formater les donnees
export class Formatter {
    // Formater une date en format ISO
    static toISOString(date: Date | string): string {
        if (typeof date === 'string') {
            return new Date(date).toISOString();
        }
        return date.toISOString();
    }

    // Formater une date en format lisible (francais)
    static toFrenchDate(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // Formater une URL (nettoyer et normaliser)
    static formatUrl(url: string): string {
        let formatted = url.trim();

        // Ajouter https:// si manquant
        if (!/^https?:\/\//i.test(formatted)) {
            formatted = `https://${formatted}`;
        }

        // Retirer le trailing slash
        formatted = formatted.replace(/\/$/, '');

        return formatted;
    }

    // Convertir un score (0-100) en grade (A+ a F)
    static scoreToGrade(score: number): SecurityGrade {
        if (score >= 95) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 70) return 'B';
        if (score >= 50) return 'C';
        if (score >= 30) return 'D';
        return 'F';
    }

    // Obtenir une couleur pour un grade
    static gradeToColor(grade: SecurityGrade): string {
        const colors: Record<SecurityGrade, string> = {
            'A+': '#10b981',
            'A': '#22c55e',
            'B': '#84cc16',
            'C': '#eab308',
            'D': '#f97316',
            'F': '#ef4444',
        };
        return colors[grade];
    }

    // Obtenir une couleur pour un niveau de severite
    static severityToColor(severity: SeverityLevel): string {
        const colors: Record<SeverityLevel, string> = {
            critical: '#dc2626',
            high: '#f97316',
            medium: '#eab308',
            low: '#3b82f6',
            info: '#6b7280',
        };
        return colors[severity];
    }

    // Formater un nombre avec separateurs de milliers
    static formatNumber(num: number): string {
        return num.toLocaleString('fr-FR');
    }

    // Formater une duree en millisecondes en format lisible
    static formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }

    // Formater un pourcentage
    static formatPercentage(value: number, total: number): string {
        if (total === 0) return '0%';
        const percentage = (value / total) * 100;
        return `${percentage.toFixed(1)}%`;
    }

    // Capitaliser la premiere lettre
    static capitalize(str: string): string {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Formater un nom de header HTTP
    static formatHeaderName(header: string): string {
        return header
            .split('-')
            .map((word) => this.capitalize(word))
            .join('-');
    }

    // Tronquer un texte avec ellipsis
    static truncate(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    // Formater un objet JSON de maniere securisee
    static safeJsonStringify(obj: any, space: number = 2): string {
        try {
            return JSON.stringify(obj, null, space);
        } catch (error) {
            return '[Objet non serialisable]';
        }
    }

    // Parser du JSON de maniere securisee
    static safeJsonParse<T = any>(str: string, fallback: T): T {
        try {
            return JSON.parse(str) as T;
        } catch {
            return fallback;
        }
    }

    // Formater une taille de fichier en bytes
    static formatBytes(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
    }

    // Formater un nom de domaine (retirer www.)
    static formatDomain(domain: string): string {
        return domain.replace(/^www\./, '');
    }

    // Generer un slug depuis un texte
    static slugify(text: string): string {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    // Formater un message d'erreur de maniere securisee
    static sanitizeErrorMessage(error: any): string {
        if (typeof error === 'string') {
            return error;
        }

        if (error instanceof Error) {
            return error.message
                .replace(/\/[^\s]+/g, '[path]')
                .replace(/[A-Z]:\\[^\s]+/g, '[path]')
                .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]');
        }

        return 'Une erreur est survenue';
    }

    // Formater un timestamp en "il y a X temps"
    static timeAgo(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

        const intervals = [
            { name: 'annee', value: 31536000 },
            { name: 'mois', value: 2592000 },
            { name: 'semaine', value: 604800 },
            { name: 'jour', value: 86400 },
            { name: 'heure', value: 3600 },
            { name: 'minute', value: 60 },
        ];

        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.value);
            if (count >= 1) {
                return `Il y a ${count} ${interval.name}${count > 1 ? 's' : ''}`;
            }
        }

        return 'A l\'instant';
    }
}

// Export par defaut
export default Formatter;
