import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApiResponse } from '@cronos/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  const response: ApiResponse<{ service: string; status: string; timestamp: string }> = {
    success: true,
    data: {
      service: 'Cronos Orchestrator Backend',
      status: 'online',
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`[Cronos Server] Orquestrador rodando na porta ${PORT}`);
});
