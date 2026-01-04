// Routes pour le module SSL/TLS
import { Router } from 'express';
import { SslController } from './ssl.controller';
import { scanLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

/**
 * POST /api/scan/ssl
 * Scanner les configurations SSL/TLS d'une URL
 * Rate limit: 10 requêtes par 15 minutes
 */
router.post('/', scanLimiter, SslController.scanSsl);

export default router;
