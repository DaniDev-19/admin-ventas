import { Router } from 'express';
import { validateZod } from '../middleware/validateZod';
import { createProductSchema, updateProductSchema } from '../schemas/productos.schema';
import * as ProductController from '../controllers/productos.controller';
import authMiddleware from '../middleware/auth';

const router = Router();

router
    .route('/')
    .get(ProductController.getProductsAll)
    .post(authMiddleware, validateZod(createProductSchema), ProductController.createProduct);

router 
    .route('/:id')
    .get(ProductController.getProductById)
    .put(authMiddleware, validateZod(updateProductSchema), ProductController.updateProduct)
    .delete(authMiddleware, ProductController.deleteProduct);

export default router;


