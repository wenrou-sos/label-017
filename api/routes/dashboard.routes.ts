import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/stats', authenticate, dashboardController.getStats);
router.get('/machine-loads', authenticate, dashboardController.getMachineLoads);
router.get('/order-status-distribution', authenticate, dashboardController.getOrderStatusDistribution);
router.get('/machine-status-distribution', authenticate, dashboardController.getMachineStatusDistribution);
router.get('/recent-schedules', authenticate, dashboardController.getRecentSchedules);
router.get('/upcoming-schedules', authenticate, dashboardController.getUpcomingSchedules);
router.get('/recent-logs', authenticate, dashboardController.getRecentLogs);

export default router;
