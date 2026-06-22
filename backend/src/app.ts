import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { helmetConfig } from './utils/helmet';
import { corsOptions } from './utils/cors';
import { procesamientoMiddleware } from './middleware/procesamiento';
import { notFoundHandler, globalErrorHandler } from './middleware/global_errors';
import dbMiddleware from './middleware/db_conex';

import clientRoutes from "./routes/clientes.routes";
import ProductRoutes from "./routes/product.routes";
import tasasRoutes from './routes/tasas.routes'
import ventasRoutes from './routes/ventas.routes'
import reportsRoutes from './routes/reports.routes'
import authRoutes from './routes/auth.routes'
import emailRoutes from './routes/email.routes'
import usuariosRoutes from './routes/usuarios.routes'

const app = express();

app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use(procesamientoMiddleware);
app.use(dbMiddleware);

app.get("/", (req, res) => {
  const date = new Date();
  const start = req.startTime ?? date;
  const time = date.getTime() - start.getTime();
  const bizName = process.env.SMTP_FROM_NAME || 'Single Sales';
  res.json({
    status: "ok",
    message: `Servidor ${bizName} funcionando correctamente`,
    timestamp: date.toISOString(),
    processingTime: `${time} ms`,
  });
});

app.use("/api/clients", clientRoutes);
app.use("/api/product", ProductRoutes);
app.use("/api/tasas", tasasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);



export default app;

