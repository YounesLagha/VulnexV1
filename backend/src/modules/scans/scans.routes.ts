// Routes pour la gestion des scans
import { Router } from 'express';
import { ScansController } from './scans.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';
import { generalLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

// Toutes les routes necessitent une authentification
router.use(authenticate);

// GET /api/scans - Liste des scans de l'utilisateur
router.get('/', generalLimiter, asyncHandler(ScansController.getScans));

// GET /api/scans/stats/me - Statistiques de l'utilisateur
router.get('/stats/me', generalLimiter, asyncHandler(ScansController.getUserStats));

// GET /api/scans/recent - Derniers scans de l'utilisateur
router.get('/recent', generalLimiter, asyncHandler(ScansController.getRecentScans));

// GET /api/scans/:id - Recuperer un scan specifique
router.get('/:id', generalLimiter, asyncHandler(ScansController.getScanById));

// DELETE /api/scans/:id - Supprimer un scan
router.delete('/:id', generalLimiter, asyncHandler(ScansController.deleteScan));

export { router as scansRoutes };
