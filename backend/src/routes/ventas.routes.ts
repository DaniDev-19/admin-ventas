import { Router } from 'express'
import { createVenta, getVentaById, getAllVentas, deleteVenta, deleteVentaNoRestore, updateVenta } from '../controllers/ventas.controller'
import validateZod from '../middleware/validateZod'
import { createVentaSchema, updateVentaSchema } from '../schemas/ventas.schema'
import authMiddleware from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

router
  .route('/')
  .get(getAllVentas)
  .post(validateZod(createVentaSchema), createVenta)

router
  .route('/:id')
  .get(getVentaById)
  .put(validateZod(updateVentaSchema), updateVenta)
  .delete(deleteVenta)

router
  .route('/:id/no-restore')
  .delete(deleteVentaNoRestore)

export default router
