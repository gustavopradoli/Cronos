import './styles/theme.css';
import { OrchestratorScreen } from './tela_orquestrador/OrchestratorScreen';

const modules = [
  ['Frontend', 'Telas, componentes e estilos.', 'apps/web'],
  ['Backend', 'API HTTP e regras de negocio.', 'apps/server'],
  ['WebSocket', 'Eventos e automacoes em tempo real.', 'apps/realtime'],
  ['Contratos compartilhados', 'Tipos usados por todos os servicos.', 'packages/shared'],
];

function HomeScreen() {
  return (
    <main className="shell">
      <header className="page-header">
        <h1>Orquestrador Cronos</h1>
        <p className="intro">Base do projeto e referencia rapida para o desenvolvimento.</p>
      </header>
      <section className="section-heading">
        <div><h2>Onde esta cada coisa</h2></div>
      </section>
      <section className="module-grid" aria-label="Modulos do projeto">
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
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  if (path === '/orquestrador') {
    return <OrchestratorScreen />;
  }

  return <HomeScreen />;
}
