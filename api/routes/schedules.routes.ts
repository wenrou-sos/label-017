import { Router } from 'express';
import scheduleController from '../controllers/schedule.controller';
import { authenticate, requirePlannerOrAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, scheduleController.findAll);
router.get('/:id', authenticate, scheduleController.findById);
router.get('/machine-load', authenticate, scheduleController.getMachineLoad);
router.post('/check-conflict', authenticate, scheduleController.checkConflict);
router.post('/', authenticate, requirePlannerOrAdmin, scheduleController.create);
router.put('/:id', authenticate, requirePlannerOrAdmin, scheduleController.update);
router.delete('/:id', authenticate, requirePlannerOrAdmin, scheduleController.delete);
router.patch('/:id/status', authenticate, requirePlannerOrAdmin, scheduleController.updateStatus);

export default router;
