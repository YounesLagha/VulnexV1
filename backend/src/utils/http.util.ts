// Utilitaires pour les requ�tes HTTP
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { TIMEOUTS } from '../config/constants';
import { Logger } from '../services/logger.service';

// Configuration par d�faut pour axios
const defaultConfig: AxiosRequestConfig = {
    timeout: TIMEOUTS.HTTP_REQUEST,
    headers: {
        'User-Agent': 'Vulnex-Security-Scanner/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    maxRedirects: 5,
    validateStatus: (status) => status < 500, // Accepter les codes 4xx
};

// Classe pour g�rer les requ�tes HTTP
export class HttpClient {
    // Faire une requ�te GET
    static async get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        try {
            Logger.debug(`HTTP GET: ${url}`);

            const response = await axios.get(url, {
                ...defaultConfig,
                ...config,
            });

            Logger.debug(`HTTP GET ${url} - Status: ${response.status}`);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, 'GET', url);
        }
    }

    // Faire une requ�te HEAD (pour r�cup�rer seulement les headers)
    static async head(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        try {
            Logger.debug(`HTTP HEAD: ${url}`);

            const response = await axios.head(url, {
                ...defaultConfig,
                ...config,
            });

            Logger.debug(`HTTP HEAD ${url} - Status: ${response.status}`);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, 'HEAD', url);
        }
    }

    // Faire une requ�te POST
    static async post(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse> {
        try {
            Logger.debug(`HTTP POST: ${url}`);

            const response = await axios.post(url, data, {
                ...defaultConfig,
                ...config,
            });

            Logger.debug(`HTTP POST ${url} - Status: ${response.status}`);
            return response;
        } catch (error) {
            return this.handleError(error as AxiosError, 'POST', url);
        }
    }

    // Requ�te avec retry automatique
    static async getWithRetry(
        url: string,
        maxRetries: number = 3,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse> {
        let lastError: any;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Logger.debug(`HTTP GET tentative ${attempt}/${maxRetries}: ${url}`);
                return await this.get(url, config);
            } catch (error) {
                lastError = error;
                Logger.warn(`Tentative ${attempt} �chou�e pour ${url}`, {
                    error: (error as Error).message,
                });

                // Attendre avant de r�essayer (backoff exponentiel)
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    }

    // Fonction helper pour g�rer les erreurs
    private static handleError(error: AxiosError, method: string, url: string): never {
        if (error.response) {
            // Le serveur a r�pondu avec un code d'erreur
            Logger.error(`HTTP ${method} ${url} - Erreur ${error.response.status}`, error);
            throw new Error(
                `Requ�te ${method} �chou�e pour ${url}: ${error.response.status} ${error.response.statusText}`
            );
        } else if (error.request) {
            // La requ�te a �t� envoy�e mais pas de r�ponse
            Logger.error(`HTTP ${method} ${url} - Pas de r�ponse`, error);
            throw new Error(`Pas de r�ponse du serveur pour ${url}`);
        } else {
            // Erreur lors de la configuration de la requ�te
            Logger.error(`HTTP ${method} ${url} - Erreur de configuration`, error);
            throw new Error(`Erreur lors de la requ�te vers ${url}: ${error.message}`);
        }
    }

    // Helper pour attendre (delay)
    private static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // V�rifier si une URL est accessible
    static async isAccessible(url: string): Promise<boolean> {
        try {
            const response = await this.head(url, {
                timeout: 5000, // Timeout court pour la v�rification
            });
            return response.status >= 200 && response.status < 400;
        } catch {
            return false;
        }
    }

    // R�cup�rer les headers d'une URL
    static async getHeaders(url: string): Promise<Record<string, string>> {
        try {
            const response = await this.head(url);
            return response.headers as Record<string, string>;
        } catch (error) {
            Logger.error(`Impossible de r�cup�rer les headers pour ${url}`, error as Error);
            throw error;
        }
    }

    // Suivre les redirections et retourner l'URL finale
    static async getFinalUrl(url: string): Promise<string> {
        try {
            const response = await this.get(url, {
                maxRedirects: 10,
            });
            return response.request.res.responseUrl || url;
        } catch (error) {
            Logger.error(`Erreur lors du suivi des redirections pour ${url}`, error as Error);
            return url;
        }
    }

    /**
     * HTTPS PRIORITY LOGIC
     * Si l'URL fournie commence par http://, tente automatiquement https://
     * Si HTTPS répond → utilise HTTPS
     * Sinon → garde HTTP
     *
     * @param url - URL originale fournie par l'utilisateur
     * @returns URL optimale (HTTPS si disponible, sinon HTTP)
     */
    static async getOptimalUrl(url: string): Promise<{ url: string; upgraded: boolean; reason: string }> {
        const parsedUrl = new URL(url);

        // Si déjà en HTTPS, pas besoin de tester
        if (parsedUrl.protocol === 'https:') {
            Logger.info(`URL déjà en HTTPS: ${url}`);
            return { url, upgraded: false, reason: 'Already HTTPS' };
        }

        // Tester si HTTPS est disponible
        const httpsUrl = url.replace(/^http:\/\//i, 'https://');
        Logger.info(`Test de disponibilité HTTPS pour: ${httpsUrl}`);

        try {
            const response = await this.head(httpsUrl, {
                timeout: 5000, // Timeout court pour le test
                maxRedirects: 5,
            });

            // Si HTTPS répond avec un code 2xx ou 3xx
            if (response.status >= 200 && response.status < 400) {
                Logger.info(`HTTPS disponible et fonctionnel pour ${parsedUrl.hostname} - Upgrade effectué`);
                return {
                    url: httpsUrl,
                    upgraded: true,
                    reason: `HTTPS available (status ${response.status})`
                };
            } else {
                Logger.warn(`HTTPS répond mais avec erreur ${response.status} - Conservation de HTTP`);
                return {
                    url,
                    upgraded: false,
                    reason: `HTTPS responded with ${response.status}`
                };
            }
        } catch (error) {
            Logger.warn(`HTTPS non disponible pour ${parsedUrl.hostname} - Conservation de HTTP`, {
                error: (error as Error).message,
            });
            return {
                url,
                upgraded: false,
                reason: `HTTPS unavailable: ${(error as Error).message}`
            };
        }
    }
}

// Export par d�faut
export default HttpClient;
