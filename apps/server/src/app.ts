import cors from 'cors';
import express from 'express';
import type { ApiResponse } from '@cronos/shared';

import automacoesRouter from './routes/automacoes';
import maquinasRouter from './routes/maquinas';
import gatilhosRouter from './routes/gatilhos';
import historicoRouter from './routes/historico';
import execucoesRouter from './routes/execucoes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    const response: ApiResponse<{ service: string; status: string; timestamp: string }> = {
      success: true,
      data: {
        service: 'Cronos HTTP API',
        status: 'online',
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  });

  // Endpoints da API REST
  app.use('/api/automacoes', automacoesRouter);
  app.use('/api/maquinas', maquinasRouter);
  app.use('/api/gatilhos', gatilhosRouter);
  app.use('/api/historico', historicoRouter);
  app.use('/api/execucoes', execucoesRouter);

  return app;
}