// Configuration principale de l'application Express
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { corsConfig } from './config/cors.config';
import {
    errorHandler,
    notFoundHandler,
    requestLogger,
    validateContentType,
} from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimit.middleware';
import { Logger } from './services/logger.service';

// Import des routes
import { headersRoutes } from './modules/headers';
import { sslRoutes } from './modules/ssl';
import { aiRoutes } from './modules/ai';
import { authRoutes } from './modules/auth';
import { scansRoutes } from './modules/scans';

// Creer l'application Express
const app = express();

// --- Securite et middlewares de base ---

// 1. Helmet pour les headers de securite HTTP
app.use(helmet());

// 2. CORS - permettre les requetes depuis le frontend
app.use(cors(corsConfig));

// 3. Logger toutes les requetes
app.use(requestLogger);

// 4. Parser le body JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Valider le Content-Type pour POST/PUT/PATCH
app.use(validateContentType);

// 6. Rate limiting general
app.use(generalLimiter);

// --- Routes ---

// Route de base pour verifier que l'API fonctionne
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Vulnex API - Serveur de scan de securite',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            headers: '/api/scan/headers',
            ssl: '/api/scan/ssl',
            ai: '/api/ai/analyze',
            scans: '/api/scans',
        },
    });
});

// Route de health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes des modules de scan
app.use('/api/scan/headers', headersRoutes);
app.use('/api/scan/ssl', sslRoutes);

// Routes du module IA
app.use('/api/ai', aiRoutes);

// Routes de gestion des scans
app.use('/api/scans', scansRoutes);

// --- Gestion des erreurs ---

// 404 - Route non trouvee
app.use(notFoundHandler);

// Gestionnaire d'erreurs global
app.use(errorHandler);

// Log du demarrage de l'app
Logger.info('Application Express configuree avec succes');

export default app;
