// Middleware global pour gerer les erreurs
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../services/error.service';
import { Logger } from '../services/logger.service';
import { isProduction } from '../config/env.config';

// Interface pour les erreurs personnalisees
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
        stack?: string;
    };
}

// Middleware pour gerer les erreurs
export function errorHandler(
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Si les headers sont deja envoyes, deleguer a Express
    if (res.headersSent) {
        return next(error);
    }

    // Determiner si c'est une erreur AppError ou une erreur standard
    const isAppError = error instanceof AppError;

    // Extraire les informations de l'erreur
    const statusCode = isAppError ? (error as AppError).statusCode : 500;
    const code = isAppError ? (error as AppError).code : 'INTERNAL_SERVER_ERROR';
    const message = error.message || 'Une erreur interne est survenue';
    const details = isAppError ? (error as AppError).details : undefined;

    // Logger l'erreur
    if (statusCode >= 500) {
        Logger.error('Erreur serveur', error, {
            path: req.path,
            method: req.method,
            ip: req.ip,
            userId: (req as any).user?.id,
        });
    } else {
        Logger.warn('Erreur client', {
            path: req.path,
            method: req.method,
            statusCode,
            code,
            message,
            ip: req.ip,
        });
    }

    // Construire la reponse d'erreur
    const errorResponse: ErrorResponse = {
        success: false,
        error: {
            code,
            message,
            ...(details && { details }),
            // Inclure la stack trace uniquement en developpement
            ...(!isProduction() && { stack: error.stack }),
        },
    };

    // Envoyer la reponse
    res.status(statusCode).json(errorResponse);
}

// Middleware pour gerer les routes non trouvees (404)
export function notFoundHandler(req: Request, res: Response): void {
    Logger.warn('Route non trouvee', {
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} introuvable`,
        },
    });
}

// Middleware pour gerer les erreurs asynchrones
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Middleware pour valider le Content-Type des requetes
export function validateContentType(req: Request, res: Response, next: NextFunction): void {
    // Ignorer pour les requetes GET, HEAD, DELETE
    if (['GET', 'HEAD', 'DELETE'].includes(req.method)) {
        return next();
    }

    // Verifier que le Content-Type est application/json
    const contentType = req.get('Content-Type');

    if (!contentType || !contentType.includes('application/json')) {
        Logger.warn('Content-Type invalide', {
            path: req.path,
            method: req.method,
            contentType,
        });

        res.status(415).json({
            success: false,
            error: {
                code: 'INVALID_CONTENT_TYPE',
                message: 'Content-Type doit etre application/json',
            },
        });
        return;
    }

    next();
}

// Middleware pour logger toutes les requetes
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    // Logger quand la reponse est terminee
    res.on('finish', () => {
        const duration = Date.now() - start;

        Logger.http(`${req.method} ${req.path}`, {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: (req as any).user?.id,
        });
    });

    next();
}
