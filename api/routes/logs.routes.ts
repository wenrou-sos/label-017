import { Router } from 'express';
import logController from '../controllers/log.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, logController.findAll);
router.get('/recent', authenticate, logController.findRecent);
router.get('/:id', authenticate, logController.findById);
router.get('/user/:userId', authenticate, logController.findByUserId);
router.get('/module/:module', authenticate, logController.findByModule);

export default router;
