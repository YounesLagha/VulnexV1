// Controleur pour les endpoints de scan des headers HTTP
import { Request, Response, NextFunction } from 'express';
import { HeadersService } from './headers.service';
import { Logger } from '../../services/logger.service';
import { Validator } from '../../services/validator.service';
import { BadRequestError } from '../../services/error.service';

// Controleur pour le scan des headers
export class HeadersController {
    // Endpoint: POST /api/scan/headers
    static async scanHeaders(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { url } = req.body;

            // Validation de l'URL
            if (!url || typeof url !== 'string') {
                throw new BadRequestError('URL manquante ou invalide');
            }

            if (!Validator.isValidUrl(url)) {
                throw new BadRequestError('Format d\'URL invalide');
            }

            if (!Validator.isSafeUrl(url)) {
                throw new BadRequestError(
                    'URL non autorisee (localhost, IP privee ou protocole non securise)'
                );
            }

            Logger.info(`Requete de scan des headers recue`, { url });

            // Scanner les headers
            const result = await HeadersService.scanHeaders(url);

            // Reponse success
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    // Endpoint: GET /api/scan/headers/check (verification rapide)
    static async quickCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { url } = req.query;

            if (!url || typeof url !== 'string') {
                throw new BadRequestError('URL manquante ou invalide');
            }

            if (!Validator.isValidUrl(url)) {
                throw new BadRequestError('Format d\'URL invalide');
            }

            Logger.info(`Requete de verification rapide des headers`, { url });

            const result = await HeadersService.scanHeaders(url);

            // Calculer le nombre de headers securises
            const headersArray = Object.values(result.headers);
            const secureCount = headersArray.filter((h) => h.secure).length;
            const totalHeadersChecked = headersArray.length;

            // Retourner seulement un resume
            res.status(200).json({
                success: true,
                data: {
                    url,
                    score: result.score, // Deja normalise sur 100
                    maxScore: 100,
                    percentage: result.score,
                    secureHeaders: secureCount,
                    totalHeaders: totalHeadersChecked,
                    missingHeaders: result.missingHeaders.length,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
