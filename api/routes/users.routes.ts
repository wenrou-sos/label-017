import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, userController.findAll);
router.get('/:id', authenticate, userController.findById);
router.post('/', authenticate, requireAdmin, userController.create);
router.put('/:id', authenticate, requireAdmin, userController.update);
router.delete('/:id', authenticate, requireAdmin, userController.delete);
router.patch('/:id/status', authenticate, requireAdmin, userController.updateStatus);
router.patch('/:id/reset-password', authenticate, requireAdmin, userController.resetPassword);

export default router;
