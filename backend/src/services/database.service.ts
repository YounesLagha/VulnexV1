// Service de gestion de la base de données Supabase
import { supabase } from '../config/database.config';
import { Logger } from './logger.service';
import { DatabaseError, NotFoundError } from './error.service';
import type { ScanStatus } from '../types/common.types';

// Interfaces pour les opérations de base de données
interface ScanData {
    id?: string;
    user_id?: string | null;
    url: string;
    status?: ScanStatus;
    results?: any;
    score?: number | null;
    grade?: string | null;
    error?: string | null;
    created_at?: string;
    updated_at?: string;
    completed_at?: string | null;
}

interface ReportData {
    id?: string;
    scan_id: string;
    user_id?: string | null;
    pdf_url: string;
    expires_at: string;
    created_at?: string;
}

// Service pour gérer les scans dans la base de données
export class ScanDatabaseService {
    // Créer un nouveau scan
    static async createScan(data: ScanData): Promise<any> {
        try {
            const { data: scan, error } = await supabase
                .from('scans')
                .insert(data as any)
                .select()
                .single();

            if (error) {
                Logger.error('Erreur lors de la création du scan', error);
                throw new DatabaseError('Impossible de créer le scan');
            }

            Logger.database('Scan créé avec succès', { scanId: scan.id });
            return scan;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            Logger.error('Erreur inattendue lors de la création du scan', error as Error);
            throw new DatabaseError('Erreur lors de la création du scan');
        }
    }

    // Récupérer un scan par son ID
    static async getScanById(scanId: string, userId?: string): Promise<any> {
        try {
            let query = supabase
                .from('scans')
                .select('*')
                .eq('id', scanId);

            // Filtrer par userId si fourni (sécurité)
            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data: scan, error } = await query.single();

            if (error || !scan) {
                Logger.warn('Scan non trouvé', { scanId, userId });
                throw new NotFoundError('Scan introuvable');
            }

            return scan;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            Logger.error('Erreur lors de la récupération du scan', error as Error);
            throw new DatabaseError('Erreur lors de la récupération du scan');
        }
    }

    // Mettre à jour un scan
    static async updateScan(scanId: string, data: Partial<ScanData>): Promise<any> {
        try {
            const { data: scan, error } = await supabase
                .from('scans')
                .update({ ...data, updated_at: new Date().toISOString() } as any)
                .eq('id', scanId)
                .select()
                .single();

            if (error || !scan) {
                Logger.error('Erreur lors de la mise à jour du scan', error);
                throw new DatabaseError('Impossible de mettre à jour le scan');
            }

            Logger.database('Scan mis à jour', { scanId });
            return scan;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            Logger.error('Erreur inattendue lors de la mise à jour du scan', error as Error);
            throw new DatabaseError('Erreur lors de la mise à jour du scan');
        }
    }

    // Mettre à jour le statut d'un scan
    static async updateScanStatus(scanId: string, status: ScanStatus): Promise<any> {
        const updateData: Partial<ScanData> = {
            status,
            updated_at: new Date().toISOString(),
        };

        // Si le scan est terminé, ajouter la date de fin
        if (status === 'completed' || status === 'failed') {
            updateData.completed_at = new Date().toISOString();
        }

        return this.updateScan(scanId, updateData);
    }

    // Lister les scans avec pagination
    static async listScans(
        userId?: string,
        options?: {
            page?: number;
            limit?: number;
            status?: ScanStatus;
        }
    ): Promise<{ scans: any[]; total: number }> {
        try {
            const page = options?.page || 1;
            const limit = options?.limit || 10;
            const offset = (page - 1) * limit;

            // Construction de la requête
            let query = supabase.from('scans').select('*', { count: 'exact' });

            // Filtres
            if (userId) {
                query = query.eq('user_id', userId);
            }
            if (options?.status) {
                query = query.eq('status', options.status);
            }

            // Pagination et tri
            const { data: scans, error, count } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                Logger.error('Erreur lors de la récupération des scans', error);
                throw new DatabaseError('Impossible de récupérer les scans');
            }

            return {
                scans: scans || [],
                total: count || 0,
            };
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            Logger.error('Erreur inattendue lors de la récupération des scans', error as Error);
            throw new DatabaseError('Erreur lors de la récupération des scans');
        }
    }

    // Supprimer un scan
    static async deleteScan(scanId: string, userId?: string): Promise<void> {
        try {
            let query = supabase.from('scans').delete().eq('id', scanId);

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { error } = await query;

            if (error) {
                Logger.error('Erreur lors de la suppression du scan', error);
                throw new DatabaseError('Impossible de supprimer le scan');
            }

            Logger.database('Scan supprimé', { scanId });
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            Logger.error('Erreur inattendue lors de la suppression du scan', error as Error);
            throw new DatabaseError('Erreur lors de la suppression du scan');
        }
    }
}

// Service pour gérer les rapports PDF
export class ReportDatabaseService {
    // Créer un nouveau rapport
    static async createReport(data: ReportData): Promise<any> {
        try {
            const { data: report, error } = await supabase
                .from('reports')
                .insert(data as any)
                .select()
                .single();

            if (error) {
                Logger.error('Erreur lors de la création du rapport', error);
                throw new DatabaseError('Impossible de créer le rapport');
            }

            Logger.database('Rapport créé avec succès', { reportId: report.id });
            return report;
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            Logger.error('Erreur inattendue lors de la création du rapport', error as Error);
            throw new DatabaseError('Erreur lors de la création du rapport');
        }
    }

    // Récupérer un rapport par son ID
    static async getReportById(reportId: string): Promise<any> {
        try {
            const { data: report, error } = await supabase
                .from('reports')
                .select('*')
                .eq('id', reportId)
                .single();

            if (error || !report) {
                Logger.warn('Rapport non trouvé', { reportId });
                throw new NotFoundError('Rapport introuvable');
            }

            return report;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            Logger.error('Erreur lors de la récupération du rapport', error as Error);
            throw new DatabaseError('Erreur lors de la récupération du rapport');
        }
    }

    // Récupérer les rapports d'un scan
    static async getReportsByScanId(scanId: string): Promise<any[]> {
        try {
            const { data: reports, error } = await supabase
                .from('reports')
                .select('*')
                .eq('scan_id', scanId)
                .order('created_at', { ascending: false });

            if (error) {
                Logger.error('Erreur lors de la récupération des rapports', error);
                throw new DatabaseError('Impossible de récupérer les rapports');
            }

            return reports || [];
        } catch (error) {
            if (error instanceof DatabaseError) throw error;
            Logger.error('Erreur inattendue lors de la récupération des rapports', error as Error);
            throw new DatabaseError('Erreur lors de la récupération des rapports');
        }
    }
}

// Export par défaut
export default {
    Scan: ScanDatabaseService,
    Report: ReportDatabaseService,
};
