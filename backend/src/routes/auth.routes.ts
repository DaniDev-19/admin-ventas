import { Router } from 'express';
import validateZod from '../middleware/validateZod';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import * as AuthController from '../controllers/auth.controller';

const router = Router();

router
    .route('/register')
    .post(validateZod(registerSchema), AuthController.register);

router
    .route('/login')
    .post(validateZod(loginSchema), AuthController.login);

export default router;
