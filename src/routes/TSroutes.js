import { Router } from 'express'
import TScontroller from '../controller/TScontroller.js'
import multer from 'multer'

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })
const routes = Router()

routes.post("/ts/import", upload.single('arquivoExcel'), TScontroller.importActivities)
routes.get("/ts/select", TScontroller.selectTS)
routes.post("/ts/export", TScontroller.exportTS)

// Rota de teste exclusiva para debugar valorH (pode testar via POST enviando { "seguradora": "Nome" })
routes.post("/ts/testValorH", TScontroller.testValorH);
//routes.get("/ts/testValorH", TScontroller.testValorH); // Suporte para testar via browser usando params de URL

// Rota de teste para ver todas as seguradoras da base
routes.post("/ts/testValorH/all", TScontroller.testGetAllSeguradoras);
routes.get("/ts/testValorH/all", TScontroller.testGetAllSeguradoras);

export default routes