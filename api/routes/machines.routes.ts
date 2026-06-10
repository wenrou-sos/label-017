import { Router } from 'express';
import machineController from '../controllers/machine.controller';
import { authenticate, requirePlannerOrAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, machineController.findAll);
router.get('/:id', authenticate, machineController.findById);
router.post('/', authenticate, requirePlannerOrAdmin, machineController.create);
router.put('/:id', authenticate, requirePlannerOrAdmin, machineController.update);
router.delete('/:id', authenticate, requirePlannerOrAdmin, machineController.delete);
router.patch('/:id/status', authenticate, requirePlannerOrAdmin, machineController.updateStatus);

export default router;
