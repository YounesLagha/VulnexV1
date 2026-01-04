// Middleware pour limiter le nombre de requetes (rate limiting)
import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../config/constants';
import { Logger } from '../services/logger.service';

// Rate limiter general pour toutes les routes
export const generalLimiter = rateLimit({
    windowMs: RATE_LIMITS.WINDOW_MS,
    max: RATE_LIMITS.MAX_REQUESTS_PER_WINDOW,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Trop de requetes, veuillez reessayer plus tard',
        },
    },
    standardHeaders: true, // Retourner les infos dans les headers `RateLimit-*`
    legacyHeaders: false, // Desactiver les headers `X-RateLimit-*`
    handler: (req, res) => {
        Logger.warn('Rate limit depasse', {
            ip: req.ip,
            path: req.path,
        });

        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Trop de requetes, veuillez reessayer plus tard',
            },
        });
    },
});

// Rate limiter strict pour les scans (plus limite)
export const scanLimiter = rateLimit({
    windowMs: RATE_LIMITS.SCAN_WINDOW_MS,
    max: RATE_LIMITS.MAX_SCANS_PER_WINDOW,
    message: {
        success: false,
        error: {
            code: 'SCAN_LIMIT_EXCEEDED',
            message: `Maximum ${RATE_LIMITS.MAX_SCANS_PER_WINDOW} scans par heure atteint`,
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Compter toutes les requetes
    handler: (req, res) => {
        Logger.warn('Limite de scans depassee', {
            ip: req.ip,
            path: req.path,
        });

        res.status(429).json({
            success: false,
            error: {
                code: 'SCAN_LIMIT_EXCEEDED',
                message: `Vous avez atteint la limite de ${RATE_LIMITS.MAX_SCANS_PER_WINDOW} scans par heure`,
            },
        });
    },
});

// Rate limiter pour l'authentification (contre brute force)
// En mode dev: limites assouplies
export const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes (au lieu de 15)
    max: 20, // 20 tentatives max (au lieu de 5) pour le dev
    message: {
        success: false,
        error: {
            code: 'AUTH_LIMIT_EXCEEDED',
            message: 'Trop de tentatives de connexion, veuillez reessayer dans 15 minutes',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Ne compter que les echecs
    handler: (req, res) => {
        Logger.warn('Limite d\'authentification depassee', {
            ip: req.ip,
            path: req.path,
        });

        res.status(429).json({
            success: false,
            error: {
                code: 'AUTH_LIMIT_EXCEEDED',
                message: 'Trop de tentatives de connexion, veuillez reessayer dans 15 minutes',
            },
        });
    },
});

// Rate limiter pour la generation de rapports PDF
export const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // 10 rapports max par heure
    message: {
        success: false,
        error: {
            code: 'REPORT_LIMIT_EXCEEDED',
            message: 'Limite de generation de rapports atteinte (10/heure)',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        Logger.warn('Limite de rapports depassee', {
            ip: req.ip,
            path: req.path,
        });

        res.status(429).json({
            success: false,
            error: {
                code: 'REPORT_LIMIT_EXCEEDED',
                message: 'Vous avez atteint la limite de 10 rapports par heure',
            },
        });
    },
});

// Rate limiter custom bas� sur l'utilisateur (si authentifi�)
export const createUserLimiter = (max: number, windowMs: number) => {
    return rateLimit({
        windowMs,
        max,
        keyGenerator: (req) => {
            // Utiliser l'ID utilisateur si authentifie, sinon l'IP
            const user = (req as any).user;
            return user?.id || req.ip || 'unknown';
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            Logger.warn('Rate limit utilisateur depasse', {
                userId: (req as any).user?.id,
                ip: req.ip,
                path: req.path,
            });

            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Trop de requetes, veuillez reessayer plus tard',
                },
            });
        },
    });
};
