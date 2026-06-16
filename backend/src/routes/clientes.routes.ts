import { Router } from 'express';
import * as ClientController from '../controllers/clientes.controller';
import { ValidateSchema } from '../middleware/validateSchema';
import { clientesSchema, updateClientesSchema } from '../schemas/clientes.schema';

const router = Router();

router
    .route("/")
    .get(ClientController.getClientesAll)
    .post(ValidateSchema(clientesSchema), ClientController.createClient);

router
    .route("/:id")
    .get(ClientController.getClienteById)
    .put(ValidateSchema(updateClientesSchema), ClientController.updateClient)
    .delete(ClientController.deleteClient);

export default router;