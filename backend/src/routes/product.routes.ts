import { Router } from 'express';
import validateZod from '../middleware/validateZod';
import { createProductSchema, updateProductSchema } from '../schemas/productos.schema';
import * as ProductController from '../controllers/productos.controller';
import authMiddleware from '../middleware/auth';
import checkRoles from '../middleware/checkRoles';

const router = Router();

router
    .route('/')
    .get(ProductController.getProductsAll)
    .post(authMiddleware, checkRoles(['admin', 'supervisor']), validateZod(createProductSchema), ProductController.createProduct);

router 
    .route('/:id')
    .get(ProductController.getProductById)
    .put(authMiddleware, checkRoles(['admin', 'supervisor']), validateZod(updateProductSchema), ProductController.updateProduct)
    .delete(authMiddleware, checkRoles(['admin', 'supervisor']), ProductController.deleteProduct);

export default router;


