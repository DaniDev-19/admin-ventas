import { Router } from 'express';
import { ValidateSchema } from '../middleware/validateSchema';
import { createProductSchema, updateProductSchema } from '../schemas/productos.schema';
import * as ProductController from '../controllers/productos.controller';

const router = Router();

router
    .route('/')
    .get(ProductController.getProductsAll)
    .post(ValidateSchema(createProductSchema), ProductController.createProduct);

router 
    .route('/:id')
    .get(ProductController.getProductById)
    .put(ValidateSchema(updateProductSchema), ProductController.updateProduct)
    .delete(ProductController.deleteProduct);

export default router;
