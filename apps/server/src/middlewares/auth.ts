import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@cronos/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'cronos_jwt_secret_dev_key_2026';

export interface TokenPayload {
  id: number;
  email: string;
  nome: string;
  role?: UserRole;
  pode_cadastrar_usuarios?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação não fornecido.',
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Formato de cabeçalho de autenticação inválido. Utilize: Bearer <token>.',
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    return next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: 'Sessão expirada ou token inválido. Faça login novamente.',
    });
  }
}

/**
 * Middleware que verifica se o usuário é administrador ou possui permissão explícita para cadastrar/gerenciar usuários
 */
export function canManageUsersMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado.',
    });
  }

  if (req.user.role === 'admin' || req.user.pode_cadastrar_usuarios === true) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Acesso negado. Apenas administradores ou usuários autorizados podem cadastrar e gerenciar usuários.',
  });
}

/**
 * Middleware restrito exclusivamente a administradores
 */
export function adminOnlyMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado.',
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Acesso restrito. Somente administradores do sistema têm permissão para esta ação.',
  });
}
