import cors from 'cors';
import express from 'express';
import type { ApiResponse } from '@cronos/shared';

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

  return app;
}