// Controleur pour les endpoints d'analyse IA
import { Request, Response, NextFunction } from 'express';
import { AIService, ScanMode } from './ai.service';
import { HeadersService } from '../headers/headers.service';
import { SslService } from '../ssl/ssl.service';
import { ScansService } from '../scans/scans.service';
import { Logger } from '../../services/logger.service';
import { Validator } from '../../services/validator.service';
import { BadRequestError } from '../../services/error.service';

export class AIController {
    // Endpoint: POST /api/ai/analyze
    // Analyser un scan avec l'IA
    static async analyzeScan(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { url, mode } = req.body;

            // Validation
            if (!url || typeof url !== 'string') {
                throw new BadRequestError('URL manquante ou invalide');
            }

            if (!Validator.isValidUrl(url)) {
                throw new BadRequestError("Format d'URL invalide");
            }

            if (!Validator.isSafeUrl(url)) {
                throw new BadRequestError('URL non autorisée');
            }

            // Valider le mode
            const scanMode: ScanMode = mode === 'full' ? 'full' : 'free';

            // Si mode 'full', verifier que l'utilisateur est authentifié
            const user = (req as any).user;
            if (scanMode === 'full' && !user) {
                throw new BadRequestError(
                    'Authentification requise pour le mode Full Scan. Créez un compte gratuit.'
                );
            }

            // Vérifier que Groq est configuré
            if (!AIService.isConfigured()) {
                throw new BadRequestError(
                    'Service d\'analyse IA non configuré. Contactez l\'administrateur.'
                );
            }

            Logger.info(`Requéte d'analyse IA recue`, { url, mode: scanMode });

            // 1. Effectuer le scan des headers
            const headersResult = await HeadersService.scanHeaders(url);

            // 2. Effectuer le scan SSL/TLS (en parallèle avec les headers pour gagner du temps)
            let sslResult = null;
            try {
                sslResult = await SslService.scanSsl(url);
                Logger.info('Scan SSL terminé', { score: sslResult.score, grade: sslResult.grade });
            } catch (error) {
                Logger.warn('Scan SSL échoué, continuation sans SSL', { error: (error as Error).message });
            }

            // 3. Calculer le score global AVANT la sauvegarde
            const scores = [headersResult.score];
            if (sslResult) {
                scores.push(sslResult.score);
            }
            const globalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

            // 4. Analyser avec l'IA (passer le globalScore calculé)
            const aiAnalysis = await AIService.analyzeScan(
                {
                    url,
                    headersResult,
                    sslResult,
                    globalScore, // ✅ Passer le score global calculé
                },
                scanMode
            );

            // 5. Sauvegarder le scan en base de données avec le score global et tous les résultats
            let savedScan = null;
            try {
                savedScan = await ScansService.createScan({
                    user_id: user?.id,
                    url,
                    score: globalScore, // ✅ Score global (moyenne Headers + SSL)
                    scan_type: sslResult ? 'full' : 'headers', // Type de scan correct
                    mode: scanMode,
                    results: {
                        headers: headersResult,
                        ssl: sslResult ?? undefined,
                        score: {
                            total: globalScore,
                            grade: globalScore >= 80 ? 'A' : globalScore >= 60 ? 'B' : globalScore >= 40 ? 'C' : 'D',
                            calculatedAt: new Date().toISOString(),
                            breakdown: {
                                headers: {
                                    score: headersResult.score,
                                    maxScore: 100,
                                    weight: sslResult ? 0.5 : 1,
                                    weightedScore: headersResult.score * (sslResult ? 0.5 : 1),
                                    issues: headersResult.missingHeaders.length
                                },
                                ssl: sslResult ? {
                                    score: sslResult.score,
                                    maxScore: 100,
                                    weight: 0.5,
                                    weightedScore: sslResult.score * 0.5,
                                    issues: sslResult.vulnerabilities.length
                                } : {
                                    score: 0,
                                    maxScore: 0,
                                    weight: 0,
                                    weightedScore: 0,
                                    issues: 0
                                },
                                ports: { score: 0, maxScore: 0, weight: 0, weightedScore: 0, issues: 0 },
                                technologies: { score: 0, maxScore: 0, weight: 0, weightedScore: 0, issues: 0 },
                                misconfiguration: { score: 0, maxScore: 0, weight: 0, weightedScore: 0, issues: 0 }
                            }
                        }
                    }, // ✅ Tous les résultats inclus avec structure correcte
                    ai_analysis: aiAnalysis.report,
                    ai_tokens_used: aiAnalysis.tokensUsed,
                });
                Logger.info('Scan sauvegarde en base', { scanId: savedScan.id, globalScore });
            } catch (error) {
                // Log l'erreur mais ne bloque pas la réponse
                Logger.error('Erreur lors de la sauvegarde du scan', { error });
            }

            // 5. Retourner le résultat
            res.status(200).json({
                success: true,
                data: {
                    url,
                    mode: scanMode,
                    score: globalScore, // Score global
                    analysis: aiAnalysis.report,
                    generatedAt: aiAnalysis.generatedAt,
                    scanId: savedScan?.id || null,
                    // Toujours retourner les détails pour l'affichage
                    details: {
                        headers: headersResult,
                        ssl: sslResult,
                        ...(scanMode === 'full' && {
                            tokensUsed: aiAnalysis.tokensUsed,
                        }),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // Endpoint: GET /api/ai/status
    // Vérifier si l'IA est disponible
    static async checkStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const isConfigured = AIService.isConfigured();

            res.status(200).json({
                success: true,
                data: {
                    available: isConfigured,
                    provider: 'Groq',
                    model: 'llama-3.3-70b-versatile',
                    modes: ['free', 'full'],
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
