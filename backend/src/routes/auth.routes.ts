import { Router } from 'express';
import { register, login, getProfile, requestPasswordReset, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-request', requestPasswordReset);
router.post('/reset', resetPassword);
router.get('/profile', authenticate, getProfile);

export default router;
