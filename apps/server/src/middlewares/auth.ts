import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cronos_jwt_secret_dev_key_2026';

export interface TokenPayload {
  id: number;
  email: string;
  nome: string;
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
