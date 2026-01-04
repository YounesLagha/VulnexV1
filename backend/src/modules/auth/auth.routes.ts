// Routes pour l'authentification
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';
import { authLimiter, generalLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

// Routes publiques (avec rate limiting strict pour éviter le brute force)
router.post('/register', authLimiter, asyncHandler(AuthController.register));
router.post('/login', authLimiter, asyncHandler(AuthController.login));
router.post('/refresh', generalLimiter, asyncHandler(AuthController.refreshToken));

// Routes protegees (authentification requise)
router.post('/logout', authenticate, asyncHandler(AuthController.logout));
router.get('/profile', authenticate, asyncHandler(AuthController.getProfile));

export { router as authRoutes };
