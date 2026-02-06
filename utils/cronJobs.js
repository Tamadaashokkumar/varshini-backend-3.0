import cron from 'node-cron';
import { markAbandonedCarts } from '../controllers/cartController.js';

const startCronJobs = () => {
  console.log("⏰ Cron Jobs Initialized...");

  // Schedule: Run every hour (ప్రతి గంటకు ఒకసారి)
  // Cron Syntax: "0 * * * *" means "At minute 0 of every hour"
  cron.schedule('0 * * * *', async () => {
    console.log("🔔 Triggering Hourly Abandoned Cart Check...");
    await markAbandonedCarts();
  });
};

export default startCronJobs;