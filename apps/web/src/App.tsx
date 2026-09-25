import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import './styles/theme.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthRoute />} path="/" />
        <Route element={<Dashboard />} path="/dashboard" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}

function AuthRoute() {
  const navigate = useNavigate();

  return <AuthPage onAuthenticated={() => navigate('/dashboard')} />;
}
