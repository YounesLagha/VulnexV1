// Routes pour le module d'analyse IA
import { Router } from 'express';
import { AIController } from './ai.controller';
import { asyncHandler } from '../../middleware/error.middleware';
import { optionalAuth } from '../../middleware/auth.middleware';
import { generalLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

// POST /api/ai/analyze - Analyser un scan avec l'IA
// Authentification optionnelle : si connecté -> mode full possible, sinon -> mode free uniquement
router.post(
    '/analyze',
    generalLimiter,
    optionalAuth, // Authentification optionnelle
    asyncHandler(AIController.analyzeScan)
);

// GET /api/ai/status - Vérifier la disponibilité de l'IA
router.get('/status', asyncHandler(AIController.checkStatus));

export default router;
