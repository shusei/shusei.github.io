import cron from 'node-cron';
import { processRecurringPayments } from './services/recurring.service';

export const initCronJobs = () => {
    // Run every day at 00:00
    cron.schedule('0 0 * * *', () => {
        console.log('Running daily recurring payments job...');
        processRecurringPayments();
    });

    console.log('Cron jobs initialized.');
};
