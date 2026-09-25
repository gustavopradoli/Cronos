import { Router, Request, Response } from 'express';
import { query } from '../db';
import type { ApiResponse, Gatilho } from '@cronos/shared';

const router = Router();

export interface GatilhoComRelacionamentos extends Gatilho {
  automacao_nome: string;
  automacao_departamento: string;
  maquina_nome: string;
}

// GET /api/gatilhos - Listar gatilhos com nomes de automação e máquina
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sql = `
      SELECT 
        g.*,
        a.nome AS automacao_nome,
        a.departamento AS automacao_departamento,
        m.nome AS maquina_nome
      FROM gatilhos g
      JOIN automacoes a ON a.id = g.automacao_id
      JOIN maquinas m ON m.id = g.maquina_id
      ORDER BY g.id DESC
    `;
    const result = await query<GatilhoComRelacionamentos>(sql);
    const response: ApiResponse<GatilhoComRelacionamentos[]> = {
      success: true,
      data: result.rows,
    };
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/gatilhos/:id - Obter um gatilho por id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        g.*,
        a.nome AS automacao_nome,
        a.departamento AS automacao_departamento,
        m.nome AS maquina_nome
      FROM gatilhos g
      JOIN automacoes a ON a.id = g.automacao_id
      JOIN maquinas m ON m.id = g.maquina_id
      WHERE g.id = $1
    `;
    const result = await query<GatilhoComRelacionamentos>(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Gatilho não encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/gatilhos - Criar gatilho
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      automacao_id,
      maquina_id,
      tipo,
      dia_execucao,
      horario_execucao,
      regra_dia_util,
      ativo,
    } = req.body;

    if (!automacao_id || !maquina_id || !tipo || !horario_execucao) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: automacao_id, maquina_id, tipo, horario_execucao',
      });
    }

    const result = await query<Gatilho>(
      `INSERT INTO gatilhos 
        (automacao_id, maquina_id, tipo, dia_execucao, horario_execucao, regra_dia_util, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        automacao_id,
        maquina_id,
        tipo,
        dia_execucao || null,
        horario_execucao,
        regra_dia_util || 'manter',
        ativo ?? true,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/gatilhos/:id - Atualizar gatilho
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      automacao_id,
      maquina_id,
      tipo,
      dia_execucao,
      horario_execucao,
      regra_dia_util,
      ativo,
    } = req.body;

    const result = await query<Gatilho>(
      `UPDATE gatilhos
       SET automacao_id = COALESCE($1, automacao_id),
           maquina_id = COALESCE($2, maquina_id),
           tipo = COALESCE($3, tipo),
           dia_execucao = $4,
           horario_execucao = COALESCE($5, horario_execucao),
           regra_dia_util = COALESCE($6, regra_dia_util),
           ativo = COALESCE($7, ativo)
       WHERE id = $8
       RETURNING *`,
      [
        automacao_id,
        maquina_id,
        tipo,
        dia_execucao,
        horario_execucao,
        regra_dia_util,
        ativo,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Gatilho não encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/gatilhos/:id - Excluir gatilho
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM gatilhos WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Gatilho não encontrado' });
    }

    res.json({ success: true, data: { id: Number(id) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
