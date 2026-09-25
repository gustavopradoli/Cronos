import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env da raiz
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/cronos';

async function updateDatabase() {
  console.log('[DB Sync] Conectando ao PostgreSQL...');
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    console.log('[DB Sync] Conexão estabelecida com sucesso.');

    const sqlFilePath = path.resolve(__dirname, '../docker/init.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`[DB Sync] Arquivo SQL não encontrado em: ${sqlFilePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log('[DB Sync] Executando script SQL para atualizar/criar tabelas...');
    await client.query(sql);

    console.log('[DB Sync] Banco de dados atualizado com sucesso!');
  } catch (error) {
    const errorDetails = error.message || error.code || String(error);
    console.error('[DB Sync] Erro ao sincronizar o banco de dados:', errorDetails);
    if (error.code === 'ECONNREFUSED' || errorDetails.includes('ECONNREFUSED')) {
      console.error('[DB Sync] Não foi possível conectar ao PostgreSQL na porta 5433.');
      console.error('[DB Sync] Certifique-se de que o Docker Desktop está aberto e execute "npm run docker:up".');
    }
    process.exit(1);
  } finally {
    await client.end().catch(() => { });
  }
}

updateDatabase();
