// Service pour analyser les headers HTTP de securite
import { HttpClient } from '../../utils/http.util';
import { Logger } from '../../services/logger.service';
import type { HeadersScanResult, HeaderInfo, ScoreDetail } from '../../types';

// Grille de scoring officielle - TOTAL: 64 points (normalise sur 100)
const HEADER_WEIGHTS = {
    // 1. Headers critiques - 45 points
    'Content-Security-Policy': 10,
    'Strict-Transport-Security': 8,
    'X-Frame-Options': 7,
    'X-Content-Type-Options': 5,
    'Set-Cookie': 15, // Analyse Secure, HttpOnly, SameSite

    // 2. Vie privee & Permissions - 6 points
    'Referrer-Policy': 3,
    'Permissions-Policy': 3,

    // 3. Cross-Origin protections - 9 points
    'Cross-Origin-Opener-Policy': 3,
    'Cross-Origin-Embedder-Policy': 3,
    'Cross-Origin-Resource-Policy': 3,

    // 4. Fuite d'information - 4 points (PENALITE si present)
    'Server': -2, // Presence = -2 points
    'X-Powered-By': -2, // Presence = -2 points
};

const MAX_SCORE = 64; // Score maximum avant normalisation

// Service d'analyse des headers
export class HeadersService {
    // Scanner les headers d'une URL
    static async scanHeaders(url: string): Promise<HeadersScanResult> {
        try {
            Logger.info(`Debut du scan des headers pour: ${url}`);

            // HTTPS PRIORITY: Tenter HTTPS si HTTP fourni
            const { url: optimalUrl, upgraded, reason } = await HttpClient.getOptimalUrl(url);

            if (upgraded) {
                Logger.info(`URL upgradée vers HTTPS: ${url} → ${optimalUrl}`, { reason });
            }

            // Recuperer les headers via requete GET (HEAD ne retourne pas tous les headers de securite)
            const response = await HttpClient.get(optimalUrl);
            const rawHeaders = response.headers as any;

            // URL finale après redirections (axios suit automatiquement les redirections)
            const finalUrl = response.request?.res?.responseUrl || optimalUrl;

            // Logger les redirections si présentes
            if (finalUrl !== optimalUrl) {
                Logger.info(`Redirections suivies: ${optimalUrl} → ${finalUrl}`, {
                    statusCode: response.status,
                    redirectCount: response.request?.res?._redirectable?._redirectCount || 'unknown'
                });
            }

            // Analyser tous les headers de securite
            const { headers, missingHeaders, recommendations } =
                this.analyzeSecurityHeaders(rawHeaders);

            // Calculer le score brut (sur 64) puis normaliser sur 100
            const { rawScore, scoreDetails } = this.calculateScoreWithDetails(headers);
            const score = Math.round((rawScore / MAX_SCORE) * 100);

            const result: HeadersScanResult = {
                headers,
                score,
                scannedAt: new Date().toISOString(),
                missingHeaders,
                recommendations,
                // Métadonnées de scan pour transparence
                scanMetadata: {
                    originalUrl: url,
                    scannedUrl: finalUrl,
                    httpsUpgraded: upgraded,
                    upgradeReason: reason,
                },
                // Détail du scoring pour transparence (V2)
                scoreBreakdown: {
                    rawScore,
                    maxScore: MAX_SCORE,
                    normalizedScore: score,
                    details: scoreDetails,
                },
            };

            Logger.info(`Scan des headers termine`, {
                originalUrl: url,
                finalUrl,
                httpsUpgraded: upgraded,
                rawScore,
                normalizedScore: score,
                headersCount: Object.keys(headers).length,
                missingCount: missingHeaders.length,
            });

            return result;
        } catch (error) {
            Logger.error(`Erreur lors du scan des headers pour ${url}`, error as Error);
            throw new Error(`Impossible de scanner les headers: ${(error as Error).message}`);
        }
    }

    // Analyser les headers de securite
    private static analyzeSecurityHeaders(rawHeaders: any): {
        headers: { [headerName: string]: HeaderInfo };
        missingHeaders: string[];
        recommendations: string[];
    } {
        const headers: { [headerName: string]: HeaderInfo } = {};
        const missingHeaders: string[] = [];
        const recommendations: string[] = [];

        // Normaliser les headers (lowercase)
        const normalizedHeaders: Record<string, string> = {};
        Object.keys(rawHeaders).forEach((key) => {
            normalizedHeaders[key.toLowerCase()] = String(rawHeaders[key]);
        });

        // Analyser chaque header (sauf les penalites)
        const headersToCheck = Object.keys(HEADER_WEIGHTS).filter(
            (h) => !['Server', 'X-Powered-By'].includes(h)
        );

        headersToCheck.forEach((headerName) => {
            const headerKey = headerName.toLowerCase();
            const value = normalizedHeaders[headerKey];
            const weight = HEADER_WEIGHTS[headerName as keyof typeof HEADER_WEIGHTS];

            if (!value) {
                // ÉTAT 1: MISSING - Header complètement absent
                missingHeaders.push(headerName);
                headers[headerName] = {
                    present: false,
                    secure: false,
                    weight,
                    recommendation: `Ajouter le header ${headerName}`,
                };
                recommendations.push(
                    `${headerName}: Header manquant - Ajouter ce header de securite`
                );
            } else {
                // Header present - analyser la valeur pour déterminer si SECURE ou INSECURE
                const analysis = this.analyzeHeaderValue(headerName, value);

                if (analysis.secure) {
                    // ÉTAT 2: PRESENT_SECURE - Header présent avec configuration sécurisée
                    headers[headerName] = {
                        present: true,
                        value,
                        secure: true,
                        weight,
                        recommendation: analysis.recommendation, // Peut contenir des suggestions d'amélioration
                    };

                    // Ajouter une recommandation uniquement si c'est une suggestion d'amélioration
                    if (analysis.recommendation) {
                        recommendations.push(`${headerName}: ${analysis.recommendation}`);
                    }
                } else {
                    // ÉTAT 3: PRESENT_INSECURE - Header présent mais configuration non sécurisée
                    headers[headerName] = {
                        present: true,
                        value,
                        secure: false,
                        weight,
                        recommendation: analysis.recommendation,
                    };

                    if (analysis.recommendation) {
                        recommendations.push(`${headerName}: ${analysis.recommendation}`);
                    }
                }
            }
        });

        // Analyser les headers de penalite (Server et X-Powered-By)
        ['Server', 'X-Powered-By'].forEach((headerName) => {
            const headerKey = headerName.toLowerCase();
            const value = normalizedHeaders[headerKey];
            const weight = HEADER_WEIGHTS[headerName as keyof typeof HEADER_WEIGHTS];

            if (value) {
                // Header present = PENALITE
                headers[headerName] = {
                    present: true,
                    value,
                    secure: false,
                    weight,
                    recommendation: `Retirer ce header pour eviter la fuite d'informations`,
                };
                recommendations.push(
                    `${headerName}: Fuite d'information - Retirer ce header (penalite de ${Math.abs(
                        weight
                    )} points)`
                );
            } else {
                // Header absent = BON (points gagnes)
                headers[headerName] = {
                    present: false,
                    secure: true,
                    weight: Math.abs(weight),
                    recommendation: undefined,
                };
            }
        });

        return { headers, missingHeaders, recommendations };
    }

    // Analyser la valeur d'un header specifique
    private static analyzeHeaderValue(
        headerName: string,
        value: string
    ): { secure: boolean; recommendation?: string } {
        switch (headerName) {
            case 'Strict-Transport-Security': {
                const maxAgeMatch = value.match(/max-age=(\d+)/);
                const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0;

                if (maxAge < 31536000) {
                    return {
                        secure: false,
                        recommendation: `Augmenter max-age a au moins 31536000 (actuellement ${maxAge})`,
                    };
                }

                if (!value.includes('includeSubDomains')) {
                    return {
                        secure: true,
                        recommendation: "Considerer l'ajout de includeSubDomains",
                    };
                }

                return { secure: true };
            }

            case 'X-Content-Type-Options': {
                if (value.toLowerCase() !== 'nosniff') {
                    return {
                        secure: false,
                        recommendation: 'Utiliser la valeur "nosniff"',
                    };
                }
                return { secure: true };
            }

            case 'X-Frame-Options': {
                const validValues = ['deny', 'sameorigin'];
                if (!validValues.includes(value.toLowerCase())) {
                    return {
                        secure: false,
                        recommendation: 'Utiliser DENY ou SAMEORIGIN',
                    };
                }
                return { secure: true };
            }

            case 'Content-Security-Policy': {
                const issues: string[] = [];
                const lowerValue = value.toLowerCase();

                // Vérification 1: Directives dangereuses
                if (lowerValue.includes('unsafe-inline')) {
                    issues.push('unsafe-inline détecté');
                }
                if (lowerValue.includes('unsafe-eval')) {
                    issues.push('unsafe-eval détecté');
                }

                // Vérification 2: Wildcard permissif sur default-src ou script-src
                const wildcardPatterns = [
                    /default-src[^;]*\*(?!\.)/, // * sans domaine spécifique
                    /script-src[^;]*\*(?!\.)/, // * sur script-src
                    /default-src[^;]*'none'/i, // Trop restrictif (bloque tout)
                ];

                if (wildcardPatterns.some(pattern => pattern.test(value))) {
                    issues.push('Wildcard (*) trop permissif détecté');
                }

                // Vérification 3: Absence de default-src
                if (!lowerValue.includes('default-src')) {
                    issues.push('default-src manquant');
                }

                // Vérification 4: Politique trop courte (probablement incomplète)
                if (value.length < 30) {
                    issues.push('Politique CSP trop courte/incomplète');
                }

                // Décision finale
                if (issues.length > 0) {
                    return {
                        secure: false,
                        recommendation: `CSP non sécurisé: ${issues.join(', ')}`,
                    };
                }

                return { secure: true };
            }

            case 'Referrer-Policy': {
                const strictPolicies = [
                    'no-referrer',
                    'strict-origin',
                    'strict-origin-when-cross-origin',
                    'same-origin',
                ];
                if (!strictPolicies.includes(value.toLowerCase())) {
                    return {
                        secure: false,
                        recommendation: 'Utiliser une politique plus stricte',
                    };
                }
                return { secure: true };
            }

            case 'Permissions-Policy': {
                // Simple presence = bon
                return { secure: true };
            }

            case 'Cross-Origin-Opener-Policy': {
                const validValues = ['same-origin', 'same-origin-allow-popups'];
                if (!validValues.includes(value.toLowerCase())) {
                    return {
                        secure: false,
                        recommendation: 'Utiliser same-origin ou same-origin-allow-popups',
                    };
                }
                return { secure: true };
            }

            case 'Cross-Origin-Embedder-Policy': {
                if (value.toLowerCase() !== 'require-corp') {
                    return {
                        secure: false,
                        recommendation: 'Utiliser require-corp',
                    };
                }
                return { secure: true };
            }

            case 'Cross-Origin-Resource-Policy': {
                const validValues = ['same-origin', 'same-site', 'cross-origin'];
                if (!validValues.includes(value.toLowerCase())) {
                    return {
                        secure: false,
                        recommendation: 'Utiliser same-origin, same-site ou cross-origin',
                    };
                }
                return { secure: true };
            }

            case 'Set-Cookie': {
                // Analyser les attributs Secure, HttpOnly, SameSite de manière progressive
                const hasSecure = value.includes('Secure');
                const hasHttpOnly = value.includes('HttpOnly');
                const sameSiteMatch = value.match(/SameSite=(Strict|Lax|None)/i);
                const sameSiteValue = sameSiteMatch ? sameSiteMatch[1].toLowerCase() : null;

                const issues: string[] = [];
                let securityScore = 0;

                // Scoring progressif: 3 attributs = 100%
                if (hasSecure) securityScore++;
                else issues.push('Secure manquant');

                if (hasHttpOnly) securityScore++;
                else issues.push('HttpOnly manquant');

                if (sameSiteValue) {
                    securityScore++;
                    // Bonus: SameSite=Strict est le plus sécurisé
                    if (sameSiteValue === 'lax') {
                        issues.push('SameSite=Lax (considérer Strict pour plus de sécurité)');
                    } else if (sameSiteValue === 'none') {
                        issues.push('SameSite=None (le moins sécurisé, éviter si possible)');
                    }
                } else {
                    issues.push('SameSite manquant');
                }

                // Critère de sécurité: au moins 2/3 attributs présents
                if (securityScore >= 2) {
                    return {
                        secure: true,
                        recommendation: issues.length > 0 ? `Amélioration possible: ${issues.join(', ')}` : undefined,
                    };
                } else {
                    return {
                        secure: false,
                        recommendation: `Cookie non sécurisé: ${issues.join(', ')}`,
                    };
                }
            }

            default:
                return { secure: false };
        }
    }

    // Calculer le score total (sur 64 points bruts) avec détails pour transparence
    private static calculateScoreWithDetails(headers: { [headerName: string]: HeaderInfo }): {
        rawScore: number;
        scoreDetails: ScoreDetail[]
    } {
        let totalScore = 0;
        const scoreDetails: ScoreDetail[] = [];

        Object.entries(headers).forEach(([headerName, headerInfo]) => {
            const maxPoints = Math.abs(headerInfo.weight);
            let pointsEarned = 0;
            let status: 'MISSING' | 'PRESENT_SECURE' | 'PRESENT_INSECURE' | 'PENALTY';
            let explanation = '';

            // Cas special: Server et X-Powered-By (penalites)
            if (headerName === 'Server' || headerName === 'X-Powered-By') {
                if (headerInfo.present) {
                    // Header present = penalite (weight est negatif)
                    pointsEarned = headerInfo.weight; // Valeur négative
                    totalScore += headerInfo.weight;
                    status = 'PENALTY';
                    explanation = `Header présent → Pénalité de ${Math.abs(headerInfo.weight)} points (fuite d'information)`;
                } else {
                    // Header absent = points gagnes (on prend la valeur absolue)
                    pointsEarned = Math.abs(headerInfo.weight);
                    totalScore += Math.abs(headerInfo.weight);
                    status = 'PRESENT_SECURE';
                    explanation = `Header absent → +${Math.abs(headerInfo.weight)} points (bonne pratique)`;
                }
            } else {
                // Headers normaux
                if (!headerInfo.present) {
                    // Header manquant
                    pointsEarned = 0;
                    status = 'MISSING';
                    explanation = `Header manquant → 0/${maxPoints} points`;
                } else if (headerInfo.secure) {
                    // Header présent et sécurisé
                    pointsEarned = headerInfo.weight;
                    totalScore += headerInfo.weight;
                    status = 'PRESENT_SECURE';
                    explanation = `Header sécurisé → +${maxPoints} points`;
                } else {
                    // Header présent mais non sécurisé (points partiels)
                    pointsEarned = headerInfo.weight * 0.5;
                    totalScore += headerInfo.weight * 0.5;
                    status = 'PRESENT_INSECURE';
                    explanation = `Header présent mais non sécurisé → +${pointsEarned}/${maxPoints} points (50%)`;
                }
            }

            scoreDetails.push({
                headerName,
                status,
                pointsEarned,
                maxPoints,
                explanation,
            });
        });

        return {
            rawScore: Math.max(0, totalScore), // Ne jamais descendre en dessous de 0
            scoreDetails
        };
    }
}
