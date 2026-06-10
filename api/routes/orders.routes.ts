import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { authenticate, requirePlannerOrAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, orderController.findAll);
router.get('/:id', authenticate, orderController.findById);
router.post('/', authenticate, requirePlannerOrAdmin, orderController.create);
router.put('/:id', authenticate, requirePlannerOrAdmin, orderController.update);
router.delete('/:id', authenticate, requirePlannerOrAdmin, orderController.delete);
router.patch('/:id/status', authenticate, requirePlannerOrAdmin, orderController.updateStatus);

export default router;
