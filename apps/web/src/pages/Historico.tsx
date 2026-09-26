import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { StatusHistorico } from '@cronos/shared';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTriangleExclamation,
  faStop,
  faDesktop,
  faClock,
  faBolt,
  faRotate,
  faCopy,
  faCheck,
  faTimes,
  faFilter,
  faSearch,
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
  faCircleCheck,
  faCircleXmark,
  faHand,
  faHistory,
  faHourglassHalf,
  faTerminal,
  faArrowsRotate,
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import { apiRequest } from '../services/api';
import { confirmAction, showError } from '../utils/dialogs';
import './Historico.css';

interface HistoricoItemCompleto {
  id: number;
  automacao_id: number;
  automacao_nome: string;
  departamento: string;
  maquina_id?: number | null;
  maquina_nome?: string | null;
  gatilho_id?: number | null;
  gatilho_tipo?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  status: StatusHistorico;
  erro?: string | null;
  tipo: 'manual' | 'gatilho';
  criado_em: string;
}

function formatDate(isoStr?: string | null): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

function calculateDuration(inicioStr?: string | null, fimStr?: string | null): string {
  if (!inicioStr) return '—';
  try {
    const start = new Date(inicioStr).getTime();
    if (isNaN(start)) return '—';
    const end = fimStr ? new Date(fimStr).getTime() : Date.now();
    const diffSec = Math.max(0, Math.floor((end - start) / 1000));

    if (!fimStr) {
      if (diffSec < 60) return `${diffSec}s`;
      const min = Math.floor(diffSec / 60);
      const sec = diffSec % 60;
      return `${min}m ${sec}s`;
    }

    if (diffSec < 60) return `${diffSec}s`;
    const min = Math.floor(diffSec / 60);
    const sec = diffSec % 60;
    if (min < 60) return `${min}m ${sec}s`;
    const hours = Math.floor(min / 60);
    const remMin = min % 60;
    return `${hours}h ${remMin}m`;
  } catch {
    return '—';
  }
}

function getStatusBadge(status: StatusHistorico) {
  switch (status) {
    case 'sucesso':
      return { className: 'status-completed', label: 'Sucesso', icon: faCircleCheck };
    case 'em_execucao':
      return { className: 'status-running', label: 'Em execução', icon: faArrowsRotate, spin: true };
    case 'erro':
      return { className: 'status-error', label: 'Falha / Erro', icon: faCircleXmark };
    case 'parado':
      return { className: 'status-parado', label: 'Parado', icon: faHand };
    case 'pendente':
    default:
      return { className: 'status-unknown', label: 'Pendente', icon: faClock };
  }
}

export default function Historico() {
  const [items, setItems] = useState<HistoricoItemCompleto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stoppingId, setStoppingId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal de Detalhes do Erro
  const [errorModalItem, setErrorModalItem] = useState<HistoricoItemCompleto | null>(null);
  const [copiedError, setCopiedError] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchHistorico = useCallback(async (isManualRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isManualRefresh) setIsRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (departmentFilter) params.append('departamento', departmentFilter);
      if (startDate) params.append('data_inicio', startDate);
      if (endDate) params.append('data_fim', endDate);

      params.append('limit', String(itemsPerPage));
      params.append('offset', String((currentPage - 1) * itemsPerPage));

      const res = await apiRequest<{ items: HistoricoItemCompleto[]; total: number }>(
        `/historico?${params.toString()}`
      );

      setItems(res?.items || []);
      setTotal(res?.total || 0);
    } catch (err: any) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [searchTerm, statusFilter, departmentFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  // Polling automático a cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      fetchHistorico(false);
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchHistorico]);

  // Contadores analíticos para os KPI cards baseados no lote atual
  const summaryStats = useMemo(() => {
    let sucessos = 0;
    let emExecucao = 0;
    let erros = 0;
    let parados = 0;

    items.forEach((item) => {
      if (item.status === 'sucesso') sucessos++;
      else if (item.status === 'em_execucao') emExecucao++;
      else if (item.status === 'erro' || item.erro) erros++;
      else if (item.status === 'parado') parados++;
    });

    const taxaSucesso = total > 0 ? Math.round((sucessos / Math.max(1, items.length)) * 100) : 100;

    return { sucessos, emExecucao, erros, parados, taxaSucesso };
  }, [items, total]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHistorico(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDepartmentFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleCopyError = (msg?: string | null) => {
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2000);
  };

  // Parada forçada da execução
  const handleStopExecution = async (item: HistoricoItemCompleto) => {
    const confirmed = await confirmAction({
      title: 'Interromper Execução',
      text: `Deseja interromper forçadamente a execução #${item.id} de "${item.automacao_nome}"?`,
      confirmText: 'Sim, interromper',
      isDestructive: true,
    });
    if (!confirmed) {
      return;
    }

    setStoppingId(item.id);
    try {
      await apiRequest('/execucoes/interromper', {
        method: 'POST',
        body: JSON.stringify({ historico_id: item.id }),
      });

      setFeedbackMsg(`Execução #${item.id} interrompida com sucesso.`);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'parado', erro: 'Interrompido manualmente pelo operador', data_fim: new Date().toISOString() }
            : i
        )
      );
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err: any) {
      showError('Erro ao interromper execução', err.message);
    } finally {
      setStoppingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const hasActiveFilters = Boolean(searchTerm || statusFilter || departmentFilter || startDate || endDate);

  return (
    <div className="history-container">
      {/* Header Premium com Live Indicator */}
      <header className="history-header">
        <div className="history-header-left">
          <div className="history-badge">
            <FontAwesomeIcon icon={faHistory} />
            <span>Auditoria & Execuções</span>
          </div>
          <h1 className="history-title">Histórico de Execuções</h1>
          <p className="history-subtitle">
            Auditoria em tempo real de disparos manuais e agendamentos executados pelos runners clientes.
          </p>
        </div>

        <div className="history-header-actions">
          <div className="history-live-chip">
            <span className="history-live-dot" />
            <span>Monitoramento Ativo</span>
          </div>

          <button
            className="ghost-button"
            type="button"
            onClick={() => fetchHistorico(true)}
            disabled={isRefreshing}
            title="Atualizar dados agora"
          >
            <FontAwesomeIcon icon={faRotate} spin={isRefreshing} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </header>

      {/* Alerta de Feedback */}
      {feedbackMsg && (
        <div className="history-alert success" role="status">
          <FontAwesomeIcon icon={faCheck} />
          <span>{feedbackMsg}</span>
          <button type="button" onClick={() => setFeedbackMsg('')} aria-label="Fechar">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* KPI Cards de Resumo */}
      <section className="history-kpis" aria-label="Resumo do Histórico">
        <article className="history-kpi-card total">
          <div className="history-kpi-icon">
            <FontAwesomeIcon icon={faHistory} />
          </div>
          <div className="history-kpi-content">
            <span className="history-kpi-label">Total de Execuções</span>
            <strong className="history-kpi-value">{total}</strong>
            <span className="history-kpi-sub">Registros no banco de dados</span>
          </div>
        </article>

        <article className="history-kpi-card success">
          <div className="history-kpi-icon">
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>
          <div className="history-kpi-content">
            <span className="history-kpi-label">Sucesso (nesta página)</span>
            <strong className="history-kpi-value">{summaryStats.sucessos}</strong>
            <span className="history-kpi-sub">{summaryStats.taxaSucesso}% de taxa de sucesso</span>
          </div>
        </article>

        <article className="history-kpi-card running">
          <div className="history-kpi-icon">
            <FontAwesomeIcon icon={faHourglassHalf} />
          </div>
          <div className="history-kpi-content">
            <span className="history-kpi-label">Em Execução Agora</span>
            <strong className="history-kpi-value">{summaryStats.emExecucao}</strong>
            <span className="history-kpi-sub">
              {summaryStats.emExecucao > 0 ? 'Processos ativos no runner' : 'Nenhum processo ativo'}
            </span>
          </div>
        </article>

        <article className="history-kpi-card error">
          <div className="history-kpi-icon">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <div className="history-kpi-content">
            <span className="history-kpi-label">Falhas / Erros</span>
            <strong className="history-kpi-value">{summaryStats.erros}</strong>
            <span className="history-kpi-sub">Clique no ícone circular para inspecionar</span>
          </div>
        </article>
      </section>

      {/* Barra de Filtros Rápida por Status */}
      <div className="history-status-tabs" role="tablist" aria-label="Filtrar por status">
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === ''}
          className={`history-tab ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => { setStatusFilter(''); setCurrentPage(1); }}
        >
          <span>Todos</span>
          <span className="history-tab-count">{total}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'em_execucao'}
          className={`history-tab tab-running ${statusFilter === 'em_execucao' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('em_execucao'); setCurrentPage(1); }}
        >
          <FontAwesomeIcon icon={faCircle} style={{ fontSize: '7px' }} />
          <span>Em execução</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'sucesso'}
          className={`history-tab tab-success ${statusFilter === 'sucesso' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('sucesso'); setCurrentPage(1); }}
        >
          <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '11px' }} />
          <span>Sucesso</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'erro'}
          className={`history-tab tab-error ${statusFilter === 'erro' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('erro'); setCurrentPage(1); }}
        >
          <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '11px' }} />
          <span>Erros</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'parado'}
          className={`history-tab tab-parado ${statusFilter === 'parado' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('parado'); setCurrentPage(1); }}
        >
          <FontAwesomeIcon icon={faHand} style={{ fontSize: '11px' }} />
          <span>Parados</span>
        </button>
      </div>

      {/* Filtros Avançados */}
      <form className="history-filters" onSubmit={handleFilterSubmit} aria-label="Filtros avançados do histórico">
        <div className="history-filter history-filter-search">
          <label htmlFor="history-search">Buscar Execução</label>
          <div className="history-input-with-icon">
            <FontAwesomeIcon icon={faSearch} className="history-input-icon" />
            <input
              id="history-search"
              type="search"
              placeholder="Nome da automação, máquina ou erro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="history-filter">
          <label htmlFor="history-status">Status</label>
          <select
            id="history-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="em_execucao">Em execução</option>
            <option value="sucesso">Sucesso</option>
            <option value="erro">Erro</option>
            <option value="parado">Parado</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>

        <div className="history-filter">
          <label htmlFor="history-department">Departamento</label>
          <select
            id="history-department"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="Tecnologia">Tecnologia</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Operações">Operações</option>
            <option value="Comercial">Comercial</option>
            <option value="Fiscal">Fiscal</option>
            <option value="Jurídico">Jurídico</option>
            <option value="Recursos Humanos">Recursos Humanos</option>
          </select>
        </div>

        <div className="history-filter">
          <label htmlFor="history-start-date">Data Inicial</label>
          <input
            id="history-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          >
          </input>
        </div>

        <div className="history-filter">
          <label htmlFor="history-end-date">Data Final</label>
          <input
            id="history-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="history-filter-actions">
          <button className="primary-button" type="submit" title="Aplicar filtros">
            <FontAwesomeIcon icon={faFilter} />
            <span>Filtrar</span>
          </button>

          {hasActiveFilters && (
            <button
              className="ghost-button"
              type="button"
              onClick={handleClearFilters}
              title="Limpar todos os filtros"
            >
              <FontAwesomeIcon icon={faTimes} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </form>

      {/* Tabela de Execuções */}
      <section className="history-table-section">
        <table className="history-table">
          <thead>
            <tr>
              <th style={{ width: '70px' }}>ID</th>
              <th>Automação</th>
              <th>Máquina Runner</th>
              <th>Origem</th>
              <th>Início</th>
              <th>Término</th>
              <th>Duração</th>
              <th>Status</th>
              <th style={{ textAlign: 'center', width: '90px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const badge = getStatusBadge(item.status);
              const isErro = item.status === 'erro' || Boolean(item.erro);
              const isRunning = item.status === 'em_execucao';
              const duration = calculateDuration(item.data_inicio, item.data_fim);

              return (
                <tr key={item.id} className={isRunning ? 'row-running' : isErro ? 'row-error' : ''}>
                  <td>
                    <span className="history-id">#{item.id}</span>
                  </td>
                  <td>
                    <div className="history-auto-cell">
                      <strong className="history-auto-name">{item.automacao_nome}</strong>
                      <span className="history-auto-dept">{item.departamento}</span>
                    </div>
                  </td>
                  <td>
                    {item.maquina_nome ? (
                      <span className="history-machine-tag">
                        <FontAwesomeIcon icon={faDesktop} />
                        <span>{item.maquina_nome}</span>
                      </span>
                    ) : (
                      <span className="history-machine-none">Não atribuída</span>
                    )}
                  </td>
                  <td>
                    <span className={`history-origin-pill ${item.tipo === 'gatilho' ? 'trigger' : 'manual'}`}>
                      <FontAwesomeIcon icon={item.tipo === 'gatilho' ? faClock : faBolt} />
                      <span>{item.tipo === 'gatilho' ? 'Gatilho' : 'Manual'}</span>
                    </span>
                  </td>
                  <td>
                    <span className="history-time">{formatDate(item.data_inicio)}</span>
                  </td>
                  <td>
                    <span className="history-time">{formatDate(item.data_fim)}</span>
                  </td>
                  <td>
                    <span className={`history-duration ${isRunning ? 'running' : ''}`}>
                      {isRunning && <span className="history-duration-dot" />}
                      {duration}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${badge.className}`}>
                      <FontAwesomeIcon icon={badge.icon} spin={badge.spin} style={{ marginRight: '6px' }} />
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="history-row-actions">
                      {/* BOTÃO CIRCULAR DE VISUALIZAR O ERRO (PERFEITO CÍRCULO) */}
                      {isErro && (
                        <button
                          type="button"
                          className="btn-error-circle"
                          onClick={() => setErrorModalItem(item)}
                          title="Clique para inspecionar os detalhes do erro"
                          aria-label="Ver detalhes do erro"
                        >
                          <FontAwesomeIcon icon={faTriangleExclamation} />
                        </button>
                      )}

                      {/* Botão de Parada de Execução */}
                      {isRunning && (
                        <button
                          type="button"
                          className="btn-stop-execution"
                          onClick={() => handleStopExecution(item)}
                          disabled={stoppingId === item.id}
                          title="Interromper processo em execução"
                        >
                          <FontAwesomeIcon icon={faStop} />
                          <span>{stoppingId === item.id ? 'Parando...' : 'Parar'}</span>
                        </button>
                      )}

                      {!isErro && !isRunning && (
                        <span className="history-no-action">
                          <FontAwesomeIcon icon={faCheck} style={{ color: '#cbd5e1', fontSize: '11px' }} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!isLoading && items.length === 0 && (
              <tr>
                <td className="history-empty" colSpan={9}>
                  <div className="history-empty-content">
                    <FontAwesomeIcon icon={faHistory} className="history-empty-icon" />
                    <strong>Nenhuma execução encontrada</strong>
                    <p>Tente ajustar os filtros de busca ou aguarde um novo disparo de automação.</p>
                    {hasActiveFilters && (
                      <button className="ghost-button" type="button" onClick={handleClearFilters}>
                        <FontAwesomeIcon icon={faTimes} />
                        <span>Limpar Filtros</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Paginação */}
      <nav className="history-pagination" aria-label="Paginação do histórico">
        <div className="history-pagination-info">
          Mostrando <strong>{items.length}</strong> de <strong>{total}</strong> execuções registradas
          {totalPages > 1 && <span> • Página {currentPage} de {totalPages}</span>}
        </div>

        <div className="history-pagination-actions">
          <button
            className="history-pagination-button"
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            title="Primeira página"
          >
            <FontAwesomeIcon icon={faAnglesLeft} />
          </button>
          <button
            className="history-pagination-button"
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Página anterior"
          >
            <FontAwesomeIcon icon={faAngleLeft} />
          </button>

          <span className="history-pagination-current">
            {currentPage}
          </span>

          <button
            className="history-pagination-button"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Próxima página"
          >
            <FontAwesomeIcon icon={faAngleRight} />
          </button>
          <button
            className="history-pagination-button"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="Última página"
          >
            <FontAwesomeIcon icon={faAnglesRight} />
          </button>
        </div>
      </nav>

      {/* Modal Moderno de Detalhes do Erro */}
      {errorModalItem && (
        <div className="modal-backdrop" role="presentation" onClick={() => setErrorModalItem(null)}>
          <div
            className="error-modal-box"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="error-modal-header">
              <div className="error-modal-title">
                <div className="error-modal-title-icon">
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                </div>
                <div>
                  <h3>Falha na Execução #{errorModalItem.id}</h3>
                  <span className="error-modal-subtitle">{errorModalItem.automacao_nome}</span>
                </div>
              </div>
              <button
                type="button"
                className="error-modal-close"
                onClick={() => setErrorModalItem(null)}
                aria-label="Fechar"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="error-modal-meta-grid">
              <div className="error-meta-item">
                <span className="error-meta-label">Automação:</span>
                <strong className="error-meta-value">{errorModalItem.automacao_nome}</strong>
              </div>
              <div className="error-meta-item">
                <span className="error-meta-label">Departamento:</span>
                <strong className="error-meta-value">{errorModalItem.departamento}</strong>
              </div>
              <div className="error-meta-item">
                <span className="error-meta-label">Máquina Runner:</span>
                <strong className="error-meta-value">
                  {errorModalItem.maquina_nome || 'Não informada'}
                </strong>
              </div>
              <div className="error-meta-item">
                <span className="error-meta-label">Disparo:</span>
                <strong className="error-meta-value">
                  {errorModalItem.tipo === 'gatilho' ? 'Gatilho Automático' : 'Disparo Manual'}
                </strong>
              </div>
              <div className="error-meta-item">
                <span className="error-meta-label">Início da Execução:</span>
                <span className="error-meta-value">{formatDate(errorModalItem.data_inicio)}</span>
              </div>
              <div className="error-meta-item">
                <span className="error-meta-label">Término / Falha:</span>
                <span className="error-meta-value">{formatDate(errorModalItem.data_fim)}</span>
              </div>
            </div>

            <div className="error-terminal-section">
              <div className="error-terminal-header">
                <div className="error-terminal-title">
                  <FontAwesomeIcon icon={faTerminal} />
                  <span>Log de Erro / Stacktrace Capturado</span>
                </div>
                <button
                  type="button"
                  className="error-copy-btn"
                  onClick={() => handleCopyError(errorModalItem.erro)}
                >
                  <FontAwesomeIcon icon={copiedError ? faCheck : faCopy} />
                  <span>{copiedError ? 'Copiado!' : 'Copiar Log'}</span>
                </button>
              </div>
              <div className="error-code-block">
                {errorModalItem.erro || 'Nenhuma mensagem de log detalhada foi informada pelo executável cliente.'}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                className="ghost-button"
                type="button"
                onClick={() => handleCopyError(errorModalItem.erro)}
              >
                <FontAwesomeIcon icon={copiedError ? faCheck : faCopy} />
                <span>{copiedError ? 'Log Copiado!' : 'Copiar Mensagem'}</span>
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => setErrorModalItem(null)}
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}