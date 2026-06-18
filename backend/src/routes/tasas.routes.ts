import { Router } from 'express';
import { getLatestTasa, refreshTasas } from '../controllers/tasas.controller';
import authMiddleware from '../middleware/auth';

const router = Router()

router
    .route('/latest')
    .get(getLatestTasa);

router
    .route('/refresh')
    .post(authMiddleware, refreshTasas);

export default router


