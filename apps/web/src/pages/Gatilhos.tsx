import { useEffect, useMemo, useState, useRef } from 'react';
import type { Automacao, Maquina, TipoGatilho, RegraDiaUtil } from '@cronos/shared';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faRotate,
  faPen,
  faTrash,
  faTimes,
  faSearch,
  faDesktop,
  faClock,
  faCheck,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { apiRequest } from '../services/api';
import './orchestrator.css';

interface GatilhoItem {
  id: number;
  automacao_id: number;
  maquina_id: number;
  tipo: TipoGatilho;
  dia_execucao?: number | null;
  horario_execucao: string;
  regra_dia_util: RegraDiaUtil;
  ativo: boolean;
  automacao_nome: string;
  automacao_departamento: string;
  maquina_nome: string;
}

const DIAS_SEMANA = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export default function Gatilhos() {
  const [gatilhos, setGatilhos] = useState<GatilhoItem[]>([]);
  const [automacoes, setAutomacoes] = useState<Automacao[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GatilhoItem | null>(null);
  const [automacaoId, setAutomacaoId] = useState<number | ''>('');
  const [maquinaId, setMaquinaId] = useState<number | ''>('');
  const [tipo, setTipo] = useState<TipoGatilho>('diario');
  const [diaExecucao, setDiaExecucao] = useState<number>(1);
  const [horarioExecucao, setHorarioExecucao] = useState('08:00');
  const [regraDiaUtil, setRegraDiaUtil] = useState<RegraDiaUtil>('manter');
  const [ativo, setAtivo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Busca e dropdown pesquisável de Automação
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchAutoQuery, setSearchAutoQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [gats, autos, maqs] = await Promise.all([
        apiRequest<GatilhoItem[]>('/gatilhos'),
        apiRequest<Automacao[]>('/automacoes'),
        apiRequest<Maquina[]>('/maquinas'),
      ]);
      setGatilhos(gats || []);
      setAutomacoes(autos || []);
      setMaquinas(maqs || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar gatilhos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAutomacoesSelect = useMemo(() => {
    const q = searchAutoQuery.trim().toLowerCase();
    if (!q) return automacoes;
    return automacoes.filter(
      (a) =>
        a.nome.toLowerCase().includes(q) ||
        a.departamento.toLowerCase().includes(q) ||
        String(a.id).includes(q)
    );
  }, [automacoes, searchAutoQuery]);

  const selectedAutomacaoObj = useMemo(() => {
    return automacoes.find((a) => a.id === automacaoId);
  }, [automacoes, automacaoId]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setAutomacaoId(automacoes[0]?.id || '');
    setMaquinaId(maquinas[0]?.id || '');
    setTipo('diario');
    setDiaExecucao(1);
    setHorarioExecucao('08:00');
    setRegraDiaUtil('manter');
    setAtivo(true);
    setSearchAutoQuery('');
    setDropdownOpen(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: GatilhoItem) => {
    setEditingItem(item);
    setAutomacaoId(item.automacao_id);
    setMaquinaId(item.maquina_id);
    setTipo(item.tipo);
    setDiaExecucao(item.dia_execucao || 1);
    setHorarioExecucao(item.horario_execucao.slice(0, 5));
    setRegraDiaUtil(item.regra_dia_util);
    setAtivo(item.ativo);
    setSearchAutoQuery('');
    setDropdownOpen(false);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!automacaoId || !maquinaId || !horarioExecucao) {
      alert('Selecione a automação, a máquina e o horário de execução.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        automacao_id: Number(automacaoId),
        maquina_id: Number(maquinaId),
        tipo,
        dia_execucao: tipo === 'diario' ? null : Number(diaExecucao),
        horario_execucao: horarioExecucao.length === 5 ? `${horarioExecucao}:00` : horarioExecucao,
        regra_dia_util: regraDiaUtil,
        ativo,
      };

      if (editingItem) {
        await apiRequest(`/gatilhos/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('Gatilho atualizado com sucesso!');
      } else {
        await apiRequest('/gatilhos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('Novo gatilho cadastrado com sucesso!');
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Erro ao salvar gatilho: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: GatilhoItem) => {
    if (!window.confirm(`Deseja excluir o gatilho da automação "${item.automacao_nome}"?`)) return;
    try {
      await apiRequest(`/gatilhos/${item.id}`, { method: 'DELETE' });
      setSuccessMsg('Gatilho removido com sucesso.');
      loadData();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const handleToggleAtivo = async (item: GatilhoItem) => {
    try {
      await apiRequest(`/gatilhos/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: !item.ativo }),
      });
      loadData();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const formatPeriodicidade = (g: GatilhoItem) => {
    if (g.tipo === 'diario') return 'Diário';
    if (g.tipo === 'semanal') {
      const diaObj = DIAS_SEMANA.find((d) => d.value === g.dia_execucao);
      return `Semanal (${diaObj ? diaObj.label : `Dia ${g.dia_execucao}`})`;
    }
    if (g.tipo === 'mensal') {
      return `Mensal (Dia ${g.dia_execucao})`;
    }
    return g.tipo;
  };

  return (
    <div>
      <section className="orchestrator-hero">
        <div>
          <p className="eyebrow">Cronos Orquestrador</p>
          <h1>Tela de Gatilhos</h1>
          <p className="intro">
            Configure agendamentos automáticos periódicos (diários, semanais e mensais) vinculados a máquinas específicas.
          </p>
        </div>
        <div className="hero-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={loadData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FontAwesomeIcon icon={faRotate} />
            <span>Atualizar</span>
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={handleOpenCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Novo Gatilho</span>
          </button>
        </div>
      </section>

      <section className="workspace-panel">
        {successMsg && (
          <div className="success-alert" role="status">
            {successMsg}
            <button
              type="button"
              style={{ float: 'right', background: 'transparent', border: 0, cursor: 'pointer', color: '#15803d' }}
              onClick={() => setSuccessMsg('')}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="error-state" role="alert">
            <strong>Erro:</strong>
            <span>{errorMsg}</span>
            <button type="button" onClick={loadData}>
              Tentar novamente
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state" aria-label="Carregando gatilhos">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <section className="automation-table" aria-label="Lista de gatilhos">
            <div className="automation-table-scroll">
              <div
                className="automation-head"
                style={{ gridTemplateColumns: '60px 1.5fr 1.2fr 1.3fr 100px 120px 90px 140px' }}
              >
                <span>ID</span>
                <span>Automação</span>
                <span>Máquina</span>
                <span>Periodicidade</span>
                <span>Horário</span>
                <span>Dia Útil</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Ações</span>
              </div>

              {gatilhos.map((gat) => (
                <div
                  key={gat.id}
                  className="automation-entry"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1.5fr 1.2fr 1.3fr 100px 120px 90px 140px',
                    padding: '12px 10px',
                    alignItems: 'center',
                    gap: '8px',
                    borderTop: '1px solid var(--color-line)',
                  }}
                >
                  <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>#{gat.id}</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{gat.automacao_nome}</strong>
                    <span style={{ color: 'var(--color-muted)', fontSize: '11px' }}>
                      {gat.automacao_departamento}
                    </span>
                  </div>
                  <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FontAwesomeIcon icon={faDesktop} style={{ color: 'var(--color-primary)' }} />
                    {gat.maquina_nome}
                  </span>
                  <span style={{ fontSize: '12px' }}>{formatPeriodicidade(gat)}</span>
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: 'var(--color-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <FontAwesomeIcon icon={faClock} style={{ fontSize: '11px' }} />
                    {gat.horario_execucao.slice(0, 5)}
                  </span>
                  <span style={{ textTransform: 'capitalize', fontSize: '12px' }}>
                    {gat.regra_dia_util}
                  </span>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(gat)}
                      className={`status-pill ${gat.ativo ? 'completed' : 'failed'}`}
                      style={{ cursor: 'pointer', border: 0 }}
                      title="Clique para alternar ativo/inativo"
                    >
                      {gat.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      className="ghost-button"
                      type="button"
                      style={{ padding: '0 10px', height: '32px', fontSize: '12px' }}
                      onClick={() => handleOpenEdit(gat)}
                      title="Editar gatilho"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      style={{ padding: '0 10px', height: '32px', fontSize: '12px', color: '#dc2626' }}
                      onClick={() => handleDelete(gat)}
                      title="Excluir gatilho"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}

              {gatilhos.length === 0 && (
                <div className="empty-state">
                  <strong>Nenhum gatilho agendado cadastrado.</strong>
                  <span>Clique em "Novo Gatilho" para configurar a primeira automação recorrente.</span>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

      {/* Modal Cadastro / Edição */}
      {modalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirmation-modal" style={{ width: 'min(100%, 540px)', overflow: 'visible' }} role="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2>{editingItem ? 'Editar Gatilho' : 'Configurar Novo Gatilho'}</h2>
              <button
                type="button"
                style={{ background: 'transparent', border: 0, fontSize: '16px', color: '#64748b', cursor: 'pointer' }}
                onClick={() => setModalOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <p style={{ marginBottom: '16px' }}>
              Defina a automação a ser executada, a máquina runner de destino e a regra de periodicidade.
            </p>

            <form onSubmit={handleSave} style={{ display: 'grid', gap: '14px' }}>
              {/* Componente Searchable Select para Automações com Muitas Opções */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Automação * (Pesquise pelo nome ou departamento)
                </label>

                {/* Caixa que simula o select clicável */}
                <div
                  onClick={() => setDropdownOpen((v) => !v)}
                  style={{
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-line)',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: dropdownOpen ? '0 0 0 3px #5b21b61a' : 'none',
                    borderColor: dropdownOpen ? 'var(--color-primary)' : 'var(--color-line)',
                  }}
                >
                  {selectedAutomacaoObj ? (
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)' }}>
                      #{selectedAutomacaoObj.id} - {selectedAutomacaoObj.nome}{' '}
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 400 }}>
                        ({selectedAutomacaoObj.departamento})
                      </span>
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Clique para pesquisar e selecionar...</span>
                  )}
                  <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '11px', color: '#64748b' }} />
                </div>

                {/* Menu Dropdown com Campo de Busca Integrado */}
                {dropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: '#ffffff',
                      border: '1px solid var(--color-line)',
                      borderRadius: '8px',
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
                      zIndex: 9999,
                      padding: '8px',
                    }}
                  >
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <FontAwesomeIcon
                        icon={faSearch}
                        style={{ position: 'absolute', left: '10px', color: '#94a3b8', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Digite para filtrar as automações..."
                        value={searchAutoQuery}
                        onChange={(e) => setSearchAutoQuery(e.target.value)}
                        style={{
                          width: '100%',
                          height: '36px',
                          padding: '0 10px 0 30px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-line)',
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {filteredAutomacoesSelect.map((a) => {
                        const isSelected = a.id === automacaoId;
                        return (
                          <div
                            key={a.id}
                            onClick={() => {
                              setAutomacaoId(a.id);
                              setDropdownOpen(false);
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              background: isSelected ? '#f5f3ff' : 'transparent',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '12px',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div>
                              <strong style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-ink)' }}>
                                #{a.id} - {a.nome}
                              </strong>
                              <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)' }}>
                                {a.departamento}
                              </span>
                            </div>
                            {isSelected && (
                              <FontAwesomeIcon icon={faCheck} style={{ color: 'var(--color-primary)' }} />
                            )}
                          </div>
                        );
                      })}

                      {filteredAutomacoesSelect.length === 0 && (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                          Nenhuma automação encontrada para "{searchAutoQuery}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Máquina de Execução *
                <select
                  required
                  value={maquinaId}
                  onChange={(e) => setMaquinaId(Number(e.target.value))}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-line)',
                  }}
                >
                  <option value="" disabled>Selecione uma máquina runner...</option>
                  {maquinas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                  Tipo de Periodicidade *
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoGatilho)}
                    style={{
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-line)',
                    }}
                  >
                    <option value="diario">Diário</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                  Horário de Execução *
                  <input
                    type="time"
                    required
                    value={horarioExecucao}
                    onChange={(e) => setHorarioExecucao(e.target.value)}
                    style={{
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-line)',
                    }}
                  />
                </label>
              </div>

              {tipo === 'semanal' && (
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                  Dia da Semana *
                  <select
                    value={diaExecucao}
                    onChange={(e) => setDiaExecucao(Number(e.target.value))}
                    style={{
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-line)',
                    }}
                  >
                    {DIAS_SEMANA.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {tipo === 'mensal' && (
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                  Dia do Mês (1 a 31) *
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={diaExecucao}
                    onChange={(e) => setDiaExecucao(Number(e.target.value))}
                    style={{
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-line)',
                    }}
                  />
                </label>
              )}

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Regra para Dias Não Úteis (Fins de semana)
                <select
                  value={regraDiaUtil}
                  onChange={(e) => setRegraDiaUtil(e.target.value as RegraDiaUtil)}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-line)',
                  }}
                >
                  <option value="manter">Manter no dia agendado</option>
                  <option value="postergar">Postergar para a próxima segunda-feira</option>
                  <option value="adiantar">Adiantar para a sexta-feira anterior</option>
                </select>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Gatilho Ativo</span>
              </label>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button className="primary-button" type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : editingItem ? 'Salvar Alterações' : 'Criar Gatilho'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
