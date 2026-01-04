// Service pour la gestion des scans en base de donnees
import { supabase } from '../../config/database.config';
import { Logger } from '../../services/logger.service';
import { BadRequestError, NotFoundError } from '../../services/error.service';
import type {
    ScanRecord,
    CreateScanInput,
    ScanFilters,
    UserScanStats,
    ScanListResponse,
} from './scans.types';

export class ScansService {
    /**
     * Creer un nouveau scan en base de donnees
     */
    static async createScan(input: CreateScanInput): Promise<ScanRecord> {
        try {
            const { data, error } = await (supabase as any)
                .from('scans')
                .insert({
                    user_id: input.user_id || null,
                    url: input.url,
                    score: input.score,
                    scan_type: input.scan_type,
                    mode: input.mode,
                    results: input.results,
                    ai_analysis: input.ai_analysis || null,
                    ai_tokens_used: input.ai_tokens_used || null,
                })
                .select()
                .single();

            if (error) {
                Logger.error('Erreur lors de la creation du scan', { error: error.message });
                throw new BadRequestError('Erreur lors de la sauvegarde du scan');
            }

            Logger.info('Scan sauvegarde en base', {
                scanId: data.id,
                userId: input.user_id,
                url: input.url,
                score: input.score,
            });

            return data as ScanRecord;
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            Logger.error('Erreur inattendue lors de la creation du scan', { error });
            throw new BadRequestError('Erreur lors de la sauvegarde du scan');
        }
    }

    /**
     * Recuperer un scan par ID
     */
    static async getScanById(scanId: string, userId?: string): Promise<ScanRecord> {
        try {
            let query = (supabase as any).from('scans').select('*').eq('id', scanId);

            // Si userId fourni, verifier que le scan appartient a l'utilisateur
            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query.single();

            if (error || !data) {
                throw new NotFoundError('Scan introuvable');
            }

            return data as ScanRecord;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            Logger.error('Erreur lors de la recuperation du scan', { error, scanId });
            throw new BadRequestError('Erreur lors de la recuperation du scan');
        }
    }

    /**
     * Recuperer la liste des scans avec filtres
     */
    static async getScans(filters: ScanFilters): Promise<ScanListResponse> {
        try {
            let query = (supabase as any).from('scans').select('*', { count: 'exact' });

            // Appliquer les filtres
            if (filters.user_id) {
                query = query.eq('user_id', filters.user_id);
            }

            if (filters.url) {
                query = query.eq('url', filters.url);
            }

            if (filters.scan_type) {
                query = query.eq('scan_type', filters.scan_type);
            }

            if (filters.mode) {
                query = query.eq('mode', filters.mode);
            }

            if (filters.min_score !== undefined) {
                query = query.gte('score', filters.min_score);
            }

            if (filters.max_score !== undefined) {
                query = query.lte('score', filters.max_score);
            }

            if (filters.start_date) {
                query = query.gte('created_at', filters.start_date);
            }

            if (filters.end_date) {
                query = query.lte('created_at', filters.end_date);
            }

            // Pagination
            const limit = filters.limit || 20;
            const offset = filters.offset || 0;

            query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                Logger.error('Erreur lors de la recuperation des scans', { error: error.message });
                throw new BadRequestError('Erreur lors de la recuperation des scans');
            }

            return {
                scans: (data as ScanRecord[]) || [],
                total: count || 0,
                page: Math.floor(offset / limit) + 1,
                limit,
            };
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            Logger.error('Erreur inattendue lors de la recuperation des scans', { error });
            throw new BadRequestError('Erreur lors de la recuperation des scans');
        }
    }

    /**
     * Supprimer un scan
     */
    static async deleteScan(scanId: string, userId: string): Promise<void> {
        try {
            const { error } = await (supabase as any)
                .from('scans')
                .delete()
                .eq('id', scanId)
                .eq('user_id', userId);

            if (error) {
                Logger.error('Erreur lors de la suppression du scan', { error: error.message });
                throw new BadRequestError('Erreur lors de la suppression du scan');
            }

            Logger.info('Scan supprime', { scanId, userId });
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            Logger.error('Erreur inattendue lors de la suppression du scan', { error });
            throw new BadRequestError('Erreur lors de la suppression du scan');
        }
    }

    /**
     * Recuperer les statistiques d'un utilisateur
     */
    static async getUserStats(userId: string): Promise<UserScanStats | null> {
        try {
            const { data, error } = await (supabase as any)
                .from('user_scan_stats')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                // Si aucune stat trouvee, retourner null
                if (error.code === 'PGRST116') {
                    return null;
                }
                Logger.error('Erreur lors de la recuperation des stats', { error: error.message });
                throw new BadRequestError('Erreur lors de la recuperation des statistiques');
            }

            return data as UserScanStats;
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            Logger.error('Erreur inattendue lors de la recuperation des stats', { error });
            throw new BadRequestError('Erreur lors de la recuperation des statistiques');
        }
    }

    /**
     * Recuperer les derniers scans d'un utilisateur
     */
    static async getRecentScans(userId: string, limit: number = 5): Promise<ScanRecord[]> {
        try {
            const { data, error } = await (supabase as any)
                .from('scans')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                Logger.error('Erreur lors de la recuperation des scans recents', {
                    error: error.message,
                });
                throw new BadRequestError('Erreur lors de la recuperation des scans recents');
            }

            return (data as ScanRecord[]) || [];
        } catch (error) {
            if (error instanceof BadRequestError) {
                throw error;
            }
            Logger.error('Erreur inattendue lors de la recuperation des scans recents', { error });
            throw new BadRequestError('Erreur lors de la recuperation des scans recents');
        }
    }
}
