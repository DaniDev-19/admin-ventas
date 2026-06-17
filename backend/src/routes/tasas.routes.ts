import { Router } from 'express';
import { getLatestTasa, refreshTasas } from '../controllers/tasas.controller';
import { ValidateSchema } from '../middleware/validateSchema';
import { createTasaMonedaSchema } from '../schemas/tasa_moneda.schema';

const router = Router()

router
    .route('/')
    .get(getLatestTasa);

router
    .route('/refresh')
    .post(ValidateSchema(createTasaMonedaSchema), refreshTasas);

export default router
