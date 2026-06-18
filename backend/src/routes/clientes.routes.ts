import { Router } from 'express';
import * as ClientController from '../controllers/clientes.controller';
import { validateZod } from '../middleware/validateZod';
import { clientesSchema, updateClientesSchema } from '../schemas/clientes.schema';

const router = Router();

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