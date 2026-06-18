import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import validateZod from '../middleware/validateZod';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/register', validateZod(registerSchema), AuthController.register);
router.post('/login', validateZod(loginSchema), AuthController.login);

export default router;
