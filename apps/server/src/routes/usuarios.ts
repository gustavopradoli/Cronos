import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { authMiddleware, canManageUsersMiddleware, AuthenticatedRequest } from '../middlewares/auth';
import type { ApiResponse, Usuario, UserRole } from '@cronos/shared';

const router = Router();

// Aplica autenticação e permissão em todas as rotas de usuários
router.use(authMiddleware);
router.use(canManageUsersMiddleware);

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// GET /api/usuarios - Lista todos os usuários cadastrados
router.get('/', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query<Usuario>(
      `SELECT id, nome, email, role, pode_cadastrar_usuarios, ativo, ultimo_login, data_criacao, data_atualizacao
       FROM usuarios
       ORDER BY id ASC`
    );

    const response: ApiResponse<Usuario[]> = {
      success: true,
      data: result.rows,
    };
    return res.json(response);
  } catch (error: any) {
    console.error('[Usuarios] Erro ao listar usuários:', error);
    return res.status(500).json({
      success: false,
      error: `Erro ao obter lista de usuários: ${error.message}`,
    });
  }
});

// POST /api/usuarios - Criação de novo usuário pelo Administrador
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, nome, role = 'operador', pode_cadastrar_usuarios = false, ativo = true } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'O e-mail é obrigatório.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Formato de e-mail inválido.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'A senha provisória deve conter no mínimo 6 caracteres.',
      });
    }

    // Verifica unicidade do e-mail
    const existing = await query('SELECT id FROM usuarios WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Já existe um usuário cadastrado com este e-mail.',
      });
    }

    const assignedRole: UserRole = role === 'admin' ? 'admin' : 'operador';
    const canManage = assignedRole === 'admin' ? true : Boolean(pode_cadastrar_usuarios);

    const displayName =
      nome && typeof nome === 'string' && nome.trim().length > 0
        ? nome.trim()
        : normalizedEmail.split('@')[0];

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(password, salt);

    const insertResult = await query<Usuario>(
      `INSERT INTO usuarios (nome, email, senha_hash, role, pode_cadastrar_usuarios, ativo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, email, role, pode_cadastrar_usuarios, ativo, data_criacao, data_atualizacao`,
      [displayName, normalizedEmail, senhaHash, assignedRole, canManage, Boolean(ativo)]
    );

    const newUser = insertResult.rows[0];

    return res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error: any) {
    console.error('[Usuarios] Erro ao criar usuário:', error);
    return res.status(500).json({
      success: false,
      error: `Erro interno ao cadastrar usuário: ${error.message}`,
    });
  }
});

// PUT /api/usuarios/:id - Atualiza dados, permissões e status de um usuário
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = parseInt(String(req.params.id), 10);
    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({ success: false, error: 'ID de usuário inválido.' });
    }

    const { nome, email, password, role, pode_cadastrar_usuarios, ativo } = req.body;

    // Busca o usuário atual no banco
    const userResult = await query('SELECT id, email, role, ativo FROM usuarios WHERE id = $1', [targetUserId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    const currentUser = userResult.rows[0];
    const isSelf = req.user?.id === targetUserId;

    // Trava de segurança: usuário logado não pode desativar a si mesmo ou tirar o próprio cargo de admin
    if (isSelf) {
      if (ativo === false) {
        return res.status(400).json({
          success: false,
          error: 'Você não pode desativar sua própria conta logada.',
        });
      }
      if (role && role !== 'admin') {
        return res.status(400).json({
          success: false,
          error: 'Você não pode revogar o seu próprio privilégio de Administrador.',
        });
      }
    }

    let normalizedEmail = currentUser.email;
    if (email && typeof email === 'string') {
      const trimmed = email.trim().toLowerCase();
      if (!isValidEmail(trimmed)) {
        return res.status(400).json({ success: false, error: 'Formato de e-mail inválido.' });
      }
      // Verifica se outro usuário já usa este e-mail
      const duplicate = await query('SELECT id FROM usuarios WHERE email = $1 AND id <> $2', [trimmed, targetUserId]);
      if (duplicate.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Este e-mail já está em uso por outro usuário.',
        });
      }
      normalizedEmail = trimmed;
    }

    const newRole: UserRole = role === 'admin' ? 'admin' : (role === 'operador' ? 'operador' : currentUser.role);
    const newCanManage = newRole === 'admin' ? true : (pode_cadastrar_usuarios !== undefined ? Boolean(pode_cadastrar_usuarios) : currentUser.pode_cadastrar_usuarios);
    const newAtivo = ativo !== undefined ? Boolean(ativo) : currentUser.ativo;
    const newNome = nome && typeof nome === 'string' && nome.trim().length > 0 ? nome.trim() : currentUser.nome;

    // Se senha foi fornecida, atualiza o hash
    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'A nova senha deve ter no mínimo 6 caracteres.',
        });
      }
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(password, salt);

      const updateWithPass = await query<Usuario>(
        `UPDATE usuarios
         SET nome = $1, email = $2, role = $3, pode_cadastrar_usuarios = $4, ativo = $5, senha_hash = $6, data_atualizacao = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING id, nome, email, role, pode_cadastrar_usuarios, ativo, ultimo_login, data_criacao, data_atualizacao`,
        [newNome, normalizedEmail, newRole, newCanManage, newAtivo, senhaHash, targetUserId]
      );
      return res.json({ success: true, data: updateWithPass.rows[0] });
    }

    // Atualização sem alteração de senha
    const updateResult = await query<Usuario>(
      `UPDATE usuarios
       SET nome = $1, email = $2, role = $3, pode_cadastrar_usuarios = $4, ativo = $5, data_atualizacao = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, nome, email, role, pode_cadastrar_usuarios, ativo, ultimo_login, data_criacao, data_atualizacao`,
      [newNome, normalizedEmail, newRole, newCanManage, newAtivo, targetUserId]
    );

    return res.json({
      success: true,
      data: updateResult.rows[0],
    });
  } catch (error: any) {
    console.error('[Usuarios] Erro ao atualizar usuário:', error);
    return res.status(500).json({
      success: false,
      error: `Erro ao atualizar usuário: ${error.message}`,
    });
  }
});

// DELETE /api/usuarios/:id - Remove um usuário
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = parseInt(String(req.params.id), 10);
    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({ success: false, error: 'ID de usuário inválido.' });
    }

    if (req.user?.id === targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode excluir sua própria conta de usuário logada.',
      });
    }

    const checkResult = await query('SELECT id, email, nome FROM usuarios WHERE id = $1', [targetUserId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    await query('DELETE FROM usuarios WHERE id = $1', [targetUserId]);

    return res.json({
      success: true,
      message: `Usuário ${checkResult.rows[0].nome || checkResult.rows[0].email} excluído com sucesso.`,
    });
  } catch (error: any) {
    console.error('[Usuarios] Erro ao excluir usuário:', error);
    return res.status(500).json({
      success: false,
      error: `Erro ao excluir usuário: ${error.message}`,
    });
  }
});

export default router;
