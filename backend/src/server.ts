import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import questRoutes from './routes/quests.routes';
import userRoutes from './routes/users.routes';
import { initCronJobs } from './cron';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Cron Jobs (Keep existing cron infrastructure for now, can be adapted later)
// initCronJobs(); 

// Routes
app.use('/api/quests', questRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Project Guild Backend',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 PROJECT GUILD BACKEND RUNNING ON PORT ${PORT}`);
    console.log(`=================================`);
});
