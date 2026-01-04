// Controleur pour les routes d'authentification
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import type { RegisterRequest, LoginRequest, RefreshTokenRequest } from './auth.types';
import type { AuthRequest } from '../../middleware/auth.middleware';

export class AuthController {
    /**
     * POST /api/auth/register - Inscription d'un nouvel utilisateur
     */
    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password, name } = req.body as RegisterRequest;

            const result = await AuthService.register({ email, password, name });

            // Si pas de token, c'est que l'email doit etre confirme
            const needsConfirmation = !result.session.access_token;

            res.status(201).json({
                success: true,
                message: needsConfirmation
                    ? 'Inscription reussie. Verifiez votre email pour confirmer votre compte.'
                    : 'Inscription reussie',
                data: result,
                emailConfirmationRequired: needsConfirmation,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/login - Connexion d'un utilisateur
     */
    static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body as LoginRequest;

            const result = await AuthService.login({ email, password });

            res.status(200).json({
                success: true,
                message: 'Connexion reussie',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/logout - Deconnexion d'un utilisateur
     */
    static async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await AuthService.logout();

            res.status(200).json({
                success: true,
                message: 'Deconnexion reussie',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/auth/refresh - Rafraichir le token d'acces
     */
    static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refresh_token } = req.body as RefreshTokenRequest;

            if (!refresh_token) {
                res.status(400).json({
                    success: false,
                    message: 'Token de rafraichissement requis',
                });
                return;
            }

            const result = await AuthService.refreshToken(refresh_token);

            res.status(200).json({
                success: true,
                message: 'Token rafraichi avec succes',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/auth/profile - Recuperer le profil de l'utilisateur connecte
     */
    static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentification requise',
                });
                return;
            }

            const profile = await AuthService.getProfile(req.user.id);

            res.status(200).json({
                success: true,
                data: profile,
            });
        } catch (error) {
            next(error);
        }
    }
}
