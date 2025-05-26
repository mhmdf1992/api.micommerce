import express from 'express';
import { userRoutes } from './user';
import { authRoutes } from './auth';
import { tenantRoutes } from './tenant';
import { adminAuth } from '../../middlewares/admin-auth';
import { superUserAuth } from '../../middlewares/super-user-auth';
import { logRoutes } from './log';
import { userActivityRoutes } from './user-activity';

export const routes = express.Router();
routes.use('/auth', authRoutes);
routes.use('/tenants', superUserAuth, tenantRoutes);
routes.use('/users', adminAuth, userRoutes);
routes.use('/logs', adminAuth, logRoutes);
routes.use('/user-activity', adminAuth, userActivityRoutes);

