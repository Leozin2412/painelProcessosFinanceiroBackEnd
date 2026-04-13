import express from 'express';
import cors from 'cors';
import config from './src/config.js';
import processosRoutes from './src/routes/processosR.js';
import tsRoutes from './src/routes/TSroutes.js';

const app = express();

const allowedFrontendUrl = (/*process.env.FRONTEND_URL ||*/ "https://painelfinanceirotrd.netlify.app/").replace(/\/$/, ""); // <-- REMOVIDA A BARRA FINAL

const localDevelopmentOrigins = [
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501", 
    "http://localhost:3000",  
    "http://localhost:5173",   
    "http://localhost:4000" 
];
const corsOptions = {
    // origin: (origin, callback) => {
    //     // Log para debug: veja qual 'origin' o navegador está enviando
    //     console.log('Origin da requisição:', origin);
    //     console.log('Allowed Frontend URL:', allowedFrontendUrl);

    //         if (
    //             !origin ||
    //             origin.replace(/\/$/, "") === allowedFrontendUrl.replace(/\/$/, "") || 
    //             localDevelopmentOrigins.includes(origin.replace(/\/$/, ""))
    //         ) {
    //             callback(null, true);
    //         }else {
    //         console.error('CORS Error: Not allowed by origin:', origin); 
    //         callback(new Error('Not allowed by CORS'), false);
    //     }
    // },
    methods: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    // Certifique-se de listar *todos* os cabeçalhos personalizados que seu frontend envia.
    // 'Content-Type', 'Authorization' são os mais comuns.
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'], 
    credentials: true 
  }


// Set up essential middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


app.use('/api', processosRoutes);


app.use('/automacao', tsRoutes);

// Start the server using the configured port
const PORT = config.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${config.NODE_ENV || 'development'} mode.`);
  console.log(`- Dashboard API mounted at /api`);
  console.log(`- Legacy Automation API mounted at /automacao`);
});
