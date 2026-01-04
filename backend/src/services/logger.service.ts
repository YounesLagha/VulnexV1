// Service de logging avec Winston
import winston from 'winston';
import { env, isDevelopment } from '../config/env.config';

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Format pour l'affichage en console (développement)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaString = '';
        if (Object.keys(meta).length > 0) {
            metaString = `\n${JSON.stringify(meta, null, 2)}`;
        }
        return `[${timestamp}] ${level}: ${message}${metaString}`;
    })
);

// Configuration des transports (où envoyer les logs)
const transports: winston.transport[] = [
    // Console (toujours actif)
    new winston.transports.Console({
        format: isDevelopment() ? consoleFormat : customFormat,
    }),
];

// En production, ajouter des fichiers de logs
if (!isDevelopment()) {
    // Logs d'erreurs
    transports.push(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );

    // Tous les logs combinés
    transports.push(
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
}

// Création du logger Winston
const logger = winston.createLogger({
    level: env.LOG_LEVEL || 'info',
    format: customFormat,
    transports,
    // Ne pas quitter sur une erreur non gérée
    exitOnError: false,
});

// Interface pour typer les métadonnées
interface LogMetadata {
    [key: string]: any;
}

// Wrapper autour de Winston pour une meilleure expérience développeur
export class Logger {
    // Log d'information
    static info(message: string, meta?: LogMetadata): void {
        logger.info(message, meta);
    }

    // Log d'avertissement
    static warn(message: string, meta?: LogMetadata): void {
        logger.warn(message, meta);
    }

    // Log d'erreur
    static error(message: string, error?: Error | LogMetadata, meta?: LogMetadata): void {
        if (error instanceof Error) {
            logger.error(message, {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
                ...meta,
            });
        } else {
            logger.error(message, error);
        }
    }

    // Log de debug (seulement en développement)
    static debug(message: string, meta?: LogMetadata): void {
        logger.debug(message, meta);
    }

    // Log HTTP (pour les requêtes)
    static http(message: string, meta?: LogMetadata): void {
        logger.http(message, meta);
    }

    // Log pour le démarrage de l'application
    static startup(message: string): void {
        logger.info(`=€ ${message}`);
    }

    // Log pour les scans
    static scan(message: string, meta?: LogMetadata): void {
        logger.info(`= [SCAN] ${message}`, meta);
    }

    // Log pour la base de données
    static database(message: string, meta?: LogMetadata): void {
        logger.info(`=¾ [DATABASE] ${message}`, meta);
    }

    // Log pour la sécurité
    static security(message: string, meta?: LogMetadata): void {
        logger.warn(`= [SECURITY] ${message}`, meta);
    }
}

// Export du logger Winston brut si besoin
export default logger;
