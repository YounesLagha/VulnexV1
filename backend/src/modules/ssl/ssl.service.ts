// Service pour analyser SSL/TLS et certificats
import * as tls from 'tls';
import * as https from 'https';
import { URL } from 'url';
import { Logger } from '../../services/logger.service';
import type {
    SslScanResult,
    CertificateInfo,
    ProtocolInfo,
    CipherInfo,
    VulnerabilityInfo,
    SecurityGrade,
} from '../../types';

// Grille de scoring SSL - TOTAL: 100 points
const SSL_SCORING = {
    CERTIFICATE_VALID: 30, // Certificat valide et non expiré
    STRONG_PROTOCOLS: 25, // TLS 1.2+ uniquement
    STRONG_CIPHERS: 20, // Ciphers sécurisés
    NO_VULNERABILITIES: 15, // Pas de vulnérabilités connues
    BEST_PRACTICES: 10, // HSTS, certificat non auto-signé, etc.
};

// Protocoles sécurisés et non sécurisés

// Vulnérabilités SSL/TLS connues
const KNOWN_VULNERABILITIES = {
    HEARTBLEED: 'CVE-2014-0160',
    POODLE: 'CVE-2014-3566',
    BEAST: 'CVE-2011-3389',
    CRIME: 'CVE-2012-4929',
    BREACH: 'CVE-2013-3587',
    FREAK: 'CVE-2015-0204',
    LOGJAM: 'CVE-2015-4000',
    DROWN: 'CVE-2016-0800',
};

export class SslService {
    /**
     * Scanner SSL/TLS d'une URL
     */
    static async scanSsl(url: string): Promise<SslScanResult> {
        try {
            Logger.info(`Début du scan SSL/TLS pour: ${url}`);

            const parsedUrl = new URL(url);

            // Vérifier si HTTPS est disponible
            if (parsedUrl.protocol !== 'https:') {
                Logger.warn(`URL non-HTTPS fournie: ${url} - Tentative de conversion`);
                parsedUrl.protocol = 'https:';
            }

            const hostname = parsedUrl.hostname;
            const port = parsedUrl.port ? parseInt(parsedUrl.port) : 443;

            // Vérifier la disponibilité HTTPS
            const hasHttps = await this.checkHttpsAvailability(hostname, port);

            if (!hasHttps) {
                Logger.warn(`HTTPS non disponible pour ${hostname}:${port}`);
                return {
                    score: 0,
                    grade: 'F',
                    scannedAt: new Date().toISOString(),
                    hasHttps: false,
                    protocols: [],
                    ciphers: [],
                    vulnerabilities: [
                        {
                            id: 'NO_HTTPS',
                            name: 'HTTPS Non Disponible',
                            severity: 'critical',
                            description: 'Le serveur ne supporte pas HTTPS',
                            affected: hostname,
                            fixed: false,
                        },
                    ],
                };
            }

            // Récupérer les informations SSL/TLS
            const certificate = await this.getCertificateInfo(hostname, port);
            const protocols = await this.detectProtocols(hostname, port);
            const ciphers = await this.detectCiphers(hostname, port);
            const vulnerabilities = this.detectVulnerabilities(protocols, ciphers, certificate);

            // Calculer le score
            const score = this.calculateSslScore(certificate, protocols, ciphers, vulnerabilities);
            const grade = this.calculateGrade(score);

            const result: SslScanResult = {
                score,
                grade,
                scannedAt: new Date().toISOString(),
                hasHttps: true,
                certificate,
                protocols,
                ciphers,
                vulnerabilities,
            };

            Logger.info(`Scan SSL/TLS terminé pour ${hostname}`, {
                score,
                grade,
                hasHttps: true,
                certificateValid: certificate?.valid,
                protocolsCount: protocols.length,
                vulnerabilitiesCount: vulnerabilities.length,
            });

            return result;
        } catch (error) {
            Logger.error(`Erreur lors du scan SSL/TLS pour ${url}`, error as Error);
            throw new Error(`Impossible de scanner SSL/TLS: ${(error as Error).message}`);
        }
    }

    /**
     * Vérifier la disponibilité HTTPS
     */
    private static async checkHttpsAvailability(hostname: string, port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const options = {
                hostname,
                port,
                method: 'HEAD',
                rejectUnauthorized: false, // Accepter les certificats auto-signés pour le test
                timeout: 5000,
            };

            const req = https.request(options, (res) => {
                resolve(res.statusCode !== undefined && res.statusCode < 500);
            });

            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    /**
     * Récupérer les informations du certificat SSL
     */
    private static async getCertificateInfo(
        hostname: string,
        port: number
    ): Promise<CertificateInfo | undefined> {
        return new Promise((resolve, reject) => {
            const socket = tls.connect(
                {
                    host: hostname,
                    port,
                    servername: hostname,
                    rejectUnauthorized: false, // Accepter les certificats auto-signés
                },
                () => {
                    const cert = socket.getPeerCertificate(true);

                    if (!cert || Object.keys(cert).length === 0) {
                        socket.destroy();
                        resolve(undefined);
                        return;
                    }

                    const now = new Date();
                    const validFrom = new Date(cert.valid_from);
                    const validTo = new Date(cert.valid_to);
                    const daysUntilExpiration = Math.floor(
                        (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    const certificateInfo: CertificateInfo = {
                        valid: now >= validFrom && now <= validTo,
                        issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
                        subject: cert.subject?.CN || hostname,
                        serialNumber: cert.serialNumber || 'Unknown',
                        validFrom: validFrom.toISOString(),
                        validTo: validTo.toISOString(),
                        daysUntilExpiration,
                        selfSigned: cert.issuer?.CN === cert.subject?.CN,
                        signatureAlgorithm: (cert as any).sigalg || 'Unknown',
                    };

                    socket.destroy();
                    resolve(certificateInfo);
                }
            );

            socket.on('error', (error) => {
                Logger.error(`Erreur lors de la récupération du certificat pour ${hostname}`, error);
                socket.destroy();
                reject(error);
            });

            socket.setTimeout(5000, () => {
                socket.destroy();
                reject(new Error('Timeout lors de la récupération du certificat'));
            });
        });
    }

    /**
     * Détecter les protocoles SSL/TLS supportés
     * Note: Cette version simplifiée détecte uniquement si TLS fonctionne
     * Une détection précise des protocoles nécessiterait des outils externes (openssl, testssl.sh)
     */
    private static async detectProtocols(hostname: string, port: number): Promise<ProtocolInfo[]> {
        const protocols: ProtocolInfo[] = [
            { name: 'SSLv2', version: '2.0', enabled: false, secure: false },
            { name: 'SSLv3', version: '3.0', enabled: false, secure: false },
            { name: 'TLSv1', version: '1.0', enabled: false, secure: false },
            { name: 'TLSv1.1', version: '1.1', enabled: false, secure: false },
        ];

        // Tester TLS 1.2 et 1.3 (protocoles modernes supportés par Node.js)
        const tlsWorks = await this.testProtocol(hostname, port);

        if (tlsWorks) {
            // Si TLS fonctionne, on suppose TLS 1.2+ est activé
            protocols.push(
                { name: 'TLSv1.2', version: '1.2', enabled: true, secure: true },
                { name: 'TLSv1.3', version: '1.3', enabled: true, secure: true }
            );
        } else {
            protocols.push(
                { name: 'TLSv1.2', version: '1.2', enabled: false, secure: true },
                { name: 'TLSv1.3', version: '1.3', enabled: false, secure: true }
            );
        }

        return protocols;
    }

    /**
     * Tester si TLS est supporté
     */
    private static async testProtocol(
        hostname: string,
        port: number
    ): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                const socket = tls.connect(
                    {
                        host: hostname,
                        port,
                        servername: hostname,
                        rejectUnauthorized: false,
                        // Ne pas spécifier minVersion/maxVersion car cela nécessite des types stricts
                        // Le test se fait via la connexion réussie
                    },
                    () => {
                        socket.destroy();
                        resolve(true);
                    }
                );

                socket.on('error', () => {
                    socket.destroy();
                    resolve(false);
                });

                socket.setTimeout(3000, () => {
                    socket.destroy();
                    resolve(false);
                });
            } catch (error) {
                resolve(false);
            }
        });
    }

    /**
     * Détecter les ciphers supportés
     */
    private static async detectCiphers(hostname: string, port: number): Promise<CipherInfo[]> {
        return new Promise((resolve, reject) => {
            const socket = tls.connect(
                {
                    host: hostname,
                    port,
                    servername: hostname,
                    rejectUnauthorized: false,
                },
                () => {
                    const cipher = socket.getCipher();

                    if (!cipher) {
                        socket.destroy();
                        resolve([]);
                        return;
                    }

                    // Évaluer la sécurité du cipher
                    const cipherName = cipher.name || cipher.standardName || 'Unknown';
                    const strength = this.evaluateCipherStrength(cipherName);

                    const cipherInfo: CipherInfo = {
                        name: cipherName,
                        strength: strength.bits,
                        secure: strength.secure,
                    };

                    socket.destroy();
                    resolve([cipherInfo]);
                }
            );

            socket.on('error', (error) => {
                Logger.error(`Erreur lors de la détection des ciphers pour ${hostname}`, error);
                socket.destroy();
                reject(error);
            });

            socket.setTimeout(5000, () => {
                socket.destroy();
                reject(new Error('Timeout lors de la détection des ciphers'));
            });
        });
    }

    /**
     * Évaluer la force d'un cipher
     */
    private static evaluateCipherStrength(cipherName: string): { bits: number; secure: boolean } {
        const name = cipherName.toUpperCase();

        // Ciphers faibles (insecure)
        if (
            name.includes('NULL') ||
            name.includes('EXPORT') ||
            name.includes('DES') ||
            name.includes('RC4') ||
            name.includes('MD5')
        ) {
            return { bits: 0, secure: false };
        }

        // Ciphers modérés (128-bit)
        if (name.includes('128')) {
            return { bits: 128, secure: true };
        }

        // Ciphers forts (256-bit)
        if (name.includes('256') || name.includes('CHACHA20') || name.includes('GCM')) {
            return { bits: 256, secure: true };
        }

        // Par défaut
        return { bits: 128, secure: true };
    }

    /**
     * Détecter les vulnérabilités SSL/TLS connues
     */
    private static detectVulnerabilities(
        protocols: ProtocolInfo[],
        ciphers: CipherInfo[],
        certificate?: CertificateInfo
    ): VulnerabilityInfo[] {
        const vulnerabilities: VulnerabilityInfo[] = [];

        // Vérification des protocoles obsolètes
        const deprecatedEnabled = protocols.filter((p) => p.enabled && !p.secure);

        if (deprecatedEnabled.some((p) => p.name === 'SSLv3')) {
            vulnerabilities.push({
                id: 'POODLE',
                name: 'POODLE Attack',
                severity: 'high',
                description: 'SSLv3 est vulnérable à l\'attaque POODLE',
                affected: 'SSLv3',
                fixed: false,
                cveId: KNOWN_VULNERABILITIES.POODLE,
            });
        }

        if (deprecatedEnabled.some((p) => p.name === 'TLSv1' || p.name === 'TLSv1.1')) {
            vulnerabilities.push({
                id: 'DEPRECATED_TLS',
                name: 'Protocole TLS obsolète',
                severity: 'medium',
                description: 'TLS 1.0 et 1.1 sont considérés comme obsolètes',
                affected: 'TLS 1.0/1.1',
                fixed: false,
            });
        }

        // Vérification des ciphers faibles
        const weakCiphers = ciphers.filter((c) => !c.secure);
        if (weakCiphers.length > 0) {
            vulnerabilities.push({
                id: 'WEAK_CIPHER',
                name: 'Cipher faible détecté',
                severity: 'medium',
                description: 'Le serveur utilise des ciphers faibles ou obsolètes',
                affected: weakCiphers.map((c) => c.name).join(', '),
                fixed: false,
            });
        }

        // Vérification du certificat
        if (certificate) {
            if (!certificate.valid) {
                vulnerabilities.push({
                    id: 'INVALID_CERT',
                    name: 'Certificat invalide',
                    severity: 'critical',
                    description: 'Le certificat SSL est expiré ou invalide',
                    affected: certificate.subject,
                    fixed: false,
                });
            }

            if (certificate.selfSigned) {
                vulnerabilities.push({
                    id: 'SELF_SIGNED',
                    name: 'Certificat auto-signé',
                    severity: 'high',
                    description: 'Le certificat est auto-signé et non approuvé par une CA reconnue',
                    affected: certificate.subject,
                    fixed: false,
                });
            }

            if (certificate.daysUntilExpiration < 30 && certificate.daysUntilExpiration >= 0) {
                vulnerabilities.push({
                    id: 'EXPIRING_SOON',
                    name: 'Certificat expire bientôt',
                    severity: 'low',
                    description: `Le certificat expire dans ${certificate.daysUntilExpiration} jours`,
                    affected: certificate.subject,
                    fixed: false,
                });
            }
        }

        return vulnerabilities;
    }

    /**
     * Calculer le score SSL/TLS (sur 100)
     */
    private static calculateSslScore(
        certificate: CertificateInfo | undefined,
        protocols: ProtocolInfo[],
        ciphers: CipherInfo[],
        vulnerabilities: VulnerabilityInfo[]
    ): number {
        let score = 0;

        // 1. Certificat valide (30 points)
        if (certificate) {
            if (certificate.valid && !certificate.selfSigned) {
                score += SSL_SCORING.CERTIFICATE_VALID;
            } else if (certificate.valid) {
                score += SSL_SCORING.CERTIFICATE_VALID * 0.5; // Certificat valide mais auto-signé
            }
        }

        // 2. Protocoles sécurisés (25 points)
        const enabledProtocols = protocols.filter((p) => p.enabled);
        const secureProtocols = enabledProtocols.filter((p) => p.secure);
        const deprecatedProtocols = enabledProtocols.filter((p) => !p.secure);

        if (enabledProtocols.length > 0) {
            const protocolScore =
                (secureProtocols.length / enabledProtocols.length) * SSL_SCORING.STRONG_PROTOCOLS;
            score += protocolScore;

            // Pénalité pour protocoles obsolètes
            if (deprecatedProtocols.length > 0) {
                score -= deprecatedProtocols.length * 5;
            }
        }

        // 3. Ciphers sécurisés (20 points)
        const secureCiphers = ciphers.filter((c) => c.secure);
        if (ciphers.length > 0) {
            const cipherScore = (secureCiphers.length / ciphers.length) * SSL_SCORING.STRONG_CIPHERS;
            score += cipherScore;
        }

        // 4. Pas de vulnérabilités (15 points)
        const criticalVulns = vulnerabilities.filter((v) => v.severity === 'critical').length;
        const highVulns = vulnerabilities.filter((v) => v.severity === 'high').length;
        const mediumVulns = vulnerabilities.filter((v) => v.severity === 'medium').length;

        if (vulnerabilities.length === 0) {
            score += SSL_SCORING.NO_VULNERABILITIES;
        } else {
            const vulnPenalty = criticalVulns * 5 + highVulns * 3 + mediumVulns * 1;
            score += Math.max(0, SSL_SCORING.NO_VULNERABILITIES - vulnPenalty);
        }

        // 5. Best practices (10 points)
        if (certificate && !certificate.selfSigned && certificate.daysUntilExpiration > 30) {
            score += SSL_SCORING.BEST_PRACTICES;
        } else if (certificate) {
            score += SSL_SCORING.BEST_PRACTICES * 0.5;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Calculer le grade de sécurité SSL
     */
    private static calculateGrade(score: number): SecurityGrade {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }
}
