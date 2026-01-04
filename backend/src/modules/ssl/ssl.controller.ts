// Contrôleur pour les scans SSL/TLS
import { Request, Response } from 'express';
import { SslService } from './ssl.service';
import { Logger } from '../../services/logger.service';

export class SslController {
    /**
     * POST /api/scan/ssl
     * Scanner les configurations SSL/TLS d'une URL
     */
    static async scanSsl(req: Request, res: Response): Promise<void> {
        try {
            const { url } = req.body;

            if (!url) {
                res.status(400).json({
                    success: false,
                    message: 'URL manquante dans la requête',
                });
                return;
            }

            // Valider l'URL
            try {
                new URL(url);
            } catch {
                res.status(400).json({
                    success: false,
                    message: 'URL invalide',
                });
                return;
            }

            Logger.info(`Requête de scan SSL pour: ${url}`);

            // Scanner SSL/TLS
            const result = await SslService.scanSsl(url);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            Logger.error('Erreur lors du scan SSL', error as Error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du scan SSL',
                error: (error as Error).message,
            });
        }
    }
}
