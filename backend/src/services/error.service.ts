// Service de gestion des erreurs standardis�es
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { ERROR_MESSAGES } from '../config/constants';

// Classe personnalis�e pour les erreurs applicatives
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;
    public readonly details?: Record<string, any>;

    constructor(
        message: string,
        statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
        code: string = 'INTERNAL_ERROR',
        isOperational: boolean = true,
        details?: Record<string, any>
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;

        // Maintenir la stack trace correcte
        Error.captureStackTrace(this, this.constructor);
    }
}

// Erreur de validation (400)
export class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', true, details);
    }
}

// Erreur de requete invalide (400)
export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, StatusCodes.BAD_REQUEST, 'BAD_REQUEST', true);
    }
}

// Erreur non autoris� (401)
export class UnauthorizedError extends AppError {
    constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
        super(message, StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', true);
    }
}

// Erreur interdit (403)
export class ForbiddenError extends AppError {
    constructor(message: string = 'Acc�s interdit') {
        super(message, StatusCodes.FORBIDDEN, 'FORBIDDEN', true);
    }
}

// Erreur non trouv� (404)
export class NotFoundError extends AppError {
    constructor(message: string = 'Ressource non trouv�e') {
        super(message, StatusCodes.NOT_FOUND, 'NOT_FOUND', true);
    }
}

// Erreur de conflit (409)
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, StatusCodes.CONFLICT, 'CONFLICT', true);
    }
}

// Erreur de rate limit (429)
export class RateLimitError extends AppError {
    constructor(message: string = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED) {
        super(message, StatusCodes.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', true);
    }
}

// Erreur de base de donn�es (500)
export class DatabaseError extends AppError {
    constructor(message: string = ERROR_MESSAGES.DATABASE_ERROR, details?: Record<string, any>) {
        super(message, StatusCodes.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR', true, details);
    }
}

// Fonction pour formater les erreurs de validation Zod
export function formatZodError(error: ZodError): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!formattedErrors[path]) {
            formattedErrors[path] = [];
        }
        formattedErrors[path].push(err.message);
    });

    return formattedErrors;
}

// Fonction pour envoyer une r�ponse d'erreur format�e
export function sendErrorResponse(
    res: Response,
    error: AppError | Error,
    requestId?: string
): Response {
    // Si c'est une erreur Zod
    if (error instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: ERROR_MESSAGES.VALIDATION_ERROR,
                details: formatZodError(error),
            },
            metadata: {
                requestId: requestId || generateRequestId(),
                timestamp: new Date().toISOString(),
            },
        });
    }

    // Si c'est une AppError personnalis�e
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
            },
            metadata: {
                requestId: requestId || generateRequestId(),
                timestamp: new Date().toISOString(),
            },
        });
    }

    // Erreur g�n�rique non g�r�e
    console.error('Erreur non g�r�e:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        metadata: {
            requestId: requestId || generateRequestId(),
            timestamp: new Date().toISOString(),
        },
    });
}

// Fonction helper pour g�n�rer un ID de requ�te unique
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Fonction pour v�rifier si une erreur est op�rationnelle
export function isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
