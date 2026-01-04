// Routes pour le module de scan des headers HTTP
import { Router } from 'express';
import { HeadersController } from './headers.controller';
import { validateBody } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../middleware/error.middleware';
import { startScanSchema } from '../../schemas/scan.schema';
import { scanLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

// POST /api/scan/headers - Scanner les headers d'une URL
router.post(
    '/',
    scanLimiter,
    validateBody(startScanSchema),
    asyncHandler(HeadersController.scanHeaders)
);

// GET /api/scan/headers/check - Verification rapide
router.get('/check', asyncHandler(HeadersController.quickCheck));

export default router;
