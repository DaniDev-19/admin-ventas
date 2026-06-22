import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import validateZod from '../middleware/validateZod';
import { clientesSchema, updateClientesSchema } from '../schemas/clientes.schema';
import * as ClientController from '../controllers/clientes.controller';

const router = Router();

router.use(authMiddleware);

router
    .route("/")
    .get(ClientController.getClientesAll)
    .post(validateZod(clientesSchema), ClientController.createClient);

router
    .route("/:id")
    .get(ClientController.getClienteById)
    .put(validateZod(updateClientesSchema), ClientController.updateClient)
    .delete(ClientController.deleteClient);

export default router;