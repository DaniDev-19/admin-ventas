import { Router } from 'express'
import { createVenta, getVentaById, getAllVentas, deleteVenta, deleteVentaNoRestore } from '../controllers/ventas.controller'
import validateZod from '../middleware/validateZod'
import { createVentaSchema } from '../schemas/ventas.schema'

const router = Router()

router
  .route('/')
  .get(getAllVentas)
  .post(validateZod(createVentaSchema), createVenta)

router
  .route('/:id')
  .get(getVentaById)
  .delete(deleteVenta)

router
  .route('/:id/no-restore')
  .delete(deleteVentaNoRestore)

export default router
