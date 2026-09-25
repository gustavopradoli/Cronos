import { Router, Request, Response } from 'express';
import { query } from '../db';
import type { ApiResponse, Automacao } from '@cronos/shared';

const router = Router();

// GET /api/automacoes - Listar automações
router.get('/', async (req: Request, res: Response) => {
  try {
    const { departamento, ativo } = req.query;
    let sql = 'SELECT * FROM automacoes WHERE 1=1';
    const params: any[] = [];

    if (departamento) {
      params.push(departamento);
      sql += ` AND departamento = $${params.length}`;
    }

    if (ativo !== undefined) {
      params.push(ativo === 'true');
      sql += ` AND ativo = $${params.length}`;
    }

    sql += ' ORDER BY id DESC';

    const result = await query<Automacao>(sql, params);
    const response: ApiResponse<Automacao[]> = {
      success: true,
      data: result.rows,
    };
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/automacoes/:id - Obter uma automação
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query<Automacao>('SELECT * FROM automacoes WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Automação não encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/automacoes - Criar automação
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nome, descricao, caminho_exe, departamento, ativo } = req.body;

    if (!nome || !caminho_exe || !departamento) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: nome, caminho_exe, departamento',
      });
    }

    const result = await query<Automacao>(
      `INSERT INTO automacoes (nome, descricao, caminho_exe, departamento, ativo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nome, descricao || null, caminho_exe, departamento, ativo ?? true]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/automacoes/:id - Atualizar automação
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, descricao, caminho_exe, departamento, ativo } = req.body;

    const result = await query<Automacao>(
      `UPDATE automacoes
       SET nome = COALESCE($1, nome),
           descricao = COALESCE($2, descricao),
           caminho_exe = COALESCE($3, caminho_exe),
           departamento = COALESCE($4, departamento),
           ativo = COALESCE($5, ativo)
       WHERE id = $6
       RETURNING *`,
      [nome, descricao, caminho_exe, departamento, ativo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Automação não encontrada' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/automacoes/:id - Excluir automação
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM automacoes WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Automação não encontrada' });
    }

    res.json({ success: true, data: { id: Number(id) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
