import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '@cronos/shared';
import {
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth,
  loginApi,
  registerApi,
  getMeApi,
  updateLastActivity,
  isSessionExpiredByInactivity,
} from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canManageUsers: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (email: string, password: string, nome?: string) => Promise<void>;
  logout: (reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      // Validação de expiração por inatividade (2 horas sem interação)
      if (isSessionExpiredByInactivity()) {
        console.warn('[Auth] Sessão expirada por inatividade.');
        sessionStorage.setItem('cronos_logout_reason', 'inactivity');
        clearStoredAuth();
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      try {
        const freshUser = await getMeApi();
        const authUserData: AuthUser = {
          id: freshUser.id,
          nome: freshUser.nome,
          email: freshUser.email,
          role: freshUser.role || 'operador',
          pode_cadastrar_usuarios: freshUser.role === 'admin' || Boolean(freshUser.pode_cadastrar_usuarios),
          ativo: freshUser.ativo,
        };
        setUser(authUserData);
        setToken(storedToken);
        updateLastActivity();
      } catch (err) {
        console.warn('[Auth] Sessão inválida ou expirada:', err);
        clearStoredAuth();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();

    function handleForcedLogout() {
      clearStoredAuth();
      setUser(null);
      setToken(null);
    }

    window.addEventListener('cronos-auth-logout', handleForcedLogout);
    return () => window.removeEventListener('cronos-auth-logout', handleForcedLogout);
  }, []);

  // Monitora inatividade do usuário e encerra sessão após 2 horas sem interação
  useEffect(() => {
    if (!token || !user) return;

    updateLastActivity();

    // Throttle: atualiza o timestamp de atividade no máximo 1 vez a cada 30 segundos
    let lastRecorded = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRecorded >= 30000) {
        lastRecorded = now;
        updateLastActivity();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Verificação periódica a cada 30 segundos se já passaram 2 horas sem atividade
    const checkInterval = window.setInterval(() => {
      if (isSessionExpiredByInactivity()) {
        console.warn('[Auth] Sessão encerrada: 2 horas de inatividade sem interação do usuário.');
        sessionStorage.setItem('cronos_logout_reason', 'inactivity');
        clearStoredAuth();
        setUser(null);
        setToken(null);
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }, 30000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      window.clearInterval(checkInterval);
    };
  }, [token, user]);

  const login = async (email: string, password: string, remember: boolean = true) => {
    const data = await loginApi(email, password);
    setStoredAuth(data.token, data.user, remember);
    setToken(data.token);
    setUser(data.user);
    updateLastActivity();
  };

  const register = async (email: string, password: string, nome?: string) => {
    const data = await registerApi(email, password, nome);
    setStoredAuth(data.token, data.user, true);
    setToken(data.token);
    setUser(data.user);
    updateLastActivity();
  };

  const logout = (reason?: string) => {
    clearStoredAuth();
    if (reason) {
      sessionStorage.setItem('cronos_logout_reason', reason);
    }
    setUser(null);
    setToken(null);
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const isAdmin = user?.role === 'admin';
  const canManageUsers = isAdmin || Boolean(user?.pode_cadastrar_usuarios);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin,
        canManageUsers,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
