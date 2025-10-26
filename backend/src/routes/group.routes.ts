import { Router } from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  getAllGroups,
  joinGroup,
  leaveGroup
} from '../controllers/group.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All group routes require authentication
router.use(authenticate);

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/all', getAllGroups);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
