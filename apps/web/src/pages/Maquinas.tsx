import { useEffect, useState } from 'react';
import type { Maquina } from '@cronos/shared';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faRotate,
  faKey,
  faPen,
  faTrash,
  faCopy,
  faCheck,
  faEye,
  faEyeSlash,
  faTimes,
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import { apiRequest } from '../services/api';
import './orchestrator.css';

interface MaquinaComStatus extends Maquina {
  is_online?: boolean;
}

export default function Maquinas() {
  const [maquinas, setMaquinas] = useState<MaquinaComStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaquinaComStatus | null>(null);
  const [nome, setNome] = useState('');
  const [secret, setSecret] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Controle de visibilidade de secret por ID
  const [revealedSecrets, setRevealedSecrets] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await apiRequest<MaquinaComStatus[]>('/maquinas');
      setMaquinas(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar máquinas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setNome('');
    const randomSecret = Array.from({ length: 48 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setSecret(randomSecret);
    setAtivo(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: MaquinaComStatus) => {
    setEditingItem(item);
    setNome(item.nome);
    setSecret(item.secret);
    setAtivo(item.ativo);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Informe o nome da máquina.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingItem) {
        await apiRequest(`/maquinas/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nome, secret, ativo }),
        });
        setSuccessMsg(`Máquina "${nome}" atualizada com sucesso!`);
      } else {
        await apiRequest('/maquinas', {
          method: 'POST',
          body: JSON.stringify({ nome, secret, ativo }),
        });
        setSuccessMsg(`Máquina "${nome}" cadastrada com sucesso! Copie o secret para configurar o runner.`);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Erro ao salvar máquina: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateSecret = async (item: MaquinaComStatus) => {
    if (
      !window.confirm(
        `Regenerar o secret da máquina "${item.nome}"? O cliente desktop precisará ser atualizado com o novo secret para conseguir conectar.`
      )
    )
      return;

    try {
      const res = await apiRequest<Maquina>(`/maquinas/${item.id}/regenerate-secret`, { method: 'POST' });
      setSuccessMsg(`Novo secret gerado para "${item.nome}".`);
      navigator.clipboard.writeText(res.secret);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDelete = async (item: MaquinaComStatus) => {
    if (!window.confirm(`Deseja remover o cadastro da máquina "${item.nome}"?`)) return;
    try {
      await apiRequest(`/maquinas/${item.id}`, { method: 'DELETE' });
      setSuccessMsg(`Máquina "${item.nome}" removida.`);
      loadData();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const handleToggleAtivo = async (item: MaquinaComStatus) => {
    try {
      await apiRequest(`/maquinas/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: !item.ativo }),
      });
      loadData();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const toggleRevealSecret = (id: number) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copySecret = (id: number, secretText: string) => {
    navigator.clipboard.writeText(secretText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <div>
      <section className="orchestrator-hero">
        <div>
          <p className="eyebrow">Cronos Orquestrador</p>
          <h1>Cadastro de Máquinas</h1>
          <p className="intro">
            Cadastre os computadores executores (runners), gerencie secrets de autenticação segura e monitore o status de conexão.
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
            <span>Nova Máquina</span>
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
          <div className="loading-state" aria-label="Carregando máquinas">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <section className="automation-table" aria-label="Lista de máquinas">
            <div className="automation-table-scroll">
              <div
                className="automation-head"
                style={{ gridTemplateColumns: '100px 1.5fr 2.5fr 120px 1.3fr 90px 140px' }}
              >
                <span>Conexão</span>
                <span>Nome / Hostname</span>
                <span>Secret de Autenticação</span>
                <span>IP Address</span>
                <span>Última Conexão</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Ações</span>
              </div>

              {maquinas.map((m) => {
                const isRevealed = Boolean(revealedSecrets[m.id]);
                const isCopied = copiedId === m.id;

                return (
                  <div
                    key={m.id}
                    className="automation-entry"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 1.5fr 2.5fr 120px 1.3fr 90px 140px',
                      padding: '12px 10px',
                      alignItems: 'center',
                      gap: '8px',
                      borderTop: '1px solid var(--color-line)',
                    }}
                  >
                    <div>
                      {m.is_online ? (
                        <span
                          className="status-pill completed"
                          style={{ fontSize: '11px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                        >
                          <FontAwesomeIcon icon={faCircle} style={{ fontSize: '7px', color: '#22c55e' }} />
                          <span>Online</span>
                        </span>
                      ) : (
                        <span
                          className="status-pill"
                          style={{
                            fontSize: '11px',
                            background: '#f1f5f9',
                            color: '#64748b',
                            display: 'inline-flex',
                            gap: '6px',
                            alignItems: 'center',
                          }}
                        >
                          <FontAwesomeIcon icon={faCircle} style={{ fontSize: '7px', color: '#94a3b8' }} />
                          <span>Offline</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <strong style={{ fontSize: '13px' }}>{m.nome}</strong>
                      <span style={{ display: 'block', color: 'var(--color-muted)', fontSize: '11px' }}>
                        ID #{m.id}
                      </span>
                    </div>

                    {/* Secret com cópia e reveal */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          background: 'var(--color-surface)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--color-line)',
                          color: 'var(--color-ink)',
                          userSelect: isRevealed ? 'all' : 'none',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isRevealed ? m.secret : '••••••••••••••••••••••••'}
                      </span>
                      <button
                        type="button"
                        className="ghost-button"
                        style={{ minHeight: '28px', padding: '0 8px', fontSize: '11px' }}
                        onClick={() => toggleRevealSecret(m.id)}
                        title={isRevealed ? 'Ocultar secret' : 'Exibir secret'}
                      >
                        <FontAwesomeIcon icon={isRevealed ? faEyeSlash : faEye} />
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        style={{
                          minHeight: '28px',
                          padding: '0 10px',
                          fontSize: '11px',
                          backgroundColor: isCopied ? '#dcfce7' : '#ffffff',
                          color: isCopied ? '#15803d' : 'inherit',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                        onClick={() => copySecret(m.id, m.secret)}
                        title="Copiar secret"
                      >
                        <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} />
                        <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>

                    <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      {m.ip_address || '—'}
                    </span>

                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                      {formatDate(m.ultima_conexao)}
                    </span>

                    <div>
                      <button
                        type="button"
                        onClick={() => handleToggleAtivo(m)}
                        className={`status-pill ${m.ativo ? 'completed' : 'failed'}`}
                        style={{ cursor: 'pointer', border: 0 }}
                        title="Clique para alternar ativo/inativo"
                      >
                        {m.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        className="ghost-button"
                        type="button"
                        style={{ padding: '0 10px', height: '32px', fontSize: '12px' }}
                        onClick={() => handleRegenerateSecret(m)}
                        title="Regenerar Secret"
                      >
                        <FontAwesomeIcon icon={faKey} />
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        style={{ padding: '0 10px', height: '32px', fontSize: '12px' }}
                        onClick={() => handleOpenEdit(m)}
                        title="Editar máquina"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        style={{ padding: '0 10px', height: '32px', fontSize: '12px', color: '#dc2626' }}
                        onClick={() => handleDelete(m)}
                        title="Excluir máquina"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {maquinas.length === 0 && (
                <div className="empty-state">
                  <strong>Nenhuma máquina cadastrada.</strong>
                  <span>Clique em "Nova Máquina" para cadastrar um runner e obter seu token secret de autenticação.</span>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

      {/* Modal Cadastro / Edição */}
      {modalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirmation-modal" style={{ width: 'min(100%, 540px)' }} role="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2>{editingItem ? 'Editar Máquina' : 'Cadastrar Nova Máquina Runner'}</h2>
              <button
                type="button"
                style={{ background: 'transparent', border: 0, fontSize: '16px', color: '#64748b', cursor: 'pointer' }}
                onClick={() => setModalOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <p style={{ marginBottom: '16px' }}>
              Defina o identificador da máquina. O secret deve ser inserido no Cronos Client para permitir o registro.
            </p>

            <form onSubmit={handleSave} style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Nome / Hostname da Máquina *
                <input
                  type="text"
                  required
                  placeholder="Ex: DESKTOP-GUSTAVO ou RUNNER-01"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Secret de Autenticação
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    required
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    style={{
                      flex: 1,
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-line)',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  />
                  <button
                    type="button"
                    className="ghost-button"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      alert('Secret copiado para a área de transferência!');
                    }}
                  >
                    <FontAwesomeIcon icon={faCopy} />
                    <span>Copiar</span>
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                  Cole este secret no campo "Secret de Autenticação" do aplicativo Python Cronos Client.
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Máquina Ativa para Execução</span>
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
                  {isSaving ? 'Salvando...' : editingItem ? 'Salvar Alterações' : 'Cadastrar Máquina'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
