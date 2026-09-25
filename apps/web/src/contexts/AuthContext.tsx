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
} from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (email: string, password: string, nome?: string) => Promise<void>;
  logout: () => void;
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

      try {
        const freshUser = await getMeApi();
        const authUserData: AuthUser = {
          id: freshUser.id,
          nome: freshUser.nome,
          email: freshUser.email,
          ativo: freshUser.ativo,
        };
        setUser(authUserData);
        setToken(storedToken);
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

  const login = async (email: string, password: string, remember: boolean = true) => {
    const data = await loginApi(email, password);
    setStoredAuth(data.token, data.user, remember);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, nome?: string) => {
    const data = await registerApi(email, password, nome);
    setStoredAuth(data.token, data.user, true);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
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
