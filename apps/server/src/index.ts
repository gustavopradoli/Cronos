import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config();

const PORT = process.env.PORT || 3001;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[Cronos Server] Orquestrador rodando na porta ${PORT}`);
});
