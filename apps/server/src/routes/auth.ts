import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';
import type { ApiResponse, AuthResponseData, Usuario } from '@cronos/shared';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cronos_jwt_secret_dev_key_2026';
const JWT_EXPIRES_IN: jwt.SignOptions['expiresIn'] = '7d';


function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register - Cadastro de novo usuário
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, nome } = req.body;

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
        error: 'A senha deve conter no mínimo 6 caracteres.',
      });
    }

    // Verifica se já existe um usuário com este e-mail
    const existingUser = await query('SELECT id FROM usuarios WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Este e-mail já está cadastrado no sistema.',
      });
    }

    // Nome padrão baseado no e-mail se não fornecido
    const displayName =
      nome && typeof nome === 'string' && nome.trim().length > 0
        ? nome.trim()
        : normalizedEmail.split('@')[0];

    // Criptografa a senha com bcrypt
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(password, salt);

    // Insere o novo usuário no PostgreSQL
    const insertResult = await query<Usuario>(
      `INSERT INTO usuarios (nome, email, senha_hash, ativo)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, nome, email, ativo, data_criacao, data_atualizacao`,
      [displayName, normalizedEmail, senhaHash]
    );

    const newUser = insertResult.rows[0];

    // Gera token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, nome: newUser.nome },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const responseData: AuthResponseData = {
      user: {
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email,
        ativo: newUser.ativo,
      },
      token,
    };

    const response: ApiResponse<AuthResponseData> = {
      success: true,
      data: responseData,
    };

    return res.status(201).json(response);
  } catch (error: any) {
    console.error('[Auth] Erro no registro de usuário:', error);
    return res.status(500).json({
      success: false,
      error: `Erro interno ao cadastrar usuário: ${error.message}`,
    });
  }
});

// POST /api/auth/login - Login de usuário
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'E-mail e senha são obrigatórios.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Busca usuário no banco
    const userResult = await query(
      `SELECT id, nome, email, senha_hash, ativo, ultimo_login
       FROM usuarios
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'E-mail ou senha incorretos.',
      });
    }

    const user = userResult.rows[0];

    if (!user.ativo) {
      return res.status(403).json({
        success: false,
        error: 'Esta conta de usuário está desativada. Entre em contato com o suporte.',
      });
    }

    // Compara senha usando bcrypt
    const passwordMatch = await bcrypt.compare(String(password), user.senha_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'E-mail ou senha incorretos.',
      });
    }

    // Atualiza data do último login
    await query('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Gera token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, nome: user.nome },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const responseData: AuthResponseData = {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        ativo: user.ativo,
      },
      token,
    };

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error('[Auth] Erro no login:', error);
    return res.status(500).json({
      success: false,
      error: `Erro interno ao autenticar: ${error.message}`,
    });
  }
});

// GET /api/auth/me - Dados do usuário atualmente logado
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const userResult = await query<Usuario>(
      `SELECT id, nome, email, ativo, ultimo_login, data_criacao, data_atualizacao
       FROM usuarios
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

    const user = userResult.rows[0];

    if (!user.ativo) {
      return res.status(403).json({
        success: false,
        error: 'Esta conta está inativa.',
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('[Auth] Erro ao carregar perfil:', error);
    return res.status(500).json({
      success: false,
      error: `Erro ao obter dados da sessão: ${error.message}`,
    });
  }
});

// POST /api/auth/reset-password - Redefinição de senha
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'E-mail e nova senha são obrigatórios.',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'A nova senha deve ter no mínimo 6 caracteres.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const userResult = await query('SELECT id FROM usuarios WHERE email = $1', [normalizedEmail]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'E-mail não cadastrado.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(newPassword, salt);

    await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [
      senhaHash,
      userResult.rows[0].id,
    ]);

    return res.json({
      success: true,
      message: 'Senha alterada com sucesso.',
    });
  } catch (error: any) {
    console.error('[Auth] Erro ao redefinir senha:', error);
    return res.status(500).json({
      success: false,
      error: `Erro ao redefinir senha: ${error.message}`,
    });
  }
});

export default router;
