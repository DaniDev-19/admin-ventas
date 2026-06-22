import { Router } from 'express';
import * as UsuariosController from '../controllers/usuarios.controller';
import authMiddleware from '../middleware/auth';
import { validateZod } from '../middleware/validateZod';
import { createUsuarioSchema, updateUsuarioSchema } from '../schemas/usuarios.schema';

const router = Router();

router.use(authMiddleware);

router
  .route('/')
  .get(UsuariosController.getUsuariosAll)
  .post(validateZod(createUsuarioSchema), UsuariosController.createUsuario);

router
  .route('/:id')
  .put(validateZod(updateUsuarioSchema), UsuariosController.updateUsuario)
  .delete(UsuariosController.deleteUsuario);

export default router;
