import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { SkeletonCard, SkeletonShortcut, SkeletonTableRow } from '../components/ui/Skeleton';
import { Skeleton } from '../components/ui/Skeleton';
import './Dashboard.css';

/* ─── Helpers ─── */

function formatDate(): string {
  const date = new Date();
  const formatted = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/* ─── SVG Icons ─── */

function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function IconList() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" />
    </svg>
  );
}

function IconTrendUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconTrendDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCpu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

function IconMemory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="10" x2="6" y2="14" />
      <line x1="10" y1="10" x2="10" y2="14" />
      <line x1="14" y1="10" x2="14" y2="14" />
      <line x1="18" y1="10" x2="18" y2="14" />
    </svg>
  );
}

function IconHardDrive() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="12" x2="2" y2="12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
      <line x1="6" y1="16" x2="6.01" y2="16" />
      <line x1="10" y1="16" x2="10.01" y2="16" />
    </svg>
  );
}

function IconAutomationSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function IconTaskSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* ─── Types & Data ─── */

interface MetricData {
  id: string;
  value: string;
  label: string;
  subInfo: string;
  progressPercent: number;
  icon: () => ReactNode;
  color: 'purple' | 'yellow' | 'blue' | 'green';
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}

interface ActivityItem {
  id: string;
  name: string;
  description: string;
  type: 'automation' | 'task';
  typeLabel: string;
  status: 'success' | 'running' | 'failed' | 'pending';
  relativeTime: string;
  absoluteTime: string;
}

interface Shortcut {
  id: string;
  label: string;
  description: string;
  icon: () => ReactNode;
  color: 'purple' | 'yellow' | 'blue' | 'green';
}

interface SystemStats {
  cpu: number;
  memory: number;
  memoryUsed: string;
  memoryTotal: string;
  disk: number;
  diskUsed: string;
  diskTotal: string;
  uptime: string;
  processes: number;
  networkIn: string;
  networkOut: string;
}

const MOCK_METRICS: MetricData[] = [
  {
    id: 'automations',
    value: '12',
    label: 'Automações ativas',
    subInfo: '12 de 15 fluxos em operação',
    progressPercent: 80,
    icon: IconBolt,
    color: 'purple',
    trend: 'up',
    trendValue: '+3 nesta semana',
  },
  {
    id: 'tasks',
    value: '8',
    label: 'Tarefas pendentes',
    subInfo: '42 concluídas no dia',
    progressPercent: 62,
    icon: IconClipboard,
    color: 'yellow',
    trend: 'down',
    trendValue: '-2 desde ontem',
  },
  {
    id: 'avg-time',
    value: '2.4 segundos',
    label: 'Tempo médio de resposta',
    subInfo: 'Meta definida em até 3.0 segundos',
    progressPercent: 85,
    icon: IconClock,
    color: 'blue',
    trend: 'neutral',
    trendValue: 'Desempenho estável',
  },
  {
    id: 'success-rate',
    value: '94%',
    label: 'Taxa de disponibilidade',
    subInfo: '998 execuções com êxito',
    progressPercent: 94,
    icon: IconCheck,
    color: 'green',
    trend: 'up',
    trendValue: '+2% neste mês',
  },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    name: 'Sincronização de clientes',
    description: 'Importação automática de cadastros externos',
    type: 'automation',
    typeLabel: 'Automação',
    status: 'success',
    relativeTime: 'Há 5 minutos',
    absoluteTime: '21:02:15',
  },
  {
    id: '2',
    name: 'Backup diário do sistema',
    description: 'Backup incremental da base relacional',
    type: 'task',
    typeLabel: 'Tarefa agendada',
    status: 'running',
    relativeTime: 'Há 12 minutos',
    absoluteTime: '20:55:30',
  },
  {
    id: '3',
    name: 'Notificação por correio eletrônico',
    description: 'Disparo de alertas para o canal de suporte',
    type: 'automation',
    typeLabel: 'Automação',
    status: 'failed',
    relativeTime: 'Há 30 minutos',
    absoluteTime: '20:37:45',
  },
  {
    id: '4',
    name: 'Relatório semanal de desempenho',
    description: 'Consolidação periódica de indicadores',
    type: 'task',
    typeLabel: 'Tarefa agendada',
    status: 'pending',
    relativeTime: 'Há 1 hora',
    absoluteTime: '20:07:00',
  },
  {
    id: '5',
    name: 'Limpeza de cache temporário',
    description: 'Expurgo de arquivos sem utilização',
    type: 'automation',
    typeLabel: 'Automação',
    status: 'success',
    relativeTime: 'Há 2 horas',
    absoluteTime: '19:07:22',
  },
];

const statusLabel: Record<ActivityItem['status'], string> = {
  success: 'Concluído',
  running: 'Executando',
  failed: 'Falha',
  pending: 'Pendente',
};

const SHORTCUTS: Shortcut[] = [
  { id: 'new-automation', label: 'Nova Automação', description: 'Configurar fluxo automatizado', icon: IconPlus, color: 'purple' },
  { id: 'view-tasks', label: 'Ver Tarefas', description: 'Gerenciar fila e agendamentos', icon: IconList, color: 'yellow' },
  { id: 'monitoring', label: 'Monitoramento', description: 'Acompanhar métricas do servidor', icon: IconActivity, color: 'green' },
  { id: 'settings', label: 'Configurações', description: 'Ajustar parâmetros do sistema', icon: IconGear, color: 'blue' },
];

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') return <IconTrendUp />;
  if (trend === 'down') return <IconTrendDown />;
  return <IconMinus />;
}

/* ─── Circular Gauge Component ─── */

function GaugeRing({
  value,
  size = 130,
  strokeWidth = 8,
  color,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  let colorClass = 'purple';
  if (color === 'force-purple') {
    colorClass = 'purple';
  } else if (value < 50) {
    colorClass = 'green';
  } else if (value < 75) {
    colorClass = 'yellow';
  } else {
    colorClass = 'red';
  }

  return (
    <div className="gauge-container">
      <svg className="gauge-ring" width={size} height={size}>
        <circle className="gauge-bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className={`gauge-fill ${colorClass}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-center">
        <span className="gauge-center-value">{value}%</span>
        <span className="gauge-center-label">em uso</span>
      </div>
    </div>
  );
}

function SkeletonMonitor() {
  return (
    <div className="skeleton-monitor" aria-hidden="true">
      <Skeleton width="120px" height="120px" borderRadius="50%" />
      <Skeleton width="80%" height="14px" />
      <Skeleton width="60%" height="12px" />
      <Skeleton width="90%" height="12px" />
    </div>
  );
}

function generateStats(prev?: SystemStats): SystemStats {
  const jitter = (base: number, range: number) =>
    Math.max(1, Math.min(99, base + (Math.random() - 0.5) * range));

  const cpu = prev ? jitter(prev.cpu, 12) : 38 + Math.random() * 25;
  const memory = prev ? jitter(prev.memory, 4) : 58 + Math.random() * 15;
  const disk = prev ? jitter(prev.disk, 1) : 44;

  return {
    cpu: Math.round(cpu),
    memory: Math.round(memory),
    memoryUsed: `${(memory * 0.16).toFixed(1)} Gigabytes`,
    memoryTotal: '16.0 Gigabytes',
    disk: Math.round(disk),
    diskUsed: `${(disk * 5.12).toFixed(0)} Gigabytes`,
    diskTotal: '512 Gigabytes',
    uptime: '14 dias e 6 horas',
    processes: 128 + Math.floor(Math.random() * 12),
    networkIn: `${(1.2 + Math.random() * 2.8).toFixed(1)} Megabits por segundo`,
    networkOut: `${(0.6 + Math.random() * 1.4).toFixed(1)} Megabits por segundo`,
  };
}

/* ─── Dashboard Component ─── */

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats>(() => generateStats());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const updateStats = useCallback(() => {
    setSystemStats((prev) => generateStats(prev));
    setCurrentTime(new Date());
  }, []);

  useEffect(() => {
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, [updateStats]);

  return (
    <div className="dashboard-container">
      {/* Header Premium sem logotipo centralizado */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="dashboard-header-badge">
            <span className="live-dot" />
            <span className="dashboard-header-badge-text">Sistema Operacional em Execução</span>
          </div>
          <h1 className="dashboard-title">Painel de Controle</h1>
          <p className="dashboard-subtitle">
            Visão consolidada do orquestrador • {formatDate()}
          </p>
        </div>

        <div className="dashboard-header-right">
          <div className="dashboard-status-chip">
            <IconShield />
            <div className="dashboard-status-chip-content">
              <span className="status-chip-label">Status da Plataforma</span>
              <span className="status-chip-value">Serviços Estáveis</span>
            </div>
          </div>
        </div>
      </header>

      {/* Cards de Visão Geral Melhorados */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2 className="dashboard-section-title">Visão Geral</h2>
            <p className="dashboard-section-subtitle">
              Métricas e indicadores consolidados de desempenho
            </p>
          </div>
        </div>

        <div className="metrics-grid">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : MOCK_METRICS.map(
                ({
                  id,
                  value,
                  label,
                  subInfo,
                  progressPercent,
                  icon: Icon,
                  color,
                  trend,
                  trendValue,
                }) => (
                  <article className={`metric-card metric-card--${color}`} key={id}>
                    <div className="metric-card-top">
                      <div className={`metric-icon metric-icon--${color}`}>
                        <Icon />
                      </div>
                      <div className={`metric-trend metric-trend--${trend}`}>
                        <TrendIcon trend={trend} />
                        <span>{trendValue}</span>
                      </div>
                    </div>

                    <div className="metric-value">{value}</div>
                    <div className="metric-label">{label}</div>
                    <div className="metric-subinfo">{subInfo}</div>

                    <div className="metric-progress-track">
                      <div
                        className={`metric-progress-bar metric-progress-bar--${color}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </article>
                )
              )}
        </div>
      </section>

      {/* Monitoramento do Sistema */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2 className="dashboard-section-title">Monitoramento do Sistema</h2>
            <p className="dashboard-section-subtitle">
              Recursos de hardware e rede atualizados em tempo real
            </p>
          </div>
          <div className="live-indicator">
            <span className="live-dot" />
            <span>Última atualização às {formatTime(currentTime)}</span>
          </div>
        </div>

        <div className="monitor-grid">
          {isLoading ? (
            <>
              <SkeletonMonitor />
              <SkeletonMonitor />
              <SkeletonMonitor />
            </>
          ) : (
            <>
              {/* Processador */}
              <div className="monitor-card">
                <div className="monitor-card-header">
                  <span className="monitor-card-title">
                    <IconCpu /> Processador
                  </span>
                  <span className="monitor-card-value">{systemStats.cpu}%</span>
                </div>
                <GaugeRing value={systemStats.cpu} />
                <div className="monitor-details">
                  <div className="monitor-detail-row">
                    <span className="monitor-detail-label">Processos ativos</span>
                    <span className="monitor-detail-value">{systemStats.processes} processos</span>
                  </div>
                  <div className="monitor-detail-row">
                    <span className="monitor-detail-label">Tempo em atividade</span>
                    <span className="monitor-detail-value">{systemStats.uptime}</span>
                  </div>
                </div>
              </div>

              {/* Memória RAM */}
              <div className="monitor-card">
                <div className="monitor-card-header">
                  <span className="monitor-card-title">
                    <IconMemory /> Memória RAM
                  </span>
                  <span className="monitor-card-value">
                    {systemStats.memoryUsed}
                  </span>
                </div>
                <GaugeRing value={systemStats.memory} />
                <div className="monitor-details">
                  <div className="monitor-detail-row">
                    <span className="monitor-detail-label">Capacidade instalada</span>
                    <span className="monitor-detail-value">{systemStats.memoryTotal}</span>
                  </div>
                  <div className="monitor-detail-row">
                    <span className="monitor-detail-label">Percentual ocupado</span>
                    <span className="monitor-detail-value">{systemStats.memory}%</span>
                  </div>
                </div>
              </div>

              {/* Armazenamento */}
              <div className="monitor-card">
                <div className="monitor-card-header">
                  <span className="monitor-card-title">
                    <IconHardDrive /> Armazenamento
                  </span>
                  <span className="monitor-card-value">
                    {systemStats.diskUsed}
                  </span>
                </div>
                <GaugeRing value={systemStats.disk} color="force-purple" />
                <div className="monitor-details">
                  <div className="monitor-detail-row">
                    <span className="monitor-detail-label">Tráfego de entrada</span>
                    <span className="monitor-detail-value">{systemStats.networkIn}</span>
                  </div>
                  <div className="monitor-detail-row">
                    <span className="monitor-detail-label">Tráfego de saída</span>
                    <span className="monitor-detail-value">{systemStats.networkOut}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Atalhos Rápidos */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2 className="dashboard-section-title">Atalhos Rápidos</h2>
            <p className="dashboard-section-subtitle">
              Acesso direto às operações prioritárias
            </p>
          </div>
        </div>

        <div className="shortcuts-grid">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonShortcut key={i} />)
            : SHORTCUTS.map(({ id, label, description, icon: Icon, color }) => (
                <button className="shortcut-card" key={id}>
                  <div className={`shortcut-icon shortcut-icon--${color}`}>
                    <Icon />
                  </div>
                  <div className="shortcut-label">
                    <span className="shortcut-label-main">{label}</span>
                    <span className="shortcut-label-sub">{description}</span>
                  </div>
                </button>
              ))}
        </div>
      </section>

      {/* Tabela de Atividade Recente */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2 className="dashboard-section-title">Atividade Recente</h2>
            <p className="dashboard-section-subtitle">
              Registro das últimas execuções realizadas na plataforma
            </p>
          </div>
        </div>

        <div className="activity-section">
          {isLoading ? (
            <div className="skeleton-table" style={{ padding: '24px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} />
              ))}
            </div>
          ) : (
            <div className="activity-table-wrapper">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th className="activity-th activity-th--name">Execução</th>
                    <th className="activity-th activity-th--category">Categoria</th>
                    <th className="activity-th activity-th--status">Status</th>
                    <th className="activity-th activity-th--time">Registro de Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ACTIVITY.map(
                    ({
                      id,
                      name,
                      description,
                      type,
                      typeLabel,
                      status,
                      relativeTime,
                      absoluteTime,
                    }) => (
                      <tr key={id}>
                        <td className="activity-td activity-td--name">
                          <span className="activity-name">{name}</span>
                          <span className="activity-name-sub">{description}</span>
                        </td>
                        <td className="activity-td activity-td--category">
                          <span className="activity-type-badge">
                            {type === 'automation' ? (
                              <IconAutomationSmall />
                            ) : (
                              <IconTaskSmall />
                            )}
                            <span>{typeLabel}</span>
                          </span>
                        </td>
                        <td className="activity-td activity-td--status">
                          <span className={`activity-status activity-status--${status}`}>
                            <span className="status-dot" />
                            <span>{statusLabel[status]}</span>
                          </span>
                        </td>
                        <td className="activity-td activity-td--time">
                          <div className="activity-time-wrap">
                            <span className="activity-time-relative">{relativeTime}</span>
                            <span className="activity-time-absolute">{absoluteTime}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
