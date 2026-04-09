import express from 'express';
const router = express.Router();

import { getProcesses, getOptions, getLiveSuggestions } from '../controller/processosC.js';

// Define the endpoints and map them to the controller methods
router.get('/processos', getProcesses);
router.get('/opcoes-filtros', getOptions);
router.get('/sugestoes', getLiveSuggestions);

// Export the router
export default router;
