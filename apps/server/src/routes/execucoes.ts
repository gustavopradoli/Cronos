import { Router, Request, Response } from 'express';

const router = Router();
const REALTIME_URL = process.env.REALTIME_HTTP_URL || 'http://localhost:3002';

// POST /api/execucoes/disparar - Disparo manual de automação
router.post('/disparar', async (req: Request, res: Response) => {
  try {
    const { automacao_id, maquina_id } = req.body;

    if (!automacao_id) {
      return res.status(400).json({ success: false, error: 'O ID da automação é obrigatório' });
    }

    // Chama o serviço realtime para despachar o comando para o client socket
    const rtRes = await fetch(`${REALTIME_URL}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automacao_id: Number(automacao_id),
        maquina_id: maquina_id ? Number(maquina_id) : undefined,
        tipo: 'manual',
      }),
    });

    const data = await rtRes.json();
    if (!rtRes.ok) {
      return res.status(rtRes.status).json(data);
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Erro ao comunicar com o serviço de realtime: ${error.message}`,
    });
  }
});

// POST /api/execucoes/interromper - Parar automação em execução
router.post('/interromper', async (req: Request, res: Response) => {
  try {
    const { historico_id } = req.body;

    if (!historico_id) {
      return res.status(400).json({ success: false, error: 'O ID do histórico é obrigatório' });
    }

    const rtRes = await fetch(`${REALTIME_URL}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historico_id: Number(historico_id) }),
    });

    const data = await rtRes.json();
    if (!rtRes.ok) {
      return res.status(rtRes.status).json(data);
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Erro ao comunicar com o serviço de realtime: ${error.message}`,
    });
  }
});

export default router;
