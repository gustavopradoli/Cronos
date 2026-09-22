<<<<<<< Updated upstream
import './styles/theme.css';

const modules = [
    ['Frontend', 'Telas, componentes e estilos.', 'apps/web'],
    ['Backend', 'API HTTP e regras de negócio.', 'apps/server'],
    ['WebSocket', 'Eventos e automações em tempo real.', 'apps/realtime'],
    ['Contratos compartilhados', 'Tipos usados por todos os serviços.', 'packages/shared'],
];


export default function App() {
    return (
        <main className="shell">
            <header className="page-header">
                <h1>Orquestrador Cronos</h1>
                <p className="intro">Base do projeto e referência rápida para o desenvolvimento.</p>
            </header>
            <section className="section-heading">
                <div><h2>Onde está cada coisa</h2></div>
            </section>
            <section className="module-grid" aria-label="Módulos do projeto">
                {modules.map(([title, description, path]) => (
                    <article className="module-card" key={title}>
                        <h3>{title}</h3><p>{description}</p><code>{path}</code>
                    </article>
                ))}
            </section>
            <section className="palette-section">
                <div className="section-heading compact">
                    <div><h2>Paleta Cronos</h2></div>
                    <p className="section-note">Os tokens ficam em <code>apps/web/src/styles/theme.css</code>.</p>
                </div>
                <div className="color-grid">
                    {[
                        ['Roxo principal', '#5B21B6', '--color-primary'], ['Amarelo destaque', '#FACC15', '--color-accent'],
                        ['Azul profundo', '#1E1B4B', '--color-ink'], ['Fundo claro', '#F8FAFC', '--color-surface'],
                    ].map(([name, value, token]) => (
                        <div className="color-swatch" key={token} style={{ backgroundColor: value }}>
                            <span>{name}</span><strong>{value}</strong><code>{token}</code>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
=======
import { FormEvent, useEffect, useState } from 'react';
import { BrandMark } from './components/BrandMark';
import Dashboard from './pages/Dashboard';
import './styles/theme.css';

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

const testCredentialsKey = 'cronos.test.credentials';
const currentYear = new Date().getFullYear();

export default function App() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeMessage, setActiveMessage] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');

  const passwordMismatch = isSignUp && confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    const carouselTimer = window.setInterval(() => {
      setActiveMessage((currentMessage) => (currentMessage + 1) % brandMessages.length);
    }, 6000);

    return () => window.clearInterval(carouselTimer);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (isSignUp && password !== confirmPassword) {
      setPasswordError('As senhas precisam ser iguais.');
      return;
    }

    setPasswordError('');
    setAuthError('');

    if (isSignUp) {
      localStorage.setItem(testCredentialsKey, JSON.stringify({ email: normalizedEmail, password }));
      setIsAuthenticated(true);
      return;
    }

    const savedCredentials = localStorage.getItem(testCredentialsKey);
    let credentials: { email: string; password: string } | null = null;

    try {
      credentials = savedCredentials ? JSON.parse(savedCredentials) as { email: string; password: string } : null;
    } catch {
      localStorage.removeItem(testCredentialsKey);
    }

    if (!credentials || credentials.email !== normalizedEmail || credentials.password !== password) {
      setAuthError('E-mail ou senha incorretos.');
      return;
    }

    setIsAuthenticated(true);
  }

  function changeMode(signUp: boolean) {
    setIsSignUp(signUp);
    setShowPassword(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setAuthError('');
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <main className="auth-page">
      <section className="brand-panel" aria-label="Sobre o Cronos">
        <div className="brand-panel__glow brand-panel__glow--top" />
        <div className="brand-panel__glow brand-panel__glow--bottom" />
        <header className="brand-lockup">
          <BrandMark size="small" />
          <span className="brand-lockup__copy"><span className="brand-lockup__name">Cronos</span><span className="brand-lockup__tagline">Orquestrador de automações</span></span>
        </header>
        <div className="brand-panel__content" aria-live="polite">
          <p className="eyebrow">{brandMessages[activeMessage].eyebrow}</p>
          <h1>{brandMessages[activeMessage].title} <em>{brandMessages[activeMessage].emphasis}</em></h1>
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
            <button className={!isSignUp ? 'is-active' : ''} onClick={() => changeMode(false)} role="tab" aria-selected={!isSignUp} type="button">Entrar</button>
            <button className={isSignUp ? 'is-active' : ''} onClick={() => changeMode(true)} role="tab" aria-selected={isSignUp} type="button">Criar conta</button>
          </div>

          <div className="auth-mode-content" key={isSignUp ? 'signup' : 'login'}>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field"><span>E-mail</span><input type="email" name="email" value={email} onChange={(event) => { setEmail(event.target.value); setAuthError(''); }} placeholder="voce@empresa.com" autoComplete="email" required /></label>
              <label className="field">
                <span className="field__label-row"><span>Senha</span>{!isSignUp && <button className="forgot-link" type="button">Esqueceu a senha?</button>}</span>
                <span className="password-input"><input type={showPassword ? 'text' : 'password'} name="password" value={password} onChange={(event) => { setPassword(event.target.value); setPasswordError(''); }} placeholder="Digite sua senha" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={6} required /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></span>
              </label>
              {isSignUp && <label className="field">
                <span>Confirmar senha</span>
                <span className="password-input"><input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setPasswordError(''); }} placeholder="Digite sua senha novamente" autoComplete="new-password" minLength={6} required aria-invalid={passwordMismatch} aria-describedby={passwordMismatch || passwordError ? 'password-error' : undefined} /></span>
                {(passwordMismatch || passwordError) && <span className="field-error" id="password-error">{passwordError || 'As senhas não coincidem.'}</span>}
              </label>}
              {isSignUp && <label className="check-row"><input type="checkbox" required /><span>Concordo com os <button type="button" className="inline-link">termos de uso</button> e a política de privacidade.</span></label>}
              {!isSignUp && <label className="check-row"><input type="checkbox" /><span>Manter minha sessão ativa</span></label>}
              {authError && <p className="auth-error" role="alert">{authError}</p>}
              <button className="submit-button" type="submit">{isSignUp ? 'Criar meu espaço' : 'Entrar no Cronos'}<span aria-hidden="true">→</span></button>
            </form>
          </div>
          <div className="form-footer"><span>© {currentYear} Cronos</span><span>Feito para mover ideias</span></div>
        </div>
      </section>
    </main>
  );
>>>>>>> Stashed changes
}
