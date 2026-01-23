import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || '', {
    maxRetriesPerRequest: null, // Required by BullMQ
});

connection.on('error', (err) => {
    console.error('Redis Connection Error:', err);
});

connection.on('connect', () => {
    console.log('Connected to Redis');
});

export default connection;
