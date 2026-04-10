import express from 'express';
const router = express.Router();

import { getProcesses, getOptions, getLiveSuggestions, updateProcessStatus } from '../controller/processosC.js';

// Define the endpoints and map them to the controller methods
router.get('/processos', getProcesses);
router.get('/opcoes-filtros', getOptions);
router.get('/sugestoes', getLiveSuggestions);
router.patch('/processos/:codigo_sinistro/status', updateProcessStatus);

// Export the router
export default router;
