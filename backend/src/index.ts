import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { prisma } from './config/prisma';
import { startTasaScheduler } from './services/tasa_moneda.scheduler';
const PORT = process.env.PORT || 4000;

async function server() {
    try {
        await prisma.$connect();
        let result: unknown = null;
        try {
            result = await prisma.$queryRawUnsafe('SELECT NOW()');
        } catch (e) {
            console.warn('Test query failed:', e);
        }

        console.log('DataBase connected successfully', result);

        app.listen(PORT, () => {
            if (process.env.NODE_ENV === 'development') {
                console.log('Running in development mode');
                console.log(`Server running on port: http://localhost:${PORT}`);
            } else {
                console.log('Running in production mode');
                console.log(`Server running on port ${PORT}`);
            }
        });
        startTasaScheduler()
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    }
}

server();
// Trigger reload after prisma generation