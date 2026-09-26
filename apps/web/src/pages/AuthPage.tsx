import { FormEvent, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../contexts/AuthContext';
import RecoverPassword from './RecoverPassword';

type AuthPageProps = {
  onAuthenticated?: () => void;
};

const brandMessages = [
  {
    eyebrow: 'Orquestre o que importa',
    title: 'Menos tarefas soltas.',
    emphasis: 'Mais tempo para criar.',
    description: 'Um espaço inteligente para conectar processos, automatizar rotinas e acompanhar o trabalho em movimento.',
  },
  {
    eyebrow: 'Dê ritmo às suas ideias',
    title: 'Clareza para avançar.',
    emphasis: 'Consistência para crescer.',
    description: 'Transforme planos em passos possíveis e mantenha cada parte do seu trabalho no mesmo compasso.',
  },
  {
    eyebrow: 'Seu trabalho, no seu tempo',
    title: 'O próximo passo',
    emphasis: 'começa aqui.',
    description: 'Crie uma rotina mais leve, conecte o que importa e abra espaço para o que realmente pede sua atenção.',
  },
];

const currentYear = new Date().getFullYear();

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const { login } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeMessage, setActiveMessage] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inactivityNotice, setInactivityNotice] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('cronos_logout_reason') === 'inactivity') {
      setInactivityNotice(true);
      sessionStorage.removeItem('cronos_logout_reason');
    }
  }, []);

  useEffect(() => {
    const carouselTimer = window.setInterval(() => {
      setActiveMessage((currentMessage) => (currentMessage + 1) % brandMessages.length);
    }, 6000);

    return () => window.clearInterval(carouselTimer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    setAuthError('');
    setIsSubmitting(true);

    try {
      await login(normalizedEmail, password, rememberMe);
      onAuthenticated?.();
    } catch (err: any) {
      setAuthError(err.message || 'Falha ao autenticar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isRecovering) {
    return <RecoverPassword onBackToLogin={() => setIsRecovering(false)} />;
  }

  return (
    <main className="auth-page">
      <section className="brand-panel" aria-label="Sobre o Cronos">
        <div className="brand-panel__glow brand-panel__glow--top" />
        <div className="brand-panel__glow brand-panel__glow--bottom" />
        <header className="brand-lockup">
          <BrandMark size="small" />
          <span className="brand-lockup__copy">
            <span className="brand-lockup__name">Cronos</span>
            <span className="brand-lockup__tagline">Orquestrador de automações</span>
          </span>
        </header>
        <div className="brand-panel__content" aria-live="polite">
          <p className="eyebrow">{brandMessages[activeMessage].eyebrow}</p>
          <h1>
            {brandMessages[activeMessage].title} <em>{brandMessages[activeMessage].emphasis}</em>
          </h1>
          <p className="brand-panel__description">{brandMessages[activeMessage].description}</p>
        </div>
        <div className="brand-panel__carousel-controls" aria-label="Mensagens do Cronos">
          {brandMessages.map((message, index) => (
            <button
              className={`carousel-dot ${activeMessage === index ? 'is-active' : ''}`}
              key={message.eyebrow}
              onClick={() => setActiveMessage(index)}
              aria-label={`Mostrar mensagem ${index + 1}`}
              aria-current={activeMessage === index ? 'true' : undefined}
              type="button"
            />
          ))}
        </div>
      </section>

      <section className="form-panel">
        <div className="form-panel__inner">
          <div className="form-heading">
            <span className="form-heading__kicker">Acesso Restrito</span>
            <h2>Entre no seu espaço.</h2>
            <p>Controle de acesso exclusivo para usuários autorizados.</p>
          </div>

          {inactivityNotice && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.85rem 1rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                color: '#fca5a5',
                fontSize: '0.82rem',
                lineHeight: 1.45,
              }}
            >
              <strong style={{ display: 'block', color: '#fecaca', marginBottom: '2px' }}>
                Sessão encerrada por inatividade:
              </strong>
              Você esteve sem interação por mais de 2 horas. Por segurança, realize o login novamente.
            </div>
          )}

          <div className="auth-mode-content">
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>E-mail</span>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setAuthError('');
                  }}
                  placeholder="voce@empresa.com"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="field">
                <span className="field__label-row">
                  <span>Senha</span>
                  <button className="forgot-link" type="button" onClick={() => setIsRecovering(true)}>
                    Esqueceu a senha?
                  </button>
                </span>
                <span className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setAuthError('');
                    }}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    minLength={6}
                    required
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </span>
              </label>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Manter minha sessão ativa</span>
              </label>

              {authError && <p className="auth-error" role="alert">{authError}</p>}
              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Acessando...' : 'Entrar no Cronos'}
                <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '14px', color: 'var(--color-accent)' }} />
              </button>
            </form>
          </div>

          <div className="form-footer">
            <span>© {currentYear} Cronos</span>
            <span>Acesso gerenciado por Administradores</span>
          </div>
        </div>
      </section>
    </main>
  );
}
