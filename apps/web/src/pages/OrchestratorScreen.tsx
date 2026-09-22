import { useMemo, useState } from 'react';
import './orchestrator.css';

type AutomationStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';
type ExecutionType = 'diário' | 'mensal' | 'semanal' | 'personalizado';
type ProcessType = 'concorrência' | 'background';

type Automation = {
    idAutomacao: string;
    nome: string;
    descricaoAutomacao: string;
    horarioTrigger: string;
    tipoExecucao: ExecutionType;
    inicioExecucao: string;
    fimExecucao: string;
    ultStatus: AutomationStatus;
    tipoProcesso: ProcessType;
    departamento: string;
    responsavel: string;
    ultimaMensagem: string;
    etapas: string[];
};

const automations: Automation[] = [
    {
        idAutomacao: 'AUT-001',
        nome: 'Sincronização de leads CRM',
        descricaoAutomacao: 'Importa leads novos, normaliza campos e distribui oportunidades para a fila comercial.',
        horarioTrigger: '08:00',
        tipoExecucao: 'diário',
        inicioExecucao: '22/09/2026 08:02',
        fimExecucao: '22/09/2026 08:05',
        ultStatus: 'completed',
        tipoProcesso: 'background',
        departamento: 'Comercial',
        responsavel: 'Equipe Comercial',
        ultimaMensagem: 'Execução concluída com 248 registros processados.',
        etapas: ['Buscar novos registros', 'Validar dados obrigatórios', 'Enviar para CRM', 'Notificar responsáveis'],
    },
    {
        idAutomacao: 'AUT-002',
        nome: 'Processamento de pagamentos',
        descricaoAutomacao: 'Consulta transações pendentes, aplica regras de conciliação e atualiza o status financeiro.',
        horarioTrigger: 'A cada 30 min',
        tipoExecucao: 'personalizado',
        inicioExecucao: '22/09/2026 13:30',
        fimExecucao: '22/09/2026 13:47',
        ultStatus: 'running',
        tipoProcesso: 'concorrência',
        departamento: 'Financeiro',
        responsavel: 'Controladoria',
        ultimaMensagem: 'Conciliação em lote ainda em processamento.',
        etapas: ['Consultar gateway', 'Conciliar cobranças', 'Atualizar faturas', 'Gerar evento realtime'],
    },
    {
        idAutomacao: 'AUT-003',
        nome: 'Relatório operacional',
        descricaoAutomacao: 'Consolida indicadores semanais e prepara o pacote de acompanhamento para gestores.',
        horarioTrigger: 'Segunda, 09:00',
        tipoExecucao: 'semanal',
        inicioExecucao: '21/09/2026 09:01',
        fimExecucao: '21/09/2026 09:07',
        ultStatus: 'idle',
        tipoProcesso: 'background',
        departamento: 'Operações',
        responsavel: 'Gestão Operacional',
        ultimaMensagem: 'Pronta para a próxima janela semanal.',
        etapas: ['Coletar métricas', 'Calcular indicadores', 'Montar sumário', 'Arquivar resultado'],
    },
    {
        idAutomacao: 'AUT-004',
        nome: 'Estoque integrado',
        descricaoAutomacao: 'Sincroniza a disponibilidade entre fornecedores, sistema interno e canais de venda.',
        horarioTrigger: 'A cada 2 h',
        tipoExecucao: 'personalizado',
        inicioExecucao: '22/09/2026 12:00',
        fimExecucao: '22/09/2026 12:01',
        ultStatus: 'failed',
        tipoProcesso: 'concorrência',
        departamento: 'Logística',
        responsavel: 'Suprimentos',
        ultimaMensagem: 'Fornecedor principal retornou timeout na consulta de saldos.',
        etapas: ['Consultar fornecedores', 'Comparar saldos', 'Aplicar reservas', 'Publicar estoque'],
    },
    {
        idAutomacao: 'AUT-005',
        nome: 'Lembretes de tarefas',
        descricaoAutomacao: 'Agrupa tarefas que vencem no dia e envia lembretes para os responsáveis de cada fila.',
        horarioTrigger: '18:30',
        tipoExecucao: 'diário',
        inicioExecucao: '15/09/2026 18:30',
        fimExecucao: '15/09/2026 18:32',
        ultStatus: 'paused',
        tipoProcesso: 'background',
        departamento: 'Atendimento',
        responsavel: 'Central de Atendimento',
        ultimaMensagem: 'Automação pausada aguardando revisão de mensagem.',
        etapas: ['Ler tarefas abertas', 'Agrupar por responsável', 'Montar mensagem', 'Registrar envio'],
    },
    {
        idAutomacao: 'AUT-006',
        nome: 'Fechamento mensal de indicadores',
        descricaoAutomacao: 'Consolida dados de desempenho e gera o pacote final para análise executiva.',
        horarioTrigger: 'Último dia, 23:00',
        tipoExecucao: 'mensal',
        inicioExecucao: '31/08/2026 23:00',
        fimExecucao: '31/08/2026 23:18',
        ultStatus: 'completed',
        tipoProcesso: 'background',
        departamento: 'Diretoria',
        responsavel: 'BI Corporativo',
        ultimaMensagem: 'Pacote mensal arquivado e disponível para consulta.',
        etapas: ['Coletar bases', 'Validar consistência', 'Gerar indicadores', 'Publicar pacote'],
    },
];

const statusLabels: Record<AutomationStatus, string> = {
    idle: 'Pronto',
    running: 'Executando',
    completed: 'Concluído',
    failed: 'Falhou',
    paused: 'Pausado',
};

const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'running', label: 'Executando' },
    { value: 'completed', label: 'Concluídos' },
    { value: 'failed', label: 'Falhas' },
    { value: 'idle', label: 'Prontos' },
    { value: 'paused', label: 'Pausados' },
];

export function OrchestratorScreen() {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(automations[0].idAutomacao);
    const [pendingRun, setPendingRun] = useState<Automation | null>(null);
    const [lastRunMessage, setLastRunMessage] = useState('');

    const filteredAutomations = useMemo(() => {
        return automations.filter((automation) => {
            const matchesStatus = statusFilter === 'all' || automation.ultStatus === statusFilter;
            const searchable = [
                automation.idAutomacao,
                automation.nome,
                automation.descricaoAutomacao,
                automation.departamento,
                automation.tipoExecucao,
                automation.tipoProcesso,
            ].join(' ').toLowerCase();

            return matchesStatus && searchable.includes(query.trim().toLowerCase());
        });
    }, [query, statusFilter]);

    function simulateLoading() {
        setHasError(false);
        setIsLoading(true);
        window.setTimeout(() => setIsLoading(false), 750);
    }

    function simulateError() {
        setIsLoading(false);
        setHasError(true);
    }

    function toggleAutomation(automationId: string) {
        setSelectedAutomationId((currentId) => currentId === automationId ? null : automationId);
    }

    function confirmRun() {
        if (!pendingRun) return;
        setLastRunMessage(`Execução de "${pendingRun.nome}" disparada com sucesso.`);
        setSelectedAutomationId(pendingRun.idAutomacao);
        setPendingRun(null);
    }

    return (
        <div>
            <section className="orchestrator-hero">
                <div>
                    <p className="eyebrow">Cronos Orquestrador</p>
                    <h1>Orquestrações cadastradas</h1>
                    <p className="intro">
                        Acompanhe automações, monitore status e dispare fluxos operacionais em uma única tela.
                    </p>
                </div>
                <div className="hero-actions" aria-label="Ações da tela">
                    <button className="ghost-button" type="button" onClick={simulateError}>
                        Simular erro
                    </button>
                    <button className="primary-button" type="button" onClick={simulateLoading}>
                        Atualizar lista
                    </button>
                </div>
            </section>

            <section className="workspace-panel">
                <div className="toolbar">
                    <label className="search-field">
                        <span>Buscar</span>
                        <input
                            type="search"
                            placeholder="ID, nome, descrição ou departamento"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </label>
                    <label className="select-field">
                        <span>Status</span>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {lastRunMessage && <div className="success-alert">{lastRunMessage}</div>}
                {hasError && (
                    <div className="error-state" role="alert">
                        <strong>Não foi possível carregar as orquestrações.</strong>
                        <span>Verifique a API ou tente atualizar novamente.</span>
                        <button type="button" onClick={simulateLoading}>Tentar novamente</button>
                    </div>
                )}

                {isLoading ? (
                    <div className="loading-state" aria-label="Carregando orquestrações">
                        <span />
                        <span />
                        <span />
                    </div>
                ) : (
                    <section className="automation-table" aria-label="Lista de automações">
                        <div className="automation-table-scroll">
                            <div className="automation-head">
                                <span>ID</span>
                                <span>Nome</span>
                                <span>Horário trigger</span>
                                <span>Tipo execução</span>
                                <span>Início execução</span>
                                <span>Fim execução</span>
                                <span>Últ. status</span>
                                <span>Tipo processo</span>
                                <span>Departamento</span>
                            </div>

                            {filteredAutomations.map((automation) => {
                                const isSelected = selectedAutomationId === automation.idAutomacao;

                                return (
                                    <div className="automation-entry" key={automation.idAutomacao}>
                                        <button
                                            className={isSelected ? 'automation-row selected' : 'automation-row'}
                                            type="button"
                                            onClick={() => toggleAutomation(automation.idAutomacao)}
                                            aria-expanded={isSelected}
                                        >
                                            <span>{automation.idAutomacao}</span>
                                            <strong>{automation.nome}</strong>
                                            <span>{automation.horarioTrigger}</span>
                                            <span>{automation.tipoExecucao}</span>
                                            <span>{automation.inicioExecucao}</span>
                                            <span>{automation.fimExecucao}</span>
                                            <span className={`status-pill ${automation.ultStatus}`}>{statusLabels[automation.ultStatus]}</span>
                                            <span>{automation.tipoProcesso}</span>
                                            <span>{automation.departamento}</span>
                                        </button>

                                        {isSelected && (
                                            <article className="expanded-card">
                                                <div className="expanded-summary">
                                                    <span className={`status-pill ${automation.ultStatus}`}>{statusLabels[automation.ultStatus]}</span>
                                                    <h2>{automation.nome}</h2>
                                                    <p>{automation.descricaoAutomacao}</p>
                                                    <strong>{automation.ultimaMensagem}</strong>
                                                </div>
                                                <dl>
                                                    <div><dt>Responsável</dt><dd>{automation.responsavel}</dd></div>
                                                    <div><dt>Tipo de execução</dt><dd>{automation.tipoExecucao}</dd></div>
                                                    <div><dt>Processo</dt><dd>{automation.tipoProcesso}</dd></div>
                                                    <div><dt>Departamento</dt><dd>{automation.departamento}</dd></div>
                                                </dl>
                                                <div className="expanded-actions">
                                                    <button className="primary-button" type="button" onClick={() => setPendingRun(automation)}>
                                                        Disparar execução
                                                    </button>
                                                </div>
                                            </article>
                                        )}
                                    </div>
                                );
                            })}

                            {filteredAutomations.length === 0 && (
                                <div className="empty-state">
                                    <strong>Nenhuma orquestração encontrada.</strong>
                                    <span>Ajuste a busca ou altere o filtro de status.</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </section>

            {pendingRun && (
                <div className="modal-backdrop" role="presentation">
                    <section className="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="run-title">
                        <span className={`status-pill ${pendingRun.ultStatus}`}>{statusLabels[pendingRun.ultStatus]}</span>
                        <h2 id="run-title">Disparar execução?</h2>
                        <p>
                            O fluxo <strong>{pendingRun.nome}</strong> será executado agora e registrado no histórico de eventos.
                        </p>
                        <div className="modal-actions">
                            <button className="ghost-button" type="button" onClick={() => setPendingRun(null)}>Cancelar</button>
                            <button className="primary-button" type="button" onClick={confirmRun}>Confirmar</button>
                        </div>
                    </section>
                </div>
            )}
        </div>

    );
}
