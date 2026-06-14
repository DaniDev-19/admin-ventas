import app from './app';
import { prisma } from './config/prisma';
const PORT = process.env.PORT || 4000;

async function server() {
    try {
        await prisma.$connect();
        console.log('DataBase connected successfully');

        app.listen(PORT, () => {
            if(process.env.NODE_ENV === 'development') {
                console.log('Running in development mode');
                console.log(`Server running on port: http://localhost:${PORT}`);
            } else {
                console.log('Running in production mode');
                console.log(`Server running on port ${PORT}`);
            }
        });
    }catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    }
}

server();