import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot,
  faPlay,
  faHistory,
  faShieldHalved,
  faArrowRight,
  faCircleCheck,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { apiRequest } from '../services/api';
import './Dashboard.css';

interface MetricCardProps {
  value: string | number;
  label: string;
  detail: string;
  tone: 'purple' | 'yellow' | 'blue' | 'green';
  icon: IconDefinition;
}

function MetricCard({ value, label, detail, tone, icon }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card-top">
        <div className={`metric-icon metric-icon--${tone}`} aria-hidden="true">
          <FontAwesomeIcon icon={icon} />
        </div>
        <span className="metric-trend metric-trend--neutral">Agora</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-label">{label}</span>
      <span className="metric-subinfo">{detail}</span>
      <div className="metric-progress-track">
        <div className={`metric-progress-bar metric-progress-bar--${tone}`} style={{ width: '75%' }} />
      </div>
    </article>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    automacoes: 0,
    executando: 0,
    hoje: 0,
    disponibilidade: '100%',
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [autos, hist] = await Promise.all([
          apiRequest<any[]>('/automacoes').catch(() => []),
          apiRequest<{ items: any[]; total: number }>('/historico?limit=50').catch(() => ({ items: [], total: 0 })),
        ]);

        const autoList = autos || [];
        const histItems = hist?.items || [];
        const running = histItems.filter((h: any) => h.status === 'em_execucao').length;

        setStats({
          automacoes: autoList.length,
          executando: running,
          hoje: hist?.total || 0,
          disponibilidade: '100%',
        });
      } catch (err) {
        console.error('Erro ao carregar estatísticas do dashboard:', err);
      }
    }
    loadStats();
  }, []);

  const handleNavigateAutomacoes = () => {
    window.history.pushState({}, '', '/automacoes');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <Layout activeItem="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <span className="dashboard-header-badge">
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '12px', marginRight: '4px' }} />
              Visão geral
            </span>
            <h1 className="dashboard-title">Bom dia, seu espaço está pronto.</h1>
            <p className="dashboard-subtitle">Acompanhe suas automações e tarefas em um só lugar.</p>
          </div>
          <div className="dashboard-header-right">
            <div className="dashboard-status-chip">
              <span className="live-dot" aria-hidden="true" />
              <span className="dashboard-status-chip-content">
                <span className="status-chip-label">Sistema</span>
                <strong className="status-chip-value">Operacional</strong>
              </span>
            </div>
          </div>
        </header>

        <section className="dashboard-section" aria-labelledby="overview-title">
          <div className="dashboard-section-header">
            <div>
              <h2 className="dashboard-section-title" id="overview-title">Visão geral</h2>
              <p className="dashboard-section-subtitle">Resumo do seu ambiente</p>
            </div>
          </div>
          <div className="metrics-grid">
            <MetricCard
              value={stats.automacoes}
              label="Automações ativas"
              detail={stats.automacoes > 0 ? `${stats.automacoes} fluxos cadastrados` : 'Nenhum fluxo configurado'}
              tone="purple"
              icon={faRobot}
            />
            <MetricCard
              value={stats.executando}
              label="Tarefas em execução"
              detail={stats.executando > 0 ? `${stats.executando} robôs rodando agora` : 'Tudo tranquilo por aqui'}
              tone="yellow"
              icon={faPlay}
            />
            <MetricCard
              value={stats.hoje}
              label="Total no Histórico"
              detail={stats.hoje > 0 ? `${stats.hoje} execuções registradas` : 'Comece criando uma automação'}
              tone="blue"
              icon={faHistory}
            />
            <MetricCard
              value={stats.disponibilidade}
              label="Disponibilidade"
              detail="Sistema operando normalmente"
              tone="green"
              icon={faShieldHalved}
            />
          </div>
        </section>

        <section className="dashboard-section" aria-labelledby="monitor-title">
          <div className="dashboard-section-header">
            <div>
              <h2 className="dashboard-section-title" id="monitor-title">Monitoramento</h2>
              <p className="dashboard-section-subtitle">Estado atual do ambiente</p>
            </div>
          </div>
          <div className="monitor-grid">
            <article className="monitor-card">
              <div className="monitor-card-header">
                <h3 className="monitor-card-title">Disponibilidade</h3>
                <span className="live-indicator"><span className="live-dot" /> Online</span>
              </div>
              <div className="gauge-container">
                <svg className="gauge-ring" width="128" height="128" viewBox="0 0 128 128" aria-label="Disponibilidade de 100 por cento">
                  <circle className="gauge-bg" cx="64" cy="64" r="48" />
                  <circle className="gauge-fill green" cx="64" cy="64" r="48" strokeDasharray="301.59" strokeDashoffset="0" />
                </svg>
                <span className="gauge-center">
                  <strong className="gauge-center-value">100%</strong>
                  <span className="gauge-center-label">saúde</span>
                </span>
              </div>
            </article>

            <article className="monitor-card">
              <div className="monitor-card-header">
                <h3 className="monitor-card-title">Atividade</h3>
                <span className="monitor-card-value">Agora</span>
              </div>
              <div className="monitor-details">
                <div className="monitor-detail-row">
                  <span className="monitor-detail-label">Automações</span>
                  <strong className="monitor-detail-value">{stats.automacoes > 0 ? `${stats.automacoes} registradas` : 'Nenhuma'}</strong>
                </div>
                <div className="monitor-detail-row">
                  <span className="monitor-detail-label">Fila de tarefas</span>
                  <strong className="monitor-detail-value">{stats.executando > 0 ? `${stats.executando} em andamento` : 'Vazia'}</strong>
                </div>
                <div className="monitor-detail-row">
                  <span className="monitor-detail-label">Total histórico</span>
                  <strong className="monitor-detail-value">{stats.hoje > 0 ? `${stats.hoje} execuções` : 'Nenhuma'}</strong>
                </div>
              </div>
            </article>

            <article className="monitor-card">
              <div className="monitor-card-header">
                <h3 className="monitor-card-title">Próximo passo</h3>
              </div>
              <div className="monitor-details">
                <p className="dashboard-section-subtitle">
                  Crie sua primeira automação ou configure gatilhos para começar a acompanhar resultados por aqui.
                </p>
                <button className="submit-button" type="button" onClick={handleNavigateAutomacoes}>
                  <span>Criar automação</span>
                  <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '13px', marginLeft: '8px' }} />
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="dashboard-section activity-section" aria-labelledby="activity-title">
          <div className="dashboard-section-header">
            <div>
              <h2 className="dashboard-section-title" id="activity-title">Atividade recente</h2>
              <p className="dashboard-section-subtitle">As últimas movimentações do ambiente</p>
            </div>
          </div>
          <div className="activity-table-wrapper">
            <table className="activity-table">
              <thead>
                <tr>
                  <th className="activity-th">Execução</th>
                  <th className="activity-th">Categoria</th>
                  <th className="activity-th">Status</th>
                  <th className="activity-th">Registro</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="activity-td activity-td--name">
                    <span className="activity-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faLayerGroup} style={{ color: 'var(--color-primary)' }} />
                      Auditoria centralizada
                    </span>
                    <span className="activity-name-sub">Acesse a tela de Histórico para auditar logs completos</span>
                  </td>
                  <td className="activity-td activity-td--category">Geral</td>
                  <td className="activity-td activity-td--status">
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Ativo</span>
                  </td>
                  <td className="activity-td activity-td--time">Tempo real</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
}
