// Controleur pour les endpoints de gestion des scans
import { Response, NextFunction } from 'express';
import { ScansService } from './scans.service';
import type { AuthRequest } from '../../middleware/auth.middleware';
import type { ScanFilters } from './scans.types';

export class ScansController {
    /**
     * GET /api/scans - Recuperer la liste des scans de l'utilisateur
     */
    static async getScans(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentification requise',
                });
                return;
            }

            const filters: ScanFilters = {
                user_id: req.user.id,
                scan_type: req.query.scan_type as any,
                mode: req.query.mode as any,
                min_score: req.query.min_score ? parseInt(req.query.min_score as string) : undefined,
                max_score: req.query.max_score ? parseInt(req.query.max_score as string) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
                offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
            };

            const result = await ScansService.getScans(filters);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/scans/:id - Recuperer un scan specifique
     */
    static async getScanById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentification requise',
                });
                return;
            }

            const scanId = req.params.id;
            const scan = await ScansService.getScanById(scanId, req.user.id);

            res.status(200).json({
                success: true,
                data: scan,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/scans/:id - Supprimer un scan
     */
    static async deleteScan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentification requise',
                });
                return;
            }

            const scanId = req.params.id;
            await ScansService.deleteScan(scanId, req.user.id);

            res.status(200).json({
                success: true,
                message: 'Scan supprime avec succes',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/scans/stats/me - Recuperer les statistiques de l'utilisateur
     */
    static async getUserStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentification requise',
                });
                return;
            }

            const stats = await ScansService.getUserStats(req.user.id);

            res.status(200).json({
                success: true,
                data: stats || {
                    user_id: req.user.id,
                    total_scans: 0,
                    average_score: 0,
                    best_score: 0,
                    worst_score: 0,
                    unique_urls: 0,
                    last_scan_at: null,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/scans/recent - Recuperer les derniers scans de l'utilisateur
     */
    static async getRecentScans(
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentification requise',
                });
                return;
            }

            const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
            const scans = await ScansService.getRecentScans(req.user.id, limit);

            res.status(200).json({
                success: true,
                data: scans,
            });
        } catch (error) {
            next(error);
        }
    }
}
