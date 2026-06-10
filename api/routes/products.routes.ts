import { Router } from 'express';
import productController from '../controllers/product.controller';
import { authenticate, requirePlannerOrAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, productController.findAll);
router.get('/:id', authenticate, productController.findById);
router.post('/', authenticate, requirePlannerOrAdmin, productController.create);
router.put('/:id', authenticate, requirePlannerOrAdmin, productController.update);
router.delete('/:id', authenticate, requirePlannerOrAdmin, productController.delete);

export default router;
