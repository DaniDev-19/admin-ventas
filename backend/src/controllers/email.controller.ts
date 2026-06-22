import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service';
import { enrichAndNext } from '../utils/nextError';

const emailService = new EmailService();

export const sendReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, details } = req.body;

    if (!to) {
      return res.status(400).json({
        status: 'error',
        message: 'El correo del destinatario es obligatorio.'
      });
    }

    if (!details || !details.invoiceKey) {
      return res.status(400).json({
        status: 'error',
        message: 'Los detalles del recibo son inválidos o están incompletos.'
      });
    }

    const htmlContent = emailService.buildReceiptHtml(details);
    const subject = `Recibo de Venta - ${details.invoiceKey}`;

    await emailService.sendMail({
      to,
      subject,
      html: htmlContent
    });

    res.status(200).json({
      status: 'success',
      message: `Recibo enviado exitosamente a ${to}`
    });
  } catch (err) {
    enrichAndNext(err, next);
  }
};

export const sendCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientIds, subject, body } = req.body;
    const prisma = req.prisma;

    if (!prisma) {
      throw new Error('Database client not found in request');
    }

    if (!subject || !body) {
      return res.status(400).json({
        status: 'error',
        message: 'El asunto y el cuerpo del mensaje son obligatorios.'
      });
    }

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Debe especificar al menos un cliente destinatario.'
      });
    }

    // Buscar clientes en la base de datos que tengan correo
    const clients = await prisma.clientes.findMany({
      where: {
        id: { in: clientIds.map(Number) },
        AND: [
          { email: { not: null } },
          { email: { not: '' } }
        ]
      },
      select: {
        id: true,
        nombre: true,
        email: true
      }
    });

    if (clients.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Ninguno de los clientes seleccionados posee un correo electrónico registrado.'
      });
    }

    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Enviar correos de uno en uno para evitar bloqueos y personalizar el mensaje
    for (const client of clients) {
      if (!client.email) continue;
      
      // Personalizar el cuerpo con el nombre del cliente si se usa un tag {cliente}
      const personalizedBody = body.replace(/{cliente}/g, client.nombre || 'Cliente');
      
      const bizName = process.env.SMTP_FROM_NAME || 'Single Sales';
      // Plantilla básica para campañas promocionales/informativas
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <!-- Cabecera de Campaña -->
            <tr>
              <td style="background-color: #1e293b; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${bizName}</h1>
                <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px;">Notificaciones & Promociones</p>
              </td>
            </tr>
            <!-- Contenido del Mensaje -->
            <tr>
              <td style="padding: 40px 30px; font-size: 16px; line-height: 1.6; color: #334155;">
                ${personalizedBody.replace(/\n/g, '<br>')}
              </td>
            </tr>
            <!-- Pie de página -->
            <tr>
              <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
                Ha recibido este correo porque forma parte de nuestra lista de clientes.<br>
                <strong>${bizName}</strong> &copy; ${new Date().getFullYear()} - Gestión Administrativa.
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      try {
        await emailService.sendMail({
          to: client.email,
          subject,
          html: htmlContent
        });
        successCount++;
      } catch (err: any) {
        failureCount++;
        errors.push({
          email: client.email,
          error: err.message || String(err)
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Campaña procesada. Enviados con éxito: ${successCount}. Fallidos: ${failureCount}.`,
      data: {
        totalTarget: clients.length,
        successCount,
        failureCount,
        errors
      }
    });
  } catch (err) {
    enrichAndNext(err, next);
  }
};
