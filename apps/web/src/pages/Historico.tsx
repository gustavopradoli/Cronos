import { useEffect, useState, useCallback, useRef } from 'react';
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
} from '@fortawesome/free-solid-svg-icons';
import { apiRequest } from '../services/api';
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

function getStatusBadge(status: StatusHistorico) {
  switch (status) {
    case 'sucesso':
      return { className: 'status-completed', label: 'Sucesso' };
    case 'em_execucao':
      return { className: 'status-running', label: 'Em execução' };
    case 'erro':
      return { className: 'status-error', label: 'Erro' };
    case 'parado':
      return { className: 'status-parado', label: 'Parado' };
    case 'pendente':
    default:
      return { className: 'status-unknown', label: 'Pendente' };
  }
}

export default function Historico() {
  const [items, setItems] = useState<HistoricoItemCompleto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchHistorico = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
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
      isFetchingRef.current = false;
    }
  }, [searchTerm, statusFilter, departmentFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  // Polling a cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      fetchHistorico();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchHistorico]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHistorico();
  };

  const handleCopyError = (msg?: string | null) => {
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2000);
  };

  // Parada forçada da execução
  const handleStopExecution = async (item: HistoricoItemCompleto) => {
    if (!window.confirm(`Deseja interromper forçadamente a execução #${item.id} de "${item.automacao_nome}"?`)) {
      return;
    }

    setStoppingId(item.id);
    try {
      await apiRequest('/execucoes/interromper', {
        method: 'POST',
        body: JSON.stringify({ historico_id: item.id }),
      });

      setFeedbackMsg(`Execução #${item.id} interrompida com sucesso.`);
      // Atualiza imediatamente na tela
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'parado', erro: 'Interrompido manualmente pelo operador', data_fim: new Date().toISOString() }
            : i
        )
      );
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err: any) {
      alert(`Erro ao interromper execução: ${err.message}`);
    } finally {
      setStoppingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="history-container">
      <header className="history-header">
        <div>
          <h1 className="history-title">Histórico de Execuções</h1>
          <p className="history-subtitle">
            Auditoria em tempo real de disparos manuais e agendamentos executados pelos runners.
          </p>
        </div>
        <div>
          <button
            className="ghost-button"
            type="button"
            onClick={fetchHistorico}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FontAwesomeIcon icon={faRotate} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {feedbackMsg && (
        <div className="success-alert" style={{ margin: '0 32px 16px' }} role="status">
          <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
          {feedbackMsg}
        </div>
      )}

      {/* Barra de Filtros */}
      <form className="history-filters" onSubmit={handleFilterSubmit} aria-label="Filtros do histórico">
        <div className="history-filter history-filter-search">
          <label htmlFor="history-search">Pesquisar</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FontAwesomeIcon
              icon={faSearch}
              style={{ position: 'absolute', left: '12px', color: '#94a3b8', fontSize: '12px' }}
            />
            <input
              id="history-search"
              type="search"
              style={{ paddingLeft: '32px' }}
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
          <label htmlFor="history-start-date">Data inicial</label>
          <input
            id="history-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="history-filter">
          <label htmlFor="history-end-date">Data final</label>
          <input
            id="history-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
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

        <button className="history-filter-button" type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <FontAwesomeIcon icon={faFilter} />
          <span>Filtrar</span>
        </button>
      </form>

      {/* Tabela de Execuções */}
      <section className="history-table-section">
        <table className="history-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Automação</th>
              <th>Máquina Runner</th>
              <th>Departamento</th>
              <th>Origem</th>
              <th>Início</th>
              <th>Término</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const badge = getStatusBadge(item.status);
              const isErro = item.status === 'erro' || Boolean(item.erro);
              const isRunning = item.status === 'em_execucao';

              return (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>
                    <strong>{item.automacao_nome}</strong>
                  </td>
                  <td>
                    {item.maquina_nome ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FontAwesomeIcon icon={faDesktop} style={{ color: 'var(--color-primary)' }} />
                        {item.maquina_nome}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Não atribuída</span>
                    )}
                  </td>
                  <td>{item.departamento}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: item.tipo === 'gatilho' ? '#f5f3ff' : '#f8fafc',
                        color: item.tipo === 'gatilho' ? '#5b21b6' : '#475569',
                        fontWeight: 600,
                      }}
                    >
                      <FontAwesomeIcon icon={item.tipo === 'gatilho' ? faClock : faBolt} />
                      {item.tipo === 'gatilho' ? 'Gatilho' : 'Manual'}
                    </span>
                  </td>
                  <td>{formatDate(item.data_inicio)}</td>
                  <td>{formatDate(item.data_fim)}</td>
                  <td>
                    <div className="status-badge-wrap">
                      <span className={`status-badge ${badge.className}`}>
                        {badge.label}
                      </span>

                      {/* Ícone FontAwesome de Erro clicável para abrir o modal */}
                      {isErro && (
                        <button
                          type="button"
                          className="btn-error-icon"
                          onClick={() => setErrorModalItem(item)}
                          title="Clique para inspecionar os detalhes do erro"
                          aria-label="Ver detalhes do erro"
                        >
                          <FontAwesomeIcon icon={faTriangleExclamation} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isRunning ? (
                      <button
                        type="button"
                        className="btn-stop-execution"
                        onClick={() => handleStopExecution(item)}
                        disabled={stoppingId === item.id}
                        title="Interromper processo em execução imediatamente"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #f87171',
                          background: '#fef2f2',
                          color: '#dc2626',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <FontAwesomeIcon icon={faStop} />
                        <span>{stoppingId === item.id ? 'Parando...' : 'Parar'}</span>
                      </button>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontSize: '11px' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!isLoading && items.length === 0 && (
              <tr>
                <td className="history-empty" colSpan={9}>
                  Nenhum registro de execução encontrado com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Paginação */}
      <nav className="history-pagination" aria-label="Paginação do histórico">
        <span>
          Total de <strong>{total}</strong> execuções registradas • Página {currentPage} de {totalPages}
        </span>
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
          <button className="history-pagination-button active" type="button">
            {currentPage}
          </button>
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

      {/* Modal de Detalhes do Erro */}
      {errorModalItem && (
        <div className="modal-backdrop" role="presentation">
          <div className="error-modal-box" role="dialog" aria-modal="true">
            <div className="error-modal-header">
              <div className="error-modal-title">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <span>Detalhes da Falha na Execução #{errorModalItem.id}</span>
              </div>
              <button
                type="button"
                style={{ background: 'transparent', border: 0, fontSize: '16px', color: '#64748b', cursor: 'pointer' }}
                onClick={() => setErrorModalItem(null)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div style={{ marginBottom: '14px', fontSize: '13px', lineHeight: 1.6 }}>
              <p style={{ margin: '4px 0' }}>
                <strong>Automação:</strong> {errorModalItem.automacao_nome}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Máquina Runner:</strong> {errorModalItem.maquina_nome || 'Não informada'}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Início:</strong> {formatDate(errorModalItem.data_inicio)} |{' '}
                <strong>Término:</strong> {formatDate(errorModalItem.data_fim)}
              </p>
            </div>

            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#625f78', marginBottom: '6px' }}>
              Log / Mensagem de Erro:
            </label>
            <div className="error-code-block">
              {errorModalItem.erro || 'Nenhuma mensagem de log detalhada foi informada pelo executável.'}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button
                className="ghost-button"
                type="button"
                onClick={() => handleCopyError(errorModalItem.erro)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <FontAwesomeIcon icon={copiedError ? faCheck : faCopy} />
                <span>{copiedError ? 'Copiado!' : 'Copiar Mensagem'}</span>
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => setErrorModalItem(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}