// Point d'entree du serveur Express
import app from './app';
import { env, isDevelopment } from './config/env.config';
import { Logger } from './services/logger.service';
import { testDatabaseConnection } from './config/database.config';

// Port du serveur
const PORT = env.PORT;

// Fonction de demarrage du serveur
async function startServer() {
    try {
        // TODO: Activer la verification Supabase une fois les cles configurees
        // Tester la connexion a la base de donnees
        // Logger.info('Verification de la connexion a Supabase...');
        // await testDatabaseConnection();
        // Logger.info('Connexion a Supabase etablie avec succes');

        Logger.warn('Mode test: Connexion Supabase desactivee temporairement');

        // Demarrer le serveur
        app.listen(PORT, () => {
            Logger.info(`Serveur Vulnex demarre sur le port ${PORT}`);
            Logger.info(`Environnement: ${isDevelopment() ? 'development' : 'production'}`);
            Logger.info(`URL: http://localhost:${PORT}`);
            Logger.info(`Health check: http://localhost:${PORT}/health`);

            if (isDevelopment()) {
                Logger.info('Mode developpement active - Logs detailles actives');
            }
        });
    } catch (error) {
        Logger.error('Erreur lors du demarrage du serveur', error as Error);
        process.exit(1);
    }
}

// Gestion des erreurs non gerees
process.on('unhandledRejection', (reason: any) => {
    Logger.error('Unhandled Rejection:', new Error(reason));
    process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
    Logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Gestion de l'arret gracieux
process.on('SIGTERM', () => {
    Logger.info('Signal SIGTERM recu, arret du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    Logger.info('Signal SIGINT recu, arret du serveur...');
    process.exit(0);
});

// Demarrer le serveur
startServer();
