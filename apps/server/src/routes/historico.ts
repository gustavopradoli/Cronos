import { Router, Request, Response } from 'express';
import { query } from '../db';
import type { ApiResponse, Historico } from '@cronos/shared';

const router = Router();

export interface HistoricoItemCompleto extends Historico {
  automacao_nome: string;
  departamento: string;
  maquina_nome?: string | null;
  gatilho_tipo?: string | null;
}

// GET /api/historico - Listar histórico com filtros
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, status, departamento, data_inicio, data_fim, limit = '100', offset = '0' } = req.query;

    let sql = `
      SELECT 
        h.*,
        a.nome AS automacao_nome,
        a.departamento AS departamento,
        m.nome AS maquina_nome,
        g.tipo AS gatilho_tipo
      FROM historico h
      JOIN automacoes a ON a.id = h.automacao_id
      LEFT JOIN maquinas m ON m.id = h.maquina_id
      LEFT JOIN gatilhos g ON g.id = h.gatilho_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND h.status = $${params.length}`;
    }

    if (departamento) {
      params.push(departamento);
      sql += ` AND a.departamento = $${params.length}`;
    }

    if (data_inicio) {
      params.push(data_inicio);
      sql += ` AND h.data_inicio >= $${params.length}::timestamptz`;
    }

    if (data_fim) {
      params.push(`${data_fim} 23:59:59`);
      sql += ` AND h.data_inicio <= $${params.length}::timestamptz`;
    }

    if (search) {
      params.push(`%${search}%`);
      const pIndex = params.length;
      sql += ` AND (
        a.nome ILIKE $${pIndex} OR 
        a.departamento ILIKE $${pIndex} OR 
        COALESCE(m.nome, '') ILIKE $${pIndex} OR 
        COALESCE(h.erro, '') ILIKE $${pIndex}
      )`;
    }

    sql += ` ORDER BY h.data_inicio DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await query<HistoricoItemCompleto>(sql, params);

    // Contagem total para paginação
    const countSql = `
      SELECT COUNT(*) as total
      FROM historico h
      JOIN automacoes a ON a.id = h.automacao_id
      LEFT JOIN maquinas m ON m.id = h.maquina_id
    `;
    const countResult = await query(countSql);

    const response: ApiResponse<{ items: HistoricoItemCompleto[]; total: number }> = {
      success: true,
      data: {
        items: result.rows,
        total: Number(countResult.rows[0]?.total || 0),
      },
    };
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/historico/:id - Detalhes do histórico (incluindo erro completo)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        h.*,
        a.nome AS automacao_nome,
        a.caminho_exe,
        a.departamento AS departamento,
        m.nome AS maquina_nome,
        g.tipo AS gatilho_tipo
      FROM historico h
      JOIN automacoes a ON a.id = h.automacao_id
      LEFT JOIN maquinas m ON m.id = h.maquina_id
      LEFT JOIN gatilhos g ON g.id = h.gatilho_id
      WHERE h.id = $1
    `;
    const result = await query<HistoricoItemCompleto>(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Registro de histórico não encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
