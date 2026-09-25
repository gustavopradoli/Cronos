import { useEffect, useMemo, useState } from 'react';
import type { Automacao, Maquina } from '@cronos/shared';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faRotate,
  faPlay,
  faPen,
  faTrash,
  faTimes,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { apiRequest } from '../services/api';
import './orchestrator.css';

interface MaquinaComStatus extends Maquina {
  is_online?: boolean;
}

export function OrchestratorScreen() {
  const [automacoes, setAutomacoes] = useState<Automacao[]>([]);
  const [maquinas, setMaquinas] = useState<MaquinaComStatus[]>([]);
  const [query, setQuery] = useState('');
  const [departamentoFilter, setDepartamentoFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal de Criar / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Automacao | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formCaminhoExe, setFormCaminhoExe] = useState('');
  const [formDepartamento, setFormDepartamento] = useState('Tecnologia');
  const [formAtivo, setFormAtivo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Disparo
  const [disparoModalOpen, setDisparoModalOpen] = useState(false);
  const [automacaoParaDisparar, setAutomacaoParaDisparar] = useState<Automacao | null>(null);
  const [maquinaSelecionadaId, setMaquinaSelecionadaId] = useState<number | ''>('');
  const [isDisparando, setIsDisparando] = useState(false);

  // Carregar dados
  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [autos, maqs] = await Promise.all([
        apiRequest<Automacao[]>('/automacoes'),
        apiRequest<MaquinaComStatus[]>('/maquinas'),
      ]);
      setAutomacoes(autos || []);
      setMaquinas(maqs || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao carregar dados de automações.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const departamentos = useMemo(() => {
    const deps = new Set(automacoes.map((a) => a.departamento).filter(Boolean));
    return ['all', ...Array.from(deps)];
  }, [automacoes]);

  const filteredAutomations = useMemo(() => {
    return automacoes.filter((automation) => {
      const matchesDep = departamentoFilter === 'all' || automation.departamento === departamentoFilter;
      const searchable = [
        String(automation.id),
        automation.nome,
        automation.descricao || '',
        automation.caminho_exe,
        automation.departamento,
      ]
        .join(' ')
        .toLowerCase();

      return matchesDep && searchable.includes(query.trim().toLowerCase());
    });
  }, [automacoes, query, departamentoFilter]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormNome('');
    setFormDescricao('');
    setFormCaminhoExe('');
    setFormDepartamento('Tecnologia');
    setFormAtivo(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (auto: Automacao) => {
    setEditingItem(auto);
    setFormNome(auto.nome);
    setFormDescricao(auto.descricao || '');
    setFormCaminhoExe(auto.caminho_exe);
    setFormDepartamento(auto.departamento);
    setFormAtivo(auto.ativo);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formCaminhoExe.trim() || !formDepartamento.trim()) {
      alert('Por favor, preencha o Nome, Caminho do Executável e o Departamento.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingItem) {
        await apiRequest(`/automacoes/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome: formNome,
            descricao: formDescricao,
            caminho_exe: formCaminhoExe,
            departamento: formDepartamento,
            ativo: formAtivo,
          }),
        });
        setSuccessMsg(`Automação "${formNome}" atualizada com sucesso!`);
      } else {
        await apiRequest('/automacoes', {
          method: 'POST',
          body: JSON.stringify({
            nome: formNome,
            descricao: formDescricao,
            caminho_exe: formCaminhoExe,
            departamento: formDepartamento,
            ativo: formAtivo,
          }),
        });
        setSuccessMsg(`Nova automação "${formNome}" cadastrada com sucesso!`);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (auto: Automacao) => {
    if (!window.confirm(`Tem certeza que deseja excluir a automação "${auto.nome}"?`)) return;
    try {
      await apiRequest(`/automacoes/${auto.id}`, { method: 'DELETE' });
      setSuccessMsg(`Automação "${auto.nome}" removida.`);
      loadData();
    } catch (err: any) {
      alert(`Erro ao remover: ${err.message}`);
    }
  };

  const handleToggleAtivo = async (auto: Automacao) => {
    try {
      await apiRequest(`/automacoes/${auto.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: !auto.ativo }),
      });
      loadData();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleOpenDisparo = (auto: Automacao) => {
    setAutomacaoParaDisparar(auto);
    const firstOnline = maquinas.find((m) => m.is_online && m.ativo);
    setMaquinaSelecionadaId(firstOnline ? firstOnline.id : maquinas[0]?.id || '');
    setDisparoModalOpen(true);
  };

  const handleConfirmDisparo = async () => {
    if (!automacaoParaDisparar || isDisparando) return;
    setIsDisparando(true);
    try {
      await apiRequest('/execucoes/disparar', {
        method: 'POST',
        body: JSON.stringify({
          automacao_id: automacaoParaDisparar.id,
          maquina_id: maquinaSelecionadaId ? Number(maquinaSelecionadaId) : undefined,
        }),
      });
      setSuccessMsg(
        `Disparo de "${automacaoParaDisparar.nome}" enviado com sucesso! Status inicial: Executando.`
      );
      setDisparoModalOpen(false);
    } catch (err: any) {
      alert(`Erro ao disparar: ${err.message}`);
    } finally {
      setIsDisparando(false);
    }
  };

  return (
    <div>
      <section className="orchestrator-hero">
        <div>
          <p className="eyebrow">Cronos Orquestrador</p>
          <h1>Cadastro de Automações</h1>
          <p className="intro">
            Gerencie o catálogo de robôs e processos automatizados, cadastre novos executáveis e dispare execuções manuais.
          </p>
        </div>
        <div className="hero-actions" aria-label="Ações da tela">
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
            <span>Nova Automação</span>
          </button>
        </div>
      </section>

      <section className="workspace-panel">
        <div className="toolbar">
          <label className="search-field">
            <span>Buscar Automação</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon
                icon={faSearch}
                style={{ position: 'absolute', left: '14px', color: '#94a3b8', fontSize: '13px' }}
              />
              <input
                type="search"
                style={{ paddingLeft: '36px' }}
                placeholder="ID, nome, descrição, executável ou departamento..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </label>
          <label className="select-field">
            <span>Departamento</span>
            <select
              value={departamentoFilter}
              onChange={(e) => setDepartamentoFilter(e.target.value)}
            >
              {departamentos.map((dep) => (
                <option key={dep} value={dep}>
                  {dep === 'all' ? 'Todos os departamentos' : dep}
                </option>
              ))}
            </select>
          </label>
        </div>

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
          <div className="loading-state" aria-label="Carregando automações">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <section className="automation-table" aria-label="Lista de automações">
            <div className="automation-table-scroll">
              <div
                className="automation-head"
                style={{ gridTemplateColumns: '60px 1.5fr 1fr 2fr 100px 190px' }}
              >
                <span>ID</span>
                <span>Nome</span>
                <span>Departamento</span>
                <span>Caminho Executável (.exe)</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Ações</span>
              </div>

              {filteredAutomations.map((auto) => (
                <div
                  key={auto.id}
                  className="automation-entry"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1.5fr 1fr 2fr 100px 190px',
                    padding: '12px 10px',
                    alignItems: 'center',
                    gap: '8px',
                    borderTop: '1px solid var(--color-line)',
                  }}
                >
                  <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>#{auto.id}</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{auto.nome}</strong>
                    {auto.descricao && (
                      <span style={{ color: 'var(--color-muted)', fontSize: '11px' }}>
                        {auto.descricao}
                      </span>
                    )}
                  </div>
                  <span>{auto.departamento}</span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      background: 'var(--color-surface)',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {auto.caminho_exe}
                  </span>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(auto)}
                      className={`status-pill ${auto.ativo ? 'completed' : 'failed'}`}
                      style={{ cursor: 'pointer', border: 0 }}
                      title="Clique para alternar ativo/inativo"
                    >
                      {auto.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      className="primary-button"
                      type="button"
                      style={{
                        padding: '0 12px',
                        height: '32px',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onClick={() => handleOpenDisparo(auto)}
                      disabled={!auto.ativo}
                      title={auto.ativo ? 'Disparar agora' : 'Automação inativa'}
                    >
                      <FontAwesomeIcon icon={faPlay} style={{ fontSize: '10px' }} />
                      <span>Disparar</span>
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      style={{ padding: '0 10px', height: '32px', fontSize: '12px' }}
                      onClick={() => handleOpenEdit(auto)}
                      title="Editar automação"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      style={{ padding: '0 10px', height: '32px', fontSize: '12px', color: '#dc2626' }}
                      onClick={() => handleDelete(auto)}
                      title="Excluir automação"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredAutomations.length === 0 && (
                <div className="empty-state">
                  <strong>Nenhuma automação encontrada.</strong>
                  <span>Clique em "Nova Automação" para cadastrar o primeiro robô.</span>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

      {/* Modal de Cadastro / Edição */}
      {modalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirmation-modal" style={{ width: 'min(100%, 540px)' }} role="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2>{editingItem ? 'Editar Automação' : 'Cadastrar Nova Automação'}</h2>
              <button
                type="button"
                style={{ background: 'transparent', border: 0, fontSize: '16px', color: '#64748b', cursor: 'pointer' }}
                onClick={() => setModalOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <p style={{ marginBottom: '16px' }}>
              Preencha os dados do processo e o caminho absoluto do .exe na máquina cliente.
            </p>

            <form onSubmit={handleSave} style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Nome da Automação *
                <input
                  type="text"
                  required
                  placeholder="Ex: Conciliação Bancária Diária"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Departamento *
                <input
                  type="text"
                  required
                  placeholder="Ex: Financeiro, TI, Fiscal..."
                  value={formDepartamento}
                  onChange={(e) => setFormDepartamento(e.target.value)}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Caminho do Executável (.exe) *
                <input
                  type="text"
                  required
                  placeholder="Ex: C:\Robos\financeiro\conciliar.exe"
                  value={formCaminhoExe}
                  onChange={(e) => setFormCaminhoExe(e.target.value)}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-line)',
                    fontFamily: 'monospace',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Descrição
                <textarea
                  rows={3}
                  placeholder="Breve resumo da finalidade e funcionamento deste robô..."
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-line)',
                    fontFamily: 'inherit',
                  }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formAtivo}
                  onChange={(e) => setFormAtivo(e.target.checked)}
                />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Automação Ativa</span>
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
                  {isSaving ? 'Salvando...' : editingItem ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Modal de Disparo Manual */}
      {disparoModalOpen && automacaoParaDisparar && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirmation-modal" role="dialog">
            <span className="status-pill idle" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FontAwesomeIcon icon={faPlay} style={{ fontSize: '9px' }} />
              Disparo Manual
            </span>
            <h2 style={{ marginTop: '10px' }}>Executar "{automacaoParaDisparar.nome}"?</h2>
            <p>
              Selecione em qual máquina cliente registrada você deseja enviar a ordem de execução do executável:
            </p>

            <div style={{ margin: '16px 0' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Máquina Destino:
              </label>
              <select
                value={maquinaSelecionadaId}
                onChange={(e) => setMaquinaSelecionadaId(e.target.value ? Number(e.target.value) : '')}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-line)',
                }}
              >
                <option value="">Primeira máquina online disponível</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} {m.is_online ? '(ONLINE)' : '(OFFLINE)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setDisparoModalOpen(false)}
                disabled={isDisparando}
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleConfirmDisparo}
                disabled={isDisparando}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <FontAwesomeIcon icon={faPlay} />
                <span>{isDisparando ? 'Disparando...' : 'Confirmar Execução'}</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
