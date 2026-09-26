import { useEffect, useState, useMemo } from 'react';
import type { Usuario, UserRole } from '@cronos/shared';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faRotate,
  faPen,
  faTrash,
  faShieldHalved,
  faUserGear,
  faEye,
  faEyeSlash,
  faTimes,
  faCheck,
  faTriangleExclamation,
  faKey,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import {
  getUsuariosApi,
  createUsuarioApi,
  updateUsuarioApi,
  deleteUsuarioApi,
} from '../services/api';
import { confirmAction, showError } from '../utils/dialogs';
import './orchestrator.css';
import './Usuarios.css';

export default function Usuarios() {
  const { user: currentUser, canManageUsers } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('operador');
  const [podeCadastrar, setPodeCadastrar] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await getUsuariosApi();
      setUsuarios(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar lista de usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
      loadData();
    }
  }, [canManageUsers]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = usuarios.length;
    const admins = usuarios.filter((u) => u.role === 'admin').length;
    const operadores = usuarios.filter((u) => u.role === 'operador').length;
    const ativos = usuarios.filter((u) => u.ativo).length;
    return { total, admins, operadores, ativos };
  }, [usuarios]);

  // Lista filtrada
  const filteredUsers = useMemo(() => {
    return usuarios.filter((u) => {
      const matchesSearch =
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.ativo) ||
        (statusFilter === 'inactive' && !u.ativo);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usuarios, search, roleFilter, statusFilter]);

  // Gerador de senha aleatória
  const generateRandomPassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let res = '';
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
  };

  // Abrir modal de criação
  const handleOpenCreate = () => {
    setEditingUser(null);
    setNome('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('operador');
    setPodeCadastrar(false);
    setAtivo(true);
    setFormError('');
    setModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEdit = (user: Usuario) => {
    setEditingUser(user);
    setNome(user.nome);
    setEmail(user.email);
    setPassword('');
    setShowPassword(false);
    setRole(user.role || 'operador');
    setPodeCadastrar(user.role === 'admin' ? true : Boolean(user.pode_cadastrar_usuarios));
    setAtivo(user.ativo);
    setFormError('');
    setModalOpen(true);
  };

  // Salvar usuário (criar ou atualizar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) {
      setFormError('O e-mail é obrigatório.');
      return;
    }

    if (!editingUser && (!password || password.length < 6)) {
      setFormError('A senha inicial deve conter pelo menos 6 caracteres.');
      return;
    }

    if (editingUser && password && password.length < 6) {
      setFormError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        await updateUsuarioApi(editingUser.id, {
          nome: nome.trim() || undefined,
          email: email.trim().toLowerCase(),
          password: password.trim() ? password : undefined,
          role,
          pode_cadastrar_usuarios: role === 'admin' ? true : podeCadastrar,
          ativo,
        });
        setSuccessMsg(`Usuário "${nome || email}" atualizado com sucesso!`);
      } else {
        await createUsuarioApi({
          nome: nome.trim() || undefined,
          email: email.trim().toLowerCase(),
          password,
          role,
          pode_cadastrar_usuarios: role === 'admin' ? true : podeCadastrar,
          ativo,
        });
        setSuccessMsg(`Usuário "${nome || email}" cadastrado com sucesso!`);
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar dados do usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir usuário com confirmação SweetAlert2
  const handleDeleteUser = async (user: Usuario) => {
    const confirmed = await confirmAction({
      title: 'Excluir Usuário',
      text: `Tem certeza que deseja excluir o usuário "${user.nome || user.email}" (${user.email})? Esta ação revogará permanentemente o acesso à plataforma.`,
      confirmText: 'Sim, excluir',
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteUsuarioApi(user.id);
      setSuccessMsg(`Usuário "${user.nome || user.email}" excluído com sucesso.`);
      loadData();
    } catch (err: any) {
      showError('Erro ao excluir usuário', err.message);
    }
  };

  // Formatação de data
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Nunca acessou';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Se o usuário logado não for administrador nem tiver permissão de gestão
  if (!canManageUsers) {
    return (
      <main className="orchestrator-shell">
        <div className="access-denied-panel">
          <div className="access-denied-icon">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <h2>Acesso Restrito a Administradores</h2>
          <p>
            Você não possui privilégios de administrador para acessar a gestão de usuários e permissões do Cronos.
            Entre em contato com um administrador do sistema para solicitar acesso.
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/dashboard');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
          >
            Voltar ao Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="orchestrator-shell">
      <div className="usuarios-container">
        {/* Hero Section */}
        <section className="orchestrator-hero">
          <div>
            <h1>Gestão de Usuários & Permissões</h1>
            <p className="intro">
              Cadastre novos usuários no sistema, defina papéis de acesso e gerencie quem pode cadastrar ou alterar permissões.
            </p>
          </div>
          <div className="hero-actions">
            <button
              className="ghost-button"
              onClick={loadData}
              disabled={isLoading}
              title="Recarregar lista"
              type="button"
            >
              <FontAwesomeIcon icon={faRotate} spin={isLoading} />
              <span>Atualizar</span>
            </button>
            <button className="primary-button" onClick={handleOpenCreate} type="button">
              <FontAwesomeIcon icon={faPlus} />
              <span>Novo Usuário</span>
            </button>
          </div>
        </section>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="error-state" role="alert">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg('')}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="success-alert" role="status">
            <span>{successMsg}</span>
            <button
              type="button"
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#14532d' }}
              onClick={() => setSuccessMsg('')}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {/* Estatísticas / Cards */}
        <div className="usuarios-stats-grid">
          <div className="stat-card">
            <span className="stat-card__label">Total de Usuários</span>
            <span className="stat-card__value">{stats.total}</span>
            <span className="stat-card__desc">Contas registradas no sistema</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Administradores</span>
            <span className="stat-card__value" style={{ color: '#5b21b6' }}>
              {stats.admins}
            </span>
            <span className="stat-card__desc">Acesso total e gestão de acessos</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Operadores</span>
            <span className="stat-card__value" style={{ color: '#0369a1' }}>
              {stats.operadores}
            </span>
            <span className="stat-card__desc">Execuções e monitoramento</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Usuários Ativos</span>
            <span className="stat-card__value" style={{ color: '#15803d' }}>
              {stats.ativos}
            </span>
            <span className="stat-card__desc">Habilitados para login</span>
          </div>
        </div>

        {/* Painel Principal com Filtros e Tabela */}
        <section className="workspace-panel">
          <div className="toolbar" style={{ gridTemplateColumns: 'minmax(240px, 1fr) 200px 180px' }}>
            <label className="search-field">
              <span>Buscar usuário</span>
              <div style={{ position: 'relative' }}>
                <input
                  type="search"
                  placeholder="Filtrar por nome ou e-mail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </label>

            <label className="select-field">
              <span>Filtrar Perfil</span>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">Todos os Perfis</option>
                <option value="admin">Administrador</option>
                <option value="operador">Operador</option>
              </select>
            </label>

            <label className="select-field">
              <span>Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Todos os Status</option>
                <option value="active">Apenas Ativos</option>
                <option value="inactive">Apenas Inativos</option>
              </select>
            </label>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="loading-state">
              <span />
              <span />
              <span />
            </div>
          )}

          {/* Lista Vazia */}
          {!isLoading && filteredUsers.length === 0 && (
            <div className="empty-state">
              <strong>Nenhum usuário encontrado</strong>
              <span>
                {search || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca acima.'
                  : 'Clique em "Novo Usuário" para cadastrar o primeiro membro da equipe.'}
              </span>
            </div>
          )}

          {/* Tabela de Usuários */}
          {!isLoading && filteredUsers.length > 0 && (
            <div className="automation-table">
              <div className="usuarios-table-head">
                <span>Usuário</span>
                <span>Perfil</span>
                <span>Permissão de Cadastro</span>
                <span>Status</span>
                <span>Último Acesso</span>
                <span style={{ textAlign: 'right' }}>Ações</span>
              </div>

              {filteredUsers.map((item) => {
                const isSelf = currentUser?.id === item.id;
                const isAdmin = item.role === 'admin';
                const canManage = isAdmin || item.pode_cadastrar_usuarios;

                return (
                  <div className="usuarios-table-row" key={item.id}>
                    {/* Identidade */}
                    <div className="user-identity">
                      <div className={`user-avatar-circle ${isAdmin ? 'is-admin' : ''}`}>
                        {item.nome ? item.nome.charAt(0).toUpperCase() : item.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">
                          {item.nome || 'Sem nome informado'}
                          {isSelf && (
                            <span
                              style={{
                                marginLeft: '6px',
                                fontSize: '10px',
                                background: '#f5f3ff',
                                color: '#5b21b6',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              Você
                            </span>
                          )}
                        </span>
                        <span className="user-email">{item.email}</span>
                      </div>
                    </div>

                    {/* Perfil (Role) */}
                    <div>
                      {isAdmin ? (
                        <span className="role-badge admin">
                          <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: '10px' }} />
                          Administrador
                        </span>
                      ) : (
                        <span className="role-badge operador">
                          <FontAwesomeIcon icon={faUserGear} style={{ fontSize: '10px' }} />
                          Operador
                        </span>
                      )}
                    </div>

                    {/* Permissão de Cadastro */}
                    <div>
                      {canManage ? (
                        <span className="permission-badge can-manage" title="Pode criar e gerenciar usuários">
                          <FontAwesomeIcon icon={faCheck} style={{ fontSize: '9px' }} />
                          Pode cadastrar
                        </span>
                      ) : (
                        <span className="permission-badge cannot-manage" title="Não possui permissão para gerenciar usuários">
                          Apenas acesso
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      {item.ativo ? (
                        <span className="status-badge active">
                          <span className="status-dot" />
                          Ativo
                        </span>
                      ) : (
                        <span className="status-badge inactive">
                          <span className="status-dot" />
                          Inativo
                        </span>
                      )}
                    </div>

                    {/* Último Login */}
                    <div className="last-login-text">{formatDate(item.ultimo_login)}</div>

                    {/* Ações */}
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="action-btn-sm edit"
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        title="Editar usuário e permissões"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>

                      <button
                        className="action-btn-sm delete"
                        type="button"
                        onClick={() => handleDeleteUser(item)}
                        disabled={isSelf}
                        title={isSelf ? 'Você não pode excluir sua própria conta' : 'Excluir usuário'}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal de Criação / Edição de Usuário */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => !isSaving && setModalOpen(false)}>
          <div
            className="confirmation-modal"
            style={{ width: 'min(100%, 540px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--color-ink)' }}>
                {editingUser ? 'Editar Usuário & Permissões' : 'Cadastrar Novo Usuário'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--color-muted)' }}>
              {editingUser
                ? `Altere as informações, cargo e privilégios de ${editingUser.email}.`
                : 'Preencha os dados abaixo para conceder acesso ao Cronos para um novo colaborador.'}
            </p>

            {formError && (
              <div className="error-state" style={{ marginBottom: '14px', padding: '10px 12px' }}>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="modal-form-grid">
              <div className="form-group">
                <label>Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Ana Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>E-mail de Acesso *</label>
                <input
                  type="email"
                  placeholder="Ex: ana.silva@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  {editingUser ? 'Nova Senha (opcional)' : 'Senha Inicial *'}
                </label>
                <div className="input-with-action">
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingUser ? 'Deixe em branco para manter a atual' : 'Mínimo de 6 caracteres'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={editingUser ? undefined : 6}
                      required={!editingUser}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                      }}
                      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="input-action-btn"
                    onClick={generateRandomPassword}
                    title="Gerar uma senha segura automaticamente"
                  >
                    <FontAwesomeIcon icon={faKey} />
                    <span>Gerar</span>
                  </button>
                </div>
                {editingUser && (
                  <span className="field-hint">Preencha apenas se desejar redefinir a senha deste usuário.</span>
                )}
              </div>

              {/* Seletor de Perfil */}
              <div className="form-group">
                <label>Perfil de Acesso (Cargo) *</label>
                <select
                  value={role}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    setRole(newRole);
                    if (newRole === 'admin') {
                      setPodeCadastrar(true);
                    }
                  }}
                  disabled={editingUser?.id === currentUser?.id}
                >
                  <option value="operador">Operador (Execução e visualização)</option>
                  <option value="admin">Administrador (Controle completo)</option>
                </select>
                {editingUser?.id === currentUser?.id && (
                  <span className="field-hint">Você não pode alterar seu próprio perfil de Administrador.</span>
                )}
              </div>

              {/* Gestão de Permissão Específica: Pode Cadastrar Usuários */}
              <label
                className="switch-box"
                style={{
                  opacity: role === 'admin' ? 0.85 : 1,
                  background: role === 'admin' ? '#faf5ff' : '#f8fafc',
                  borderColor: role === 'admin' ? '#ddd6fe' : 'var(--color-line)',
                }}
              >
                <input
                  type="checkbox"
                  checked={role === 'admin' ? true : podeCadastrar}
                  disabled={role === 'admin'}
                  onChange={(e) => setPodeCadastrar(e.target.checked)}
                />
                <div className="switch-box-content">
                  <span className="switch-box-title">
                    Permissão para cadastrar novos usuários
                  </span>
                  <span className="switch-box-desc">
                    {role === 'admin'
                      ? 'Administradores possuem permissão irrestrita para cadastrar e gerenciar usuários por padrão.'
                      : 'Permite que este operador acesse a tela de usuários e cadastre novos operadores no sistema.'}
                  </span>
                </div>
              </label>

              {/* Status da Conta */}
              <label className="switch-box">
                <input
                  type="checkbox"
                  checked={ativo}
                  disabled={editingUser?.id === currentUser?.id}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                <div className="switch-box-content">
                  <span className="switch-box-title">Conta ativa no Cronos</span>
                  <span className="switch-box-desc">
                    {editingUser?.id === currentUser?.id
                      ? 'Você não pode desativar sua própria conta ativa.'
                      : 'Se desmarcado, o usuário não conseguirá realizar login na plataforma.'}
                  </span>
                </div>
              </label>

              <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
