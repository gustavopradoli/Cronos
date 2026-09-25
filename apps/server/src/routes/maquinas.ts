import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { query } from '../db';
import type { ApiResponse, Maquina } from '@cronos/shared';

const router = Router();

const REALTIME_URL = process.env.REALTIME_HTTP_URL || 'http://localhost:3002';

// GET /api/maquinas - Listar máquinas com status online
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query<Maquina>('SELECT * FROM maquinas ORDER BY nome ASC');

    // Tenta consultar clientes conectados no realtime
    let onlineMachineNames = new Set<string>();
    try {
      const rtRes = await fetch(`${REALTIME_URL}/clients`, { signal: AbortSignal.timeout(1000) });
      if (rtRes.ok) {
        const rtData = (await rtRes.json()) as { clients: { machine_name: string }[] };
        onlineMachineNames = new Set(rtData.clients.map((c) => c.machine_name.toLowerCase()));
      }
    } catch {
      // Realtime pode estar offline no momento
    }

    const maquinasComStatus = result.rows.map((m) => ({
      ...m,
      is_online: onlineMachineNames.has(m.nome.toLowerCase()),
    }));

    const response: ApiResponse<typeof maquinasComStatus> = {
      success: true,
      data: maquinasComStatus,
    };
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/maquinas/:id - Obter máquina por id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query<Maquina>('SELECT * FROM maquinas WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Máquina não encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/maquinas - Cadastrar máquina
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nome, secret, ativo } = req.body;

    if (!nome) {
      return res.status(400).json({ success: false, error: 'O nome da máquina é obrigatório' });
    }

    // Gera secret seguro em hexadecimal se não for fornecido
    const generatedSecret = secret?.trim() || crypto.randomBytes(24).toString('hex');

    const result = await query<Maquina>(
      `INSERT INTO maquinas (nome, secret, ativo)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nome.trim(), generatedSecret, ativo ?? true]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Já existe uma máquina cadastrada com este nome.' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/maquinas/:id - Atualizar máquina
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, secret, ativo } = req.body;

    const result = await query<Maquina>(
      `UPDATE maquinas
       SET nome = COALESCE($1, nome),
           secret = COALESCE($2, secret),
           ativo = COALESCE($3, ativo)
       WHERE id = $4
       RETURNING *`,
      [nome?.trim(), secret?.trim(), ativo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Máquina não encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Já existe uma máquina cadastrada com este nome.' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/maquinas/:id/regenerate-secret - Gerar novo secret para a máquina
router.post('/:id/regenerate-secret', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newSecret = crypto.randomBytes(24).toString('hex');

    const result = await query<Maquina>(
      `UPDATE maquinas SET secret = $1 WHERE id = $2 RETURNING *`,
      [newSecret, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Máquina não encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/maquinas/:id - Excluir máquina
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM maquinas WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Máquina não encontrada' });
    }

    res.json({ success: true, data: { id: Number(id) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
