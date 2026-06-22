import { Router } from 'express';
import * as ReportsController from '../controllers/reports.controller';
import authMiddleware from '../middleware/auth';
import checkRoles from '../middleware/checkRoles';

const router = Router();

// Todas las rutas de reportes requieren autenticación por JWT y rol de admin o supervisor
router.use(authMiddleware);
router.use(checkRoles(['admin', 'supervisor']));

router.get('/sales/excel', ReportsController.exportSalesExcel);
router.get('/sales/pdf', ReportsController.exportSalesPdf);

router.get('/inventory/excel', ReportsController.exportInventoryExcel);
router.get('/inventory/pdf', ReportsController.exportInventoryPdf);

router.get('/debts/excel', ReportsController.exportDebtsExcel);
router.get('/debts/pdf', ReportsController.exportDebtsPdf);

router.get('/top-sellers/excel', ReportsController.exportTopSellersExcel);
router.get('/top-sellers/pdf', ReportsController.exportTopSellersPdf);

router.get('/category/excel', ReportsController.exportSalesByCategoryExcel);
router.get('/category/pdf', ReportsController.exportSalesByCategoryPdf);

router.get('/vip-clients/excel', ReportsController.exportVipClientsExcel);
router.get('/vip-clients/pdf', ReportsController.exportVipClientsPdf);

router.get('/daily-cash-close/excel', ReportsController.exportDailyCashCloseExcel);
router.get('/daily-cash-close/pdf', ReportsController.exportDailyCashClosePdf);

export default router;

