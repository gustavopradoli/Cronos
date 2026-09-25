import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/cronos';

async function seed() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    console.log('[Seed] Conectado ao banco de dados.');

    // 1. Cadastrar máquinas padrão
    const machineName = process.env.COMPUTERNAME || 'GUSKPC';
    const secretPadrao = 'cronos_secret_123456789';

    await client.query(
      `INSERT INTO maquinas (nome, secret, ativo)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (nome) DO UPDATE SET secret = EXCLUDED.secret, ativo = TRUE`,
      [machineName, secretPadrao]
    );
    console.log(`[Seed] Máquina "${machineName}" cadastrada com secret: ${secretPadrao}`);

    const maqRes = await client.query('SELECT id FROM maquinas WHERE nome = $1', [machineName]);
    const maquinaId = maqRes.rows[0].id;

    // 2. Cadastrar automações de teste se não houver automações
    const countAutos = await client.query('SELECT COUNT(*) FROM automacoes');
    if (Number(countAutos.rows[0].count) === 0) {
      const baseDir = path.resolve(__dirname, '../CronosClient/executaveis');

      const autos = [
        {
          nome: 'Processamento Fiscal Diário (Sucesso)',
          descricao: 'Emissão e conciliação de notas fiscais com encerramento automático sem falhas.',
          caminho_exe: path.join(baseDir, 'sucesso.exe'),
          departamento: 'Fiscal',
        },
        {
          nome: 'Sincronização de Saldos Bancários (Simulação de Erro)',
          descricao: 'Consulta APIs financeiras e simula falha de timeout para testar auditoria de erros.',
          caminho_exe: path.join(baseDir, 'erro.exe'),
          departamento: 'Financeiro',
        },
        {
          nome: 'Extração Contínua de Relatórios (Andamento)',
          descricao: 'Processo de longa duração para validação do monitoramento em tempo real.',
          caminho_exe: path.join(baseDir, 'andamento.exe'),
          departamento: 'Tecnologia',
        },
      ];

      for (const a of autos) {
        const ins = await client.query(
          `INSERT INTO automacoes (nome, descricao, caminho_exe, departamento, ativo)
           VALUES ($1, $2, $3, $4, TRUE)
           RETURNING id`,
          [a.nome, a.descricao, a.caminho_exe, a.departamento]
        );

        // Cria um gatilho diário de teste para a primeira automação
        if (a.nome.includes('Fiscal')) {
          await client.query(
            `INSERT INTO gatilhos (automacao_id, maquina_id, tipo, horario_execucao, regra_dia_util, ativo)
             VALUES ($1, $2, 'diario', '08:30:00', 'manter', TRUE)`,
            [ins.rows[0].id, maquinaId]
          );
        }
      }
      console.log('[Seed] Automações e gatilho de demonstração cadastrados com sucesso!');
    } else {
      console.log('[Seed] Automações já existentes no banco.');
    }
  } catch (err) {
    console.error('[Seed] Erro ao popular dados:', err);
  } finally {
    await client.end().catch(() => {});
  }
}

seed();
