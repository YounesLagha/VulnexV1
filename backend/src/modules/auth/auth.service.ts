// Service pour l'authentification avec Supabase
import { supabase } from '../../config/database.config';
import { BadRequestError, UnauthorizedError } from '../../services/error.service';
import { Logger } from '../../services/logger.service';
import type { RegisterRequest, LoginRequest, AuthResponse, UserProfile } from './auth.types';

export class AuthService {
    /**
     * Inscription d'un nouvel utilisateur
     */
    static async register(data: RegisterRequest): Promise<AuthResponse> {
        try {
            // Validation des donnees
            if (!data.email || !data.password) {
                throw new BadRequestError('Email et mot de passe requis');
            }

            if (data.password.length < 8) {
                throw new BadRequestError('Le mot de passe doit contenir au moins 8 caracteres');
            }

            // Validation email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                throw new BadRequestError('Format d\'email invalide');
            }

            // Creer l'utilisateur avec Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name || null,
                    },
                },
            });

            if (authError) {
                Logger.error('Erreur lors de l\'inscription', {
                    error: authError.message,
                    email: data.email,
                });
                throw new BadRequestError(authError.message);
            }

            if (!authData.user) {
                throw new BadRequestError('Erreur lors de la creation du compte');
            }

            Logger.info('Nouvel utilisateur inscrit', {
                userId: authData.user.id,
                email: authData.user.email,
                emailConfirmed: !!authData.session,
            });

            // Si pas de session, c'est que l'email doit etre confirme
            if (!authData.session) {
                return {
                    user: {
                        id: authData.user.id,
                        email: authData.user.email || '',
                        name: authData.user.user_metadata?.name,
                        created_at: authData.user.created_at,
                    },
                    session: {
                        access_token: '',
                        refresh_token: '',
                        expires_at: 0,
                        expires_in: 0,
                    },
                };
            }

            return {
                user: {
                    id: authData.user.id,
                    email: authData.user.email || '',
                    name: authData.user.user_metadata?.name,
                    created_at: authData.user.created_at,
                },
                session: {
                    access_token: authData.session.access_token,
                    refresh_token: authData.session.refresh_token,
                    expires_at: authData.session.expires_at || 0,
                    expires_in: authData.session.expires_in || 0,
                },
            };
        } catch (error) {
            if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
                throw error;
            }
            Logger.error('Erreur inattendue lors de l\'inscription', { error });
            throw new BadRequestError('Erreur lors de l\'inscription');
        }
    }

    /**
     * Connexion d'un utilisateur
     */
    static async login(data: LoginRequest): Promise<AuthResponse> {
        try {
            // Validation des donnees
            if (!data.email || !data.password) {
                throw new BadRequestError('Email et mot de passe requis');
            }

            // Authentifier avec Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError || !authData.user || !authData.session) {
                Logger.warn('Tentative de connexion echouee', {
                    email: data.email,
                    error: authError?.message,
                });
                throw new UnauthorizedError('Email ou mot de passe incorrect');
            }

            Logger.info('Utilisateur connecte', {
                userId: authData.user.id,
                email: authData.user.email,
            });

            return {
                user: {
                    id: authData.user.id,
                    email: authData.user.email || '',
                    name: authData.user.user_metadata?.name,
                    created_at: authData.user.created_at,
                },
                session: {
                    access_token: authData.session.access_token,
                    refresh_token: authData.session.refresh_token,
                    expires_at: authData.session.expires_at || 0,
                    expires_in: authData.session.expires_in || 0,
                },
            };
        } catch (error) {
            if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
                throw error;
            }
            Logger.error('Erreur inattendue lors de la connexion', { error });
            throw new UnauthorizedError('Erreur lors de la connexion');
        }
    }

    /**
     * Deconnexion d'un utilisateur
     */
    static async logout(): Promise<void> {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                Logger.error('Erreur lors de la deconnexion', { error: error.message });
                throw new BadRequestError('Erreur lors de la deconnexion');
            }

            Logger.info('Utilisateur deconnecte');
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            Logger.error('Erreur inattendue lors de la deconnexion', { error });
            throw new BadRequestError('Erreur lors de la deconnexion');
        }
    }

    /**
     * Rafraichir le token d'acces
     */
    static async refreshToken(refreshToken: string): Promise<AuthResponse> {
        try {
            const { data: authData, error: authError } = await supabase.auth.refreshSession({
                refresh_token: refreshToken,
            });

            if (authError || !authData.session || !authData.user) {
                Logger.warn('Echec du rafraichissement du token');
                throw new UnauthorizedError('Token de rafraichissement invalide');
            }

            Logger.info('Token rafraichi', { userId: authData.user.id });

            return {
                user: {
                    id: authData.user.id,
                    email: authData.user.email || '',
                    name: authData.user.user_metadata?.name,
                    created_at: authData.user.created_at,
                },
                session: {
                    access_token: authData.session.access_token,
                    refresh_token: authData.session.refresh_token,
                    expires_at: authData.session.expires_at || 0,
                    expires_in: authData.session.expires_in || 0,
                },
            };
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            Logger.error('Erreur lors du rafraichissement du token', { error });
            throw new UnauthorizedError('Erreur lors du rafraichissement du token');
        }
    }

    /**
     * Recuperer le profil de l'utilisateur connecte
     */
    static async getProfile(userId: string): Promise<UserProfile> {
        try {
            // Recuperer les infos de l'utilisateur depuis Supabase Auth
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
                userId
            );

            if (userError || !userData.user) {
                throw new BadRequestError('Utilisateur introuvable');
            }

            // Compter le nombre de scans de l'utilisateur
            const { count, error: countError } = await supabase
                .from('scans')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (countError) {
                Logger.warn('Erreur lors du comptage des scans', { error: countError.message });
            }

            return {
                id: userData.user.id,
                email: userData.user.email || '',
                name: userData.user.user_metadata?.name,
                created_at: userData.user.created_at,
                scans_count: count || 0,
            };
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            Logger.error('Erreur lors de la recuperation du profil', { error });
            throw new BadRequestError('Erreur lors de la recuperation du profil');
        }
    }
}
