import express from 'express';
import dotenv from 'dotenv';
import officeRoutes from './routes.js';
import connectDB from '../../common/config/database.js';
import { errorHandler, notFound } from '../../common/utils/errorHandler.js';

dotenv.config();

const app = express();
app.use(express.json());

// Rotas do módulo – prefixo "/office"
// O Vox, como controlador central, pode acionar estes endpoints via comandos automatizados.
app.use('/office', officeRoutes);

// Middlewares para recursos não encontrados e tratamento global de erros
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.OFFICE_PORT || 3001;
connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Office Service rodando na porta ${PORT}`)
    );
  })
  .catch(error => {
    console.error('Erro na inicialização do Office Service:', error);
  });