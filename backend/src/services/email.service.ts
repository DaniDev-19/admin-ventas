import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  /**
   * Crea el transporter leyendo las variables de entorno en el momento del envío.
   * Esto evita el problema de que el módulo se cargue antes de que dotenv procese el .env
   */
  private createTransporter(): nodemailer.Transporter | null {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('[SMTP Warning] Configuración SMTP incompleta. Las variables SMTP_HOST, SMTP_USER y SMTP_PASS son requeridas.');
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false // Permite certificados auto-firmados en entornos on-premise
      }
    });
  }

  private get fromAddress(): string {
    const name = process.env.SMTP_FROM_NAME || 'Single Sales';
    const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@singlesales.local';
    return `"${name}" <${email}>`;
  }

  /**
   * Envía un correo electrónico con formato HTML
   */
  async sendMail(opts: MailOptions): Promise<boolean> {
    const transporter = this.createTransporter();

    const mailOptions = {
      from: this.fromAddress,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    };

    if (transporter) {
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP] ✓ Correo enviado a ${opts.to} — MessageId: ${info.messageId}`);
        return true;
      } catch (err: any) {
        console.error(`[SMTP Error] ✗ Error al enviar a ${opts.to}:`, err.message || err);
        throw new Error(`Error SMTP al enviar a ${opts.to}: ${err.message || err}`);
      }
    } else {
      // Modo desarrollo: simular sin enviar realmente
      console.log('\n--- [SMTP DEV MODE - CORREO SIMULADO] ---');
      console.log(`Desde:  ${this.fromAddress}`);
      console.log(`Para:   ${opts.to}`);
      console.log(`Asunto: ${opts.subject}`);
      console.log(`(Configura SMTP_HOST, SMTP_USER y SMTP_PASS en .env para envíos reales)`);
      console.log('-----------------------------------------\n');
      return true;
    }
  }

  /**
   * Construye una plantilla HTML responsiva para el recibo de venta digital
   */
  buildReceiptHtml(details: {
    invoiceKey: string;
    clientName: string;
    clientCedula?: string;
    date: string;
    totalUsd: number;
    tasa: number;
    totalBs: number;
    items: Array<{
      producto: { nombre: string; precio_usd: number };
      cantidad: number;
    }>;
  }): string {
    const bizName = process.env.SMTP_FROM_NAME || 'Single Sales';
    const rowsHtml = details.items.map((item) => {
      const priceUsd = Number(item.producto.precio_usd);
      const totalItemUsd = priceUsd * item.cantidad;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; font-size: 14px; color: #334155;">${item.producto.nombre}</td>
          <td style="padding: 10px 0; font-size: 14px; color: #334155; text-align: center;">${item.cantidad}</td>
          <td style="padding: 10px 0; font-size: 14px; color: #334155; text-align: right;">$${priceUsd.toFixed(2)}</td>
          <td style="padding: 10px 0; font-size: 14px; color: #334155; text-align: right; font-weight: bold;">$${totalItemUsd.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo de Venta - ${details.invoiceKey}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Encabezado -->
          <tr>
            <td style="background-color: #10b981; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${bizName}</h1>
              <p style="color: #a7f3d0; margin: 5px 0 0 0; font-size: 13px; font-weight: 500;">Control de Ventas &amp; Facturación</p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-bottom: 20px; border-bottom: 2px dashed #e2e8f0;">
                    <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #0f172a; font-weight: 700;">¡Gracias por su compra!</h2>
                    <p style="margin: 0; font-size: 14px; color: #64748b;">A continuación, se detalla el recibo digital de su transacción.</p>
                  </td>
                </tr>

                <!-- Detalles de la Transacción -->
                <tr>
                  <td style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" style="padding-bottom: 8px;">
                          <span style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Transacción</span><br>
                          <strong style="font-size: 14px; color: #334155;">${details.invoiceKey}</strong>
                        </td>
                        <td width="50%" style="padding-bottom: 8px; text-align: right;">
                          <span style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Fecha</span><br>
                          <strong style="font-size: 14px; color: #334155;">${details.date}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%">
                          <span style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Cliente</span><br>
                          <strong style="font-size: 14px; color: #334155;">${details.clientName}</strong>
                        </td>
                        ${details.clientCedula ? `
                        <td width="50%" style="text-align: right;">
                          <span style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Cédula</span><br>
                          <strong style="font-size: 14px; color: #334155;">${details.clientCedula}</strong>
                        </td>
                        ` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Tabla de Productos -->
                <tr>
                  <td style="padding: 20px 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <thead>
                        <tr style="border-bottom: 2px solid #cbd5e1;">
                          <th align="left" style="padding-bottom: 10px; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">Producto</th>
                          <th align="center" style="padding-bottom: 10px; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; width: 60px;">Cant.</th>
                          <th align="right" style="padding-bottom: 10px; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; width: 80px;">Precio</th>
                          <th align="right" style="padding-bottom: 10px; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; width: 85px;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${rowsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Totales -->
                <tr>
                  <td style="padding-top: 15px; border-top: 2px solid #e2e8f0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #64748b;">Subtotal USD:</td>
                        <td align="right" style="padding: 4px 0; font-size: 14px; color: #334155; font-weight: bold;">$${details.totalUsd.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 14px; color: #64748b;">Tasa de Cambio (BCV):</td>
                        <td align="right" style="padding: 4px 0; font-size: 14px; color: #334155;">Bs. ${details.tasa.toFixed(2)}</td>
                      </tr>
                      <tr style="font-size: 18px; font-weight: bold;">
                        <td style="padding: 15px 0 0 0; color: #0f172a; border-top: 1px solid #e2e8f0;">TOTAL BS:</td>
                        <td align="right" style="padding: 15px 0 0 0; color: #10b981; border-top: 1px solid #e2e8f0;">Bs. ${details.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              Este es un correo automático del sistema administrativo local on-premise.<br>
              <strong>${bizName}</strong> &copy; ${new Date().getFullYear()} - Todos los derechos reservados.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}

export default EmailService;
