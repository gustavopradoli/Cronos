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
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeMessage, setActiveMessage] = useState(0);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordMismatch = isSignUp && confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    const carouselTimer = window.setInterval(() => {
      setActiveMessage((currentMessage) => (currentMessage + 1) % brandMessages.length);
    }, 6000);

    return () => window.clearInterval(carouselTimer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (isSignUp && password !== confirmPassword) {
      setPasswordError('As senhas precisam ser iguais.');
      return;
    }

    setPasswordError('');
    setAuthError('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await register(normalizedEmail, password, nome.trim() || undefined);
      } else {
        await login(normalizedEmail, password, rememberMe);
      }
      onAuthenticated?.();
    } catch (err: any) {
      setAuthError(err.message || 'Falha ao autenticar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(signUp: boolean) {
    setIsSignUp(signUp);
    setShowPassword(false);
    setNome('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setAuthError('');
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
            <span className="form-heading__kicker">{isSignUp ? 'Comece agora' : 'Bem-vindo de volta'}</span>
            <h2>{isSignUp ? 'Crie seu espaço.' : 'Entre no seu espaço.'}</h2>
            <p>{isSignUp ? 'Organize seu trabalho em um só lugar.' : 'Continue de onde você parou.'}</p>
          </div>
          <div className="auth-switcher" role="tablist" aria-label="Tipo de acesso">
            <span className={`auth-switcher__thumb ${isSignUp ? 'is-signup' : ''}`} aria-hidden="true" />
            <button
              className={!isSignUp ? 'is-active' : ''}
              onClick={() => changeMode(false)}
              role="tab"
              aria-selected={!isSignUp}
              type="button"
            >
              Entrar
            </button>
            <button
              className={isSignUp ? 'is-active' : ''}
              onClick={() => changeMode(true)}
              role="tab"
              aria-selected={isSignUp}
              type="button"
            >
              Criar conta
            </button>
          </div>

          <div className="auth-mode-content" key={isSignUp ? 'signup' : 'login'}>
            <form className="auth-form" onSubmit={handleSubmit}>
              {isSignUp && (
                <label className="field">
                  <span>Nome completo</span>
                  <input
                    type="text"
                    name="nome"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                  />
                </label>
              )}
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
                  {!isSignUp && (
                    <button className="forgot-link" type="button" onClick={() => setIsRecovering(true)}>
                      Esqueceu a senha?
                    </button>
                  )}
                </span>
                <span className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Digite sua senha"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
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
              {isSignUp && (
                <label className="field">
                  <span>Confirmar senha</span>
                  <span className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setPasswordError('');
                      }}
                      placeholder="Digite sua senha novamente"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      aria-invalid={passwordMismatch}
                      aria-describedby={passwordMismatch || passwordError ? 'password-error' : undefined}
                    />
                  </span>
                  {(passwordMismatch || passwordError) && (
                    <span className="field-error" id="password-error">
                      {passwordError || 'As senhas não coincidem.'}
                    </span>
                  )}
                </label>
              )}
              {isSignUp && (
                <label className="check-row">
                  <input type="checkbox" required />
                  <span>
                    Concordo com os <button type="button" className="inline-link">termos de uso</button> e a política de privacidade.
                  </span>
                </label>
              )}
              {!isSignUp && (
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Manter minha sessão ativa</span>
                </label>
              )}
              {authError && <p className="auth-error" role="alert">{authError}</p>}
              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Acessando...' : isSignUp ? 'Cadastrar' : 'Entrar no Cronos'}
                <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '14px', color: 'var(--color-accent)' }} />
              </button>
            </form>

            {!isSignUp && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.85rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                  color: '#94a3b8',
                }}
              >
                <div>
                  <span style={{ display: 'block', color: '#f8fafc', fontWeight: 600, marginBottom: '2px' }}>
                    Usuário Padrão:
                  </span>
                  <span>admin@cronos.com / admin123</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@cronos.com');
                    setPassword('admin123');
                    setAuthError('');
                  }}
                  style={{
                    background: 'rgba(124, 58, 237, 0.25)',
                    border: '1px solid rgba(124, 58, 237, 0.5)',
                    color: '#c4b5fd',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  Preencher
                </button>
              </div>
            )}
          </div>
          <div className="form-footer">
            <span>© {currentYear} Cronos</span>
            <span>Feito para mover ideias</span>
          </div>
        </div>
      </section>
    </main>
  );
}
