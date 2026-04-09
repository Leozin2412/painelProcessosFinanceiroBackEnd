import express from 'express';
import cors from 'cors';
import config from './src/config.js';
import processosRoutes from './src/routes/processosR.js';

const app = express();

// Set up essential middlewares
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());

// Mount the process routes under the /api prefix
app.use('/api', processosRoutes);

// Start the server using the configured port
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${config.NODE_ENV} mode.`);
});
