import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { helmetConfig } from './utils/helmet';
import { corsOptions } from './utils/cors';
import { procesamientoMiddleware } from './middleware/procesamiento';
import { notFoundHandler, unauthorizedHandler, globalErrorHandler } from './middleware/global_errors';
import dbMiddleware from './middleware/db_conex';

import clientRoutes from "./routes/clientes.routes";


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
  res.json({
    status: "ok",
    message: "Servidor Single Sales funcionando correctamente",
    timestamp: date.toISOString(),
    processingTime: `${time} ms`,
  });
});

app.use(unauthorizedHandler);
app.use(notFoundHandler);
app.use(globalErrorHandler);


app.use("/api/clientes", clientRoutes);



export default app;

