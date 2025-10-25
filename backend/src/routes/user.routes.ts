import { Router } from 'express';
import { getUsers, getUserById, updateUser } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/', authorize('ADMIN'), getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);

export default router;
