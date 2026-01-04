// Service pour l'analyse IA avec Groq
import Groq from 'groq-sdk';
import { Logger } from '../../services/logger.service';
import { env } from '../../config/env.config';
import { HeadersScanResult, SslScanResult } from '../../types';
import { generateFreeScanPrompt } from './prompts/free-scan.prompt';
import { generateFullScanPrompt } from './prompts/full-scan.prompt';

// Type de scan
export type ScanMode = 'free' | 'full';

// Interface pour les données de scan
export interface ScanAnalysisInput {
    url: string;
    headersResult: HeadersScanResult;
    sslResult?: SslScanResult | null;
    globalScore: number; // ✅ Score global calculé par le controller
    // Ajoutez d'autres résultats quand vous les aurez (ports, etc.)
    // portsResult?: PortsScanResult;
}

// Résultat de l'analyse IA
export interface AIAnalysisResult {
    mode: ScanMode;
    report: string;
    generatedAt: string;
    tokensUsed?: number;
}

export class AIService {
    private static groqClient: Groq;

    // Initialiser le client Groq
    private static getClient(): Groq {
        if (!this.groqClient) {
            const apiKey = env.GROQ_API_KEY;

            if (!apiKey || apiKey === 'your-groq-api-key-here') {
                throw new Error(
                    'GROQ_API_KEY non configurée. Obtenez votre clé gratuite sur https://console.groq.com'
                );
            }

            this.groqClient = new Groq({
                apiKey,
            });

            Logger.info('Client Groq initialisé avec succés');
        }

        return this.groqClient;
    }

    // Analyser un scan avec l'IA
    static async analyzeScan(
        scanData: ScanAnalysisInput,
        mode: ScanMode = 'free'
    ): Promise<AIAnalysisResult> {
        try {
            Logger.info(`Début de l'analyse IA en mode ${mode}`, {
                url: scanData.url,
                globalScore: scanData.globalScore,
            });

            // Utiliser le score global passé par le controller (déjà calculé : moyenne headers + ssl)
            const globalScore = scanData.globalScore;

            // Générer le prompt selon le mode
            const prompt =
                mode === 'free'
                    ? generateFreeScanPrompt({
                          url: scanData.url,
                          headersResult: scanData.headersResult,
                          globalScore,
                      })
                    : generateFullScanPrompt({
                          url: scanData.url,
                          headersResult: scanData.headersResult,
                          globalScore,
                      });

            // Appeler Groq
            const client = this.getClient();
            const completion = await client.chat.completions.create({
                model: 'llama-3.3-70b-versatile', // Modéle gratuit et performant
                messages: [
                    {
                        role: 'system',
                        content:
                            'Tu es un expert en cybersécurité spécialisé dans l\'analyse de vulnérabilités web. Tu produis des rapports clairs et professionnels.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3, // Moins de créativité, plus de précision
                max_tokens: mode === 'free' ? 400 : 2000, // Augmenté pour FREE (150 mots ≈ 400 tokens)
                top_p: 1,
            });

            const report = completion.choices[0]?.message?.content || '';
            const tokensUsed = completion.usage?.total_tokens;

            Logger.info(`Analyse IA terminée (${mode})`, {
                url: scanData.url,
                tokensUsed,
                reportLength: report.length,
            });

            return {
                mode,
                report,
                generatedAt: new Date().toISOString(),
                tokensUsed,
            };
        } catch (error) {
            Logger.error('Erreur lors de l\'analyse IA', error as Error, {
                url: scanData.url,
                mode,
            });

            // Fallback en cas d'erreur
            if (mode === 'free') {
                return {
                    mode: 'free',
                    report: `Score de sécurité : ${scanData.globalScore}/100\n\nVotre site présente ${scanData.headersResult.missingHeaders.length} headers de sécurité manquants. Créez un compte gratuit pour obtenir le rapport détaillé.`,
                    generatedAt: new Date().toISOString(),
                };
            }

            throw new Error(`Erreur d'analyse IA : ${(error as Error).message}`);
        }
    }

    // Vérifier que Groq est configuré
    static isConfigured(): boolean {
        try {
            const apiKey = env.GROQ_API_KEY;
            return apiKey !== undefined && apiKey !== 'your-groq-api-key-here';
        } catch {
            return false;
        }
    }
}
