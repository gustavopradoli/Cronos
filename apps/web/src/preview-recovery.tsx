import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import RecoverPassword from './pages/RecoverPassword';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RecoverPassword onBackToLogin={() => alert('Voltaria para o Login')} />
  </StrictMode>
);

