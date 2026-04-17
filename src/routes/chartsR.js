import express from 'express';
const router = express.Router();

import { getFilters, getDashboardData } from '../controller/chartsC.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

// GET /api/charts/filters
router.get('/filters', authMiddleware, getFilters);

// GET /api/charts/dashboard?mes=2026-03&operacao=Auto,Residencial&seguradora=Porto,Tokio&data_fim=2026-04-14
router.get('/dashboard', authMiddleware, getDashboardData);

// Export the router
export default router;
