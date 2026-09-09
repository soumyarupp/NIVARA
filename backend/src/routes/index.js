import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import organizationRoutes from './organization.routes.js';
import ministryRoutes from './ministry.routes.js';
import agencyRoutes from './agency.routes.js';
import projectRoutes from './project.routes.js';
import reportRoutes from './report.routes.js';
import clearanceRoutes from './clearance.routes.js';
import tenderRoutes from './tender.routes.js';
import milestoneRoutes from './milestone.routes.js';
import partnerRoutes from './partner.routes.js';
import documentRoutes from './document.routes.js';
import alertRoutes from './alert.routes.js';
import notificationRoutes from './notification.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import preApprovalRoutes from './preApproval.routes.js';
import simulatorRoutes from './simulator.routes.js';
import chatbotRoutes from './chatbot.routes.js';

const router = Router();

// API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NIVARA backend is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NIVARA National Infrastructure Project Monitoring Authority',
    version: '1.0.0'
  });
});

// Mount All NIVARA Sub-Routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/ministries', ministryRoutes);
router.use('/agencies', agencyRoutes);
router.use('/projects', projectRoutes);
router.use('/reports', reportRoutes);
router.use('/clearances', clearanceRoutes);
router.use('/tenders', tenderRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/partners', partnerRoutes);
router.use('/documents', documentRoutes);
router.use('/alerts', alertRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/pre-approval', preApprovalRoutes);
router.use('/simulator', simulatorRoutes);
router.use('/chatbot', chatbotRoutes);

export default router;
