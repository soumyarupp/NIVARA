import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initRiskCronJob } from './jobs/riskCheckJob.js';

const startServer = async () => {
  try {
    await connectDB();

    // Start background risk monitoring cron job
    initRiskCronJob();

    const server = app.listen(env.PORT, () => {
      console.log(`NIVARA Backend Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`Health endpoint: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
