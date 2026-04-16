import express from 'express';
const router = express.Router();

import { getFilters, getDashboardData } from '../controller/chartsC.js';

// GET /api/charts/filters
router.get('/filters', getFilters);

// GET /api/charts/dashboard?mes=2026-03&operacao=Auto,Residencial&seguradora=Porto,Tokio&data_fim=2026-04-14
router.get('/dashboard', getDashboardData);

// Export the router
export default router;
