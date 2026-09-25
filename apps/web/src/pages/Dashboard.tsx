import Layout from '../components/layout/Layout';
import './Dashboard.css';

function MetricCard({ value, label, detail, tone }: { value: string; label: string; detail: string; tone: string }) {
  return (
    <article className="metric-card">
      <div className="metric-card-top">
        <div className={`metric-icon metric-icon--${tone}`} aria-hidden="true"><span /></div>
        <span className="metric-trend metric-trend--neutral">Agora</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-label">{label}</span>
      <span className="metric-subinfo">{detail}</span>
      <div className="metric-progress-track"><div className={`metric-progress-bar metric-progress-bar--${tone}`} style={{ width: '68%' }} /></div>
    </article>
  );
}

export default function Dashboard() {
  return (
    <Layout activeItem="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <span className="dashboard-header-badge">Visão geral</span>
            <h1 className="dashboard-title">Bom dia, seu espaço está pronto.</h1>
            <p className="dashboard-subtitle">Acompanhe suas automações e tarefas em um só lugar.</p>
          </div>
          <div className="dashboard-header-right">
            <div className="dashboard-status-chip">
              <span className="live-dot" aria-hidden="true" />
              <span className="dashboard-status-chip-content"><span className="status-chip-label">Sistema</span><strong className="status-chip-value">Operacional</strong></span>
            </div>
          </div>
        </header>

        <section className="dashboard-section" aria-labelledby="overview-title">
          <div className="dashboard-section-header">
            <div><h2 className="dashboard-section-title" id="overview-title">Visão geral</h2><p className="dashboard-section-subtitle">Resumo do seu ambiente</p></div>
          </div>
          <div className="metrics-grid">
            <MetricCard value="0" label="Automações ativas" detail="Nenhum fluxo configurado" tone="purple" />
            <MetricCard value="0" label="Tarefas em execução" detail="Tudo tranquilo por aqui" tone="yellow" />
            <MetricCard value="0" label="Execuções hoje" detail="Comece criando uma automação" tone="blue" />
            <MetricCard value="100%" label="Disponibilidade" detail="Sistema operando normalmente" tone="green" />
          </div>
        </section>

        <section className="dashboard-section" aria-labelledby="monitor-title">
          <div className="dashboard-section-header">
            <div><h2 className="dashboard-section-title" id="monitor-title">Monitoramento</h2><p className="dashboard-section-subtitle">Estado atual do ambiente</p></div>
          </div>
          <div className="monitor-grid">
            <article className="monitor-card"><div className="monitor-card-header"><h3 className="monitor-card-title">Disponibilidade</h3><span className="live-indicator"><span className="live-dot" /> Online</span></div><div className="gauge-container"><svg className="gauge-ring" width="128" height="128" viewBox="0 0 128 128" aria-label="Disponibilidade de 100 por cento"><circle className="gauge-bg" cx="64" cy="64" r="48" /><circle className="gauge-fill green" cx="64" cy="64" r="48" strokeDasharray="301.59" strokeDashoffset="0" /></svg><span className="gauge-center"><strong className="gauge-center-value">100%</strong><span className="gauge-center-label">saúde</span></span></div></article>
            <article className="monitor-card"><div className="monitor-card-header"><h3 className="monitor-card-title">Atividade</h3><span className="monitor-card-value">Agora</span></div><div className="monitor-details"><div className="monitor-detail-row"><span className="monitor-detail-label">Automações</span><strong className="monitor-detail-value">Nenhuma</strong></div><div className="monitor-detail-row"><span className="monitor-detail-label">Fila de tarefas</span><strong className="monitor-detail-value">Vazia</strong></div><div className="monitor-detail-row"><span className="monitor-detail-label">Última execução</span><strong className="monitor-detail-value">Nenhuma</strong></div></div></article>
            <article className="monitor-card"><div className="monitor-card-header"><h3 className="monitor-card-title">Próximo passo</h3></div><div className="monitor-details"><p className="dashboard-section-subtitle">Crie sua primeira automação para começar a acompanhar resultados por aqui.</p><button className="submit-button" type="button">Criar automação <span aria-hidden="true">→</span></button></div></article>
          </div>
        </section>

        <section className="dashboard-section activity-section" aria-labelledby="activity-title">
          <div className="dashboard-section-header"><div><h2 className="dashboard-section-title" id="activity-title">Atividade recente</h2><p className="dashboard-section-subtitle">As últimas movimentações do ambiente</p></div></div>
          <div className="activity-table-wrapper"><table className="activity-table"><thead><tr><th className="activity-th">Execução</th><th className="activity-th">Categoria</th><th className="activity-th">Status</th><th className="activity-th">Registro</th></tr></thead><tbody><tr><td className="activity-td activity-td--name"><span className="activity-name">Nenhuma atividade registrada</span><span className="activity-name-sub">Suas execuções aparecerão aqui</span></td><td className="activity-td activity-td--category">--</td><td className="activity-td activity-td--status">--</td><td className="activity-td activity-td--time">--</td></tr></tbody></table></div>
        </section>
      </div>
    </Layout>
  );
}
