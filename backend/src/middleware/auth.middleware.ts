// Middleware pour l'authentification JWT/Supabase
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/database.config';
import { UnauthorizedError } from '../services/error.service';
import { Logger } from '../services/logger.service';

// Interface pour etendre Request avec l'utilisateur
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}

// Middleware pour verifier l'authentification
export async function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Recuperer le token depuis le header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Token manquant ou invalide');
        }

        const token = authHeader.substring(7); // Retirer "Bearer "

        // Verifier le token avec Supabase
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            Logger.warn('Tentative d\'authentification echouee', {
                error: error?.message,
                ip: req.ip,
            });
            throw new UnauthorizedError('Token invalide ou expire');
        }

        // Attacher l'utilisateur a la requete
        req.user = {
            id: data.user.id,
            email: data.user.email || '',
            role: data.user.user_metadata?.role,
        };

        Logger.debug(`Utilisateur authentifie: ${req.user.email}`, {
            userId: req.user.id,
        });

        next();
    } catch (error) {
        next(error);
    }
}

// Middleware optionnel : authentification sans erreur si pas de token
export async function optionalAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Pas de token = continuer sans utilisateur
            Logger.debug('optionalAuth: Pas de token fourni');
            return next();
        }

        const token = authHeader.substring(7);
        const { data, error } = await supabase.auth.getUser(token);

        if (error) {
            Logger.warn('optionalAuth: Erreur validation token', { error: error.message });
            return next();
        }

        if (data.user) {
            req.user = {
                id: data.user.id,
                email: data.user.email || '',
                role: data.user.user_metadata?.role,
            };
            Logger.debug('optionalAuth: Utilisateur authentifie', { userId: data.user.id });
        }

        next();
    } catch (error) {
        // En cas d'erreur, on continue sans utilisateur
        Logger.warn('optionalAuth: Exception', { error });
        next();
    }
}

// Middleware pour verifier un role specifique
export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentification requise'));
        }

        if (!req.user.role || !roles.includes(req.user.role)) {
            Logger.warn('Acces refuse : role insuffisant', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
            });
            return next(
                new UnauthorizedError('Permissions insuffisantes pour cette action')
            );
        }

        next();
    };
}

// Middleware pour verifier que l'utilisateur est proprietaire d'une ressource
export function requireOwnership(resourceIdParam: string = 'id') {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Authentification requise');
            }

            const resourceId = req.params[resourceIdParam];
            if (!resourceId) {
                throw new Error('ID de ressource manquant');
            }

            // Verifier la propriete dans la base de donnees
            // Cette verification sera adaptee selon le type de ressource
            // Pour l'instant, on suppose que l'ID de la ressource correspond a user_id

            next();
        } catch (error) {
            next(error);
        }
    };
}
