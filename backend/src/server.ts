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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
