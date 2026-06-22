import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import checkRoles from '../middleware/checkRoles';
import * as EmailController from '../controllers/email.controller';

const router = Router();

router.use(authMiddleware)

router
    .route('/receipt')
    .post(EmailController.sendReceipt);

router
    .route('/campaign')
    .post(checkRoles(['admin', 'supervisor']), EmailController.sendCampaign);

export default router;
