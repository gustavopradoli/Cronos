import http from 'node:http';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server, Socket } from 'socket.io';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PORT = Number(process.env.REALTIME_PORT || 3002);

interface ConnectedClientInfo {
  socket: Socket;
  machine_id: number;
  machine_name: string;
  client_name: string;
  connected_at: string;
}

// Mapa de sockets conectados: socket.id -> ConnectedClientInfo
const connectedClients = new Map<string, ConnectedClientInfo>();

// Criação do servidor HTTP nativo
const server = http.createServer(async (req, res) => {
  // CORS headers para o HTTP
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // Health check
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', clients: connectedClients.size }));
    return;
  }

  // GET /clients - Lista clientes conectados
  if (url.pathname === '/clients' && req.method === 'GET') {
    const list = Array.from(connectedClients.values()).map((c) => ({
      machine_id: c.machine_id,
      machine_name: c.machine_name,
      client_name: c.client_name,
      connected_at: c.connected_at,
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ clients: list }));
    return;
  }

  // POST /dispatch - Dispara ordem para o runner
  if (url.pathname === '/dispatch' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const { automacao_id, maquina_id, tipo = 'manual', gatilho_id } = JSON.parse(body || '{}');

        if (!automacao_id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'automacao_id é obrigatório' }));
          return;
        }

        // Busca dados da automação
        const autoRes = await query('SELECT * FROM automacoes WHERE id = $1', [automacao_id]);
        if (autoRes.rows.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Automação não encontrada' }));
          return;
        }
        const automacao = autoRes.rows[0];

        // Localiza a máquina conectada
        let targetClient: ConnectedClientInfo | undefined;
        if (maquina_id) {
          targetClient = Array.from(connectedClients.values()).find((c) => c.machine_id === Number(maquina_id));
        } else {
          // Se não especificada, pega a primeira disponível
          targetClient = Array.from(connectedClients.values())[0];
        }

        if (!targetClient) {
          // Registra falha no histórico por máquina offline
          const histRes = await query(
            `INSERT INTO historico (automacao_id, maquina_id, gatilho_id, status, erro, tipo, data_inicio, data_fim)
             VALUES ($1, $2, $3, 'erro', $4, $5, NOW(), NOW())
             RETURNING *`,
            [
              automacao_id,
              maquina_id || null,
              gatilho_id || null,
              'Disparo não realizado: Nenhuma máquina online ou conectada para processar.',
              tipo,
            ]
          );

          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'A máquina selecionada está offline ou desconectada.',
              historico: histRes.rows[0],
            })
          );
          return;
        }

        // Cria registro inicial no histórico com status 'em_execucao'
        const histRes = await query(
          `INSERT INTO historico (automacao_id, maquina_id, gatilho_id, status, tipo, data_inicio)
           VALUES ($1, $2, $3, 'em_execucao', $4, NOW())
           RETURNING *`,
          [automacao_id, targetClient.machine_id, gatilho_id || null, tipo]
        );
        const historicoCriado = histRes.rows[0];

        // Envia ordem start_process para o cliente Python Socket.IO
        targetClient.socket.emit('start_process', {
          automation_id: String(historicoCriado.id),
          actual_automation_id: automacao.id,
          exe_path: automacao.caminho_exe,
          args: [],
        });

        console.log(
          `[Dispatch] Comando start_process enviado para máquina "${targetClient.machine_name}" (Histórico #${historicoCriado.id})`
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, historico: historicoCriado }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // POST /stop - Interrompe uma execução
  if (url.pathname === '/stop' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const { historico_id } = JSON.parse(body || '{}');
        if (!historico_id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'historico_id é obrigatório' }));
          return;
        }

        // Busca dados do histórico para enviar stop específico para a máquina correta
        const histRes = await query('SELECT * FROM historico WHERE id = $1', [historico_id]);
        if (histRes.rows.length > 0) {
          const targetMaquinaId = histRes.rows[0].maquina_id;
          const target = Array.from(connectedClients.values()).find(
            (c) => c.machine_id === targetMaquinaId
          );
          if (target) {
            target.socket.emit('stop_process', { automation_id: String(historico_id) });
            console.log(`[Stop] Ordem stop_process emitida para a máquina "${target.machine_name}" (Histórico #${historico_id})`);
          } else {
            io.emit('stop_process', { automation_id: String(historico_id) });
          }
        } else {
          io.emit('stop_process', { automation_id: String(historico_id) });
        }

        // Atualiza status no banco para 'parado'
        await query(
          `UPDATE historico SET status = 'parado', data_fim = NOW(), erro = 'Interrompido manualmente pelo operador' WHERE id = $1`,
          [historico_id]
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Ordem de parada emitida com sucesso' }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
});

// Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Nova conexão recebida: ${socket.id}`);

  // Evento de autenticação / registro do runner
  socket.on('register', async (data) => {
    try {
      const { client_name = 'CronosDesktop', machine_name = '', secret = '' } = data || {};
      const trimmedMachine = String(machine_name).trim();
      const trimmedSecret = String(secret).trim();

      console.log(`[Auth] Tentativa de registro da máquina "${trimmedMachine}"...`);

      if (!trimmedMachine || !trimmedSecret) {
        console.warn(`[Auth] Falha: Nome da máquina ou secret não preenchidos para ${socket.id}`);
        socket.emit('auth_error', {
          message: 'Nome da máquina e Secret são obrigatórios para autenticação.',
        });
        socket.disconnect(true);
        return;
      }

      // Validação no PostgreSQL
      const machineRes = await query(
        `SELECT * FROM maquinas WHERE LOWER(nome) = LOWER($1) AND secret = $2 AND ativo = TRUE`,
        [trimmedMachine, trimmedSecret]
      );

      if (machineRes.rows.length === 0) {
        console.warn(
          `[Auth] Falha: Máquina "${trimmedMachine}" não encontrada, inativa ou secret incorreto.`
        );
        socket.emit('auth_error', {
          message: 'Autenticação recusada: Secret inválido ou máquina inativa/inexistente.',
        });
        socket.disconnect(true);
        return;
      }

      const maquina = machineRes.rows[0];

      // Se já houver conexão ativa anterior para a mesma máquina, desconecta o socket obsoleto
      for (const [oldSid, oldClient] of connectedClients.entries()) {
        if (oldClient.machine_id === maquina.id && oldSid !== socket.id) {
          console.log(`[Auth] Encerrando conexão anterior obsoleta da máquina "${maquina.nome}" (${oldSid})`);
          oldClient.socket.disconnect(true);
          connectedClients.delete(oldSid);
        }
      }

      // Atualiza ip_address e ultima_conexao no banco
      const remoteIp = socket.handshake.address?.replace('::ffff:', '') || '127.0.0.1';
      await query(`UPDATE maquinas SET ultima_conexao = NOW(), ip_address = $1 WHERE id = $2`, [
        remoteIp,
        maquina.id,
      ]);

      // Registra no mapa em memória
      connectedClients.set(socket.id, {
        socket,
        machine_id: maquina.id,
        machine_name: maquina.nome,
        client_name,
        connected_at: new Date().toISOString(),
      });

      console.log(
        `[Auth] Máquina "${maquina.nome}" (ID: ${maquina.id}) autenticada e conectada com sucesso!`
      );
      socket.emit('auth_success', {
        message: 'Conectado e autenticado com sucesso no orquestrador!',
        machine_id: maquina.id,
        machine_name: maquina.nome,
      });
    } catch (err: any) {
      console.error('[Auth] Erro interno durante register:', err);
      socket.emit('auth_error', { message: 'Erro interno ao validar autenticação.' });
      socket.disconnect(true);
    }
  });

  // Evento emitido pelo cliente ao concluir execução
  socket.on('process_finished', async (data) => {
    try {
      console.log(`[Socket.IO] Sinal de process_finished recebido:`, data);
      const { automation_id, status, return_code, message } = data || {};

      if (!automation_id) {
        console.warn('[Socket.IO] process_finished recebido sem automation_id');
        return;
      }

      const historicoId = Number(automation_id);
      if (isNaN(historicoId)) {
        console.warn(`[Socket.IO] automation_id "${automation_id}" não é um número de histórico.`);
        return;
      }

      // Normaliza status ('sucesso', 'erro', 'parado')
      let finalStatus: 'sucesso' | 'erro' | 'parado' = 'sucesso';
      if (status === 'parado') {
        finalStatus = 'parado';
      } else if (status === 'erro' || return_code !== 0) {
        finalStatus = 'erro';
      }

      // Mensagem de erro/log para salvar
      const finalErrorMsg = finalStatus !== 'sucesso' ? message || `Código de saída: ${return_code}` : null;

      // Atualiza registro no histórico
      const updateRes = await query(
        `UPDATE historico
         SET status = $1,
             erro = $2,
             data_fim = NOW()
         WHERE id = $3
         RETURNING *`,
        [finalStatus, finalErrorMsg, historicoId]
      );

      console.log(
        `[Historico] Execução #${historicoId} atualizada para "${finalStatus}". Registro atualizado.`
      );

      // Notifica todos (para dashboards ou clientes web)
      io.emit('historico_updated', updateRes.rows[0]);
    } catch (err: any) {
      console.error('[Socket.IO] Erro ao atualizar histórico após finalização:', err);
    }
  });

  socket.on('disconnect', () => {
    const info = connectedClients.get(socket.id);
    if (info) {
      console.log(`[Socket.IO] Máquina desconectada: ${info.machine_name} (${socket.id})`);
      connectedClients.delete(socket.id);
    } else {
      console.log(`[Socket.IO] Conexão encerrada: ${socket.id}`);
    }
  });
});

// -----------------------------------------------------------------------------
// SCHEDULER DE GATILHOS (Agendamento Automático)
// -----------------------------------------------------------------------------
const lastFiredPerTrigger = new Map<number, string>();

async function checkGatilhos() {
  try {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMin}`; // "HH:mm"

    // Dia da semana: 1 = segunda, ..., 7 = domingo
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const currentDayOfMonth = now.getDate();
    const isWeekend = currentDayOfWeek === 6 || currentDayOfWeek === 7;

    const minuteKey = `${now.toISOString().slice(0, 10)} ${currentTimeStr}`;

    const gatilhosRes = await query('SELECT * FROM gatilhos WHERE ativo = TRUE');

    for (const g of gatilhosRes.rows) {
      // Evita duplo disparo no mesmo minuto
      if (lastFiredPerTrigger.get(g.id) === minuteKey) {
        continue;
      }

      // Trunca o horario_execucao ("08:30:00" -> "08:30")
      const triggerTimeStr = String(g.horario_execucao).slice(0, 5);
      if (triggerTimeStr !== currentTimeStr) {
        continue;
      }

      let shouldFire = false;

      if (g.tipo === 'diario') {
        if (!isWeekend) {
          shouldFire = true;
        } else {
          // É sábado ou domingo
          if (g.regra_dia_util === 'manter') {
            shouldFire = true;
          }
          // postergar ou adiantar: não dispara no fim de semana
        }
      } else if (g.tipo === 'semanal') {
        if (g.dia_execucao === currentDayOfWeek) {
          if (!isWeekend || g.regra_dia_util === 'manter') {
            shouldFire = true;
          }
        }
      } else if (g.tipo === 'mensal') {
        if (g.dia_execucao === currentDayOfMonth) {
          if (!isWeekend || g.regra_dia_util === 'manter') {
            shouldFire = true;
          }
        }
      }

      if (shouldFire) {
        console.log(`[Scheduler] Gatilho #${g.id} disparando para automação #${g.automacao_id}...`);
        lastFiredPerTrigger.set(g.id, minuteKey);

        // Dispara a automação
        try {
          const autoRes = await query('SELECT * FROM automacoes WHERE id = $1 AND ativo = TRUE', [
            g.automacao_id,
          ]);
          if (autoRes.rows.length === 0) continue;
          const automacao = autoRes.rows[0];

          const targetClient = Array.from(connectedClients.values()).find(
            (c) => c.machine_id === g.maquina_id
          );

          if (!targetClient) {
            await query(
              `INSERT INTO historico (automacao_id, maquina_id, gatilho_id, status, erro, tipo, data_inicio, data_fim)
               VALUES ($1, $2, $3, 'erro', 'Gatilho disparado mas máquina associada está offline.', 'gatilho', NOW(), NOW())`,
              [g.automacao_id, g.maquina_id, g.id]
            );
            continue;
          }

          // Cria histórico em_execucao
          const histRes = await query(
            `INSERT INTO historico (automacao_id, maquina_id, gatilho_id, status, tipo, data_inicio)
             VALUES ($1, $2, $3, 'em_execucao', 'gatilho', NOW())
             RETURNING *`,
            [g.automacao_id, g.maquina_id, g.id]
          );

          targetClient.socket.emit('start_process', {
            automation_id: String(histRes.rows[0].id),
            actual_automation_id: automacao.id,
            exe_path: automacao.caminho_exe,
            args: [],
          });
        } catch (err: any) {
          console.error(`[Scheduler] Erro ao disparar gatilho #${g.id}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler] Erro ao verificar gatilhos:', err);
  }
}

// Verifica a cada 20 segundos
setInterval(checkGatilhos, 20000);

server.listen(PORT, () => {
  console.log(`[Cronos Realtime] Servidor Socket.IO e HTTP rodando na porta ${PORT}`);
});