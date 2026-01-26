// Polyfill for pdf-parse
if (typeof (Promise as any).withResolvers === 'undefined') {
    // @ts-ignore
    (Promise as any).withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}
// @ts-ignore
if (!global.DOMMatrix) {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix {
        constructor() { return this; }
        translate() { return this; }
        scale() { return this; }
        multiply() { return this; }
        transformPoint() { return { x: 0, y: 0 }; }
    };
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import transactionRoutes from './routes/transaction.routes';
import importRoutes from './routes/import.routes';
import { initCronJobs } from './cron';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Cron Jobs
initCronJobs();

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/import', importRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 BACKEND RUNNING ON PORT ${PORT}`);
    console.log(`=================================`);
});
