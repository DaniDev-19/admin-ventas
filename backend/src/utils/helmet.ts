import dotenv from 'dotenv';

dotenv.config();

export const helmetConfig = {
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? true : false,
}