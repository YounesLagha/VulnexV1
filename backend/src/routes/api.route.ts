// /backend/src/routes/api.route.ts
import { Router } from 'express';
// import scanRouter from '../modules/scan/scan.route'; // À créer pour orchestrer le scan

const router = Router();

/**
 * Routes principales de l'API v1
 * /api/v1/scan
 * /api/v1/auth
 */
// router.use('/scan', scanRouter); // Tous les endpoints de scan seront ici

// Health Check
router.get('/health', (req, res) => res.status(200).json({ status: 'UP', service: 'Vulnex API' }));

export default router;