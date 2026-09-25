import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AuthPage from '../pages/AuthPage';
import Dashboard from '../pages/Dashboard';
import Layout from '../components/layout/Layout';
import { OrchestratorScreen } from '../pages/OrchestratorScreen';
import Gatilhos from '../pages/Gatilhos';
import Maquinas from '../pages/Maquinas';
import Historico from '../pages/Historico';
import { BrandMark } from '../components/BrandMark';
import '../styles/theme.css';

function getPathname() {
  return window.location.pathname.replace(/\/$/, '') || '/';
}

function AppRouter() {
  const [pathname, setPathname] = useState(getPathname);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    function handlePopState() {
      setPathname(getPathname());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090a0f',
          color: '#94a3b8',
          gap: '16px',
        }}
      >
        <BrandMark size="large" />
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Carregando Cronos...</p>
      </div>
    );
  }

  // Se não estiver autenticado, qualquer rota direciona para autenticação segura
  if (!isAuthenticated) {
    return (
      <AuthPage
        onAuthenticated={() => {
          window.history.pushState({}, '', '/dashboard');
          setPathname('/dashboard');
        }}
      />
    );
  }

  // Rotas autenticadas
  if (pathname === '/orquestrador' || pathname === '/automacoes') {
    return (
      <Layout activeItem="automation-cadastro">
        <OrchestratorScreen />
      </Layout>
    );
  }

  if (pathname === '/gatilhos') {
    return (
      <Layout activeItem="automation-trigger">
        <Gatilhos />
      </Layout>
    );
  }

  if (pathname === '/maquinas') {
    return (
      <Layout activeItem="automation-machines">
        <Maquinas />
      </Layout>
    );
  }

  if (pathname === '/historico') {
    return (
      <Layout activeItem="automation-history">
        <Historico />
      </Layout>
    );
  }

  // Rota padrão autenticada: Dashboard
  return <Dashboard />;
}

export default function Routes() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
