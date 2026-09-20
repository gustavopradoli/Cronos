import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import type { AutomationEvent } from '@cronos/shared';

dotenv.config();

const PORT = Number(process.env.REALTIME_PORT || 3002);
const server = new WebSocketServer({ port: PORT });

server.on('connection', (socket) => {
  const connectedEvent: AutomationEvent = {
    type: 'realtime.connected',
    occurredAt: new Date().toISOString(),
  };

  socket.send(JSON.stringify(connectedEvent));
});

console.log(`[Cronos Realtime] WebSocket de automação rodando na porta ${PORT}`);