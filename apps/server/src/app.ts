import cors from 'cors';
import express from 'express';
import type { ApiResponse } from '@cronos/shared';

import automacoesRouter from './routes/automacoes';
import maquinasRouter from './routes/maquinas';
import gatilhosRouter from './routes/gatilhos';
import historicoRouter from './routes/historico';
import execucoesRouter from './routes/execucoes';
import authRouter from './routes/auth';
import usuariosRouter from './routes/usuarios';
import { authMiddleware } from './middlewares/auth';

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

  // Rotas de autenticação (públicas com register protegido)
  app.use('/api/auth', authRouter);

  // Gestão de usuários e permissões (restrito a admin / usuários autorizados)
  app.use('/api/usuarios', usuariosRouter);

  // Endpoints da API REST protegidos por autenticação
  app.use('/api/automacoes', authMiddleware, automacoesRouter);
  app.use('/api/maquinas', authMiddleware, maquinasRouter);
  app.use('/api/gatilhos', authMiddleware, gatilhosRouter);
  app.use('/api/historico', authMiddleware, historicoRouter);
  app.use('/api/execucoes', authMiddleware, execucoesRouter);

  return app;
}