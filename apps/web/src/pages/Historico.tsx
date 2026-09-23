import { useEffect, useState } from 'react';
import './Historico.css';

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

function getStatusClass(status: string): string {
    if (status === 'Concluído') return 'status-completed';
    if (status === 'Em andamento') return 'status-running';
    if (status === 'Erro') return 'status-error';
    if (status === 'Parado') return 'status-parado';
    return 'status-unknown';
}

export default function Historico() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const execucoes = [
        { id: 1, nome: 'Sincronização de dados', departamento: 'Tecnologia', inicio: '22/09/2026 08:00:12', fim: '22/09/2026 08:04:37', status: 'Concluído' },
        { id: 2, nome: 'Processamento financeiro', departamento: 'Financeiro', inicio: '22/09/2026 09:15:04', fim: '22/09/2026 09:18:29', status: 'Concluído' },
        { id: 3, nome: 'Envio de relatórios', departamento: 'Operações', inicio: '22/09/2026 10:30:21', fim: '—', status: 'Em andamento' },
        { id: 4, nome: 'Backup de dados', departamento: 'Tecnologia', inicio: '22/09/2026 11:45:30', fim: '22/09/2026 11:48:15', status: 'Concluído' },
        { id: 5, nome: 'Atualização de sistema', departamento: 'Tecnologia', inicio: '22/09/2026 12:00:00', fim: '22/09/2026 12:05:45', status: 'Concluído' },
        { id: 6, nome: 'Revisão de contratos', departamento: 'Jurídico', inicio: '22/09/2026 13:20:10', fim: '22/09/2026 13:25:55', status: 'Concluído' },
        { id: 7, nome: 'Treinamento de equipe', departamento: 'Recursos Humanos', inicio: '22/09/2026 14:10:05', fim: '22/09/2026 14:15:30', status: 'Parado' },
        { id: 8, nome: 'Análise de desempenho', departamento: 'Recursos Humanos', inicio: '22/09/2026 15:30:45', fim: '22/09/2026 15:35:20', status: 'Concluído' },
        { id: 9, nome: 'Reunião de planejamento', departamento: 'Gestão', inicio: '22/09/2026 16:00:00', fim: '22/09/2026 16:30:00', status: 'Concluído' },
        { id: 10, nome: 'Auditoria interna', departamento: 'Auditoria', inicio: '22/09/2026 17:15:30', fim: '22/09/2026 17:20:45', status: 'Erro' },

    ];

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');
    const execucoesFiltradas = execucoes.filter((execucao) => {
        const matchesSearch = !normalizedSearch || [
            execucao.id,
            execucao.nome,
            execucao.departamento,
            execucao.status,
        ].some((valor) => String(valor).toLocaleLowerCase('pt-BR').includes(normalizedSearch));

        const matchesStatus = !statusFilter || execucao.status === statusFilter;
        const matchesDepartment = !departmentFilter || execucao.departamento === departmentFilter;

        return matchesSearch && matchesStatus && matchesDepartment;
    });

    const totalPages = Math.max(1, Math.ceil(execucoesFiltradas.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const firstItemIndex = (safeCurrentPage - 1) * itemsPerPage;
    const execucoesPaginadas = execucoesFiltradas.slice(firstItemIndex, firstItemIndex + itemsPerPage);
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
        .filter((page) => Math.abs(page - safeCurrentPage) <= 2 || page === 1 || page === totalPages);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, departmentFilter]);

    return (
        <div className="history-container">
            {/* Header Premium sem logotipo centralizado */}
            <header className="history-header">
                <div className="history-header-left">
                    <h1 className="history-title">Historico</h1>
                    <p className="history-subtitle">
                        Histórico das execuções • {formatDate()}
                    </p>
                </div>
            </header>

            <section className="history-filters" aria-label="Filtros do histórico">
                <div className="history-filter history-filter-search">
                    <label htmlFor="history-search">Pesquisar</label>
                    <input
                        id="history-search"
                        type="search"
                        placeholder="Nome da execução..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>

                <div className="history-filter">
                    <label htmlFor="history-status">Status</label>
                    <select
                        id="history-status"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        <option value="">Todos os status</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Erro">Erro</option>
                        <option value="Parado">Parado</option>
                    </select>
                </div>

                <div className="history-filter">
                    <label htmlFor="history-start-date">Data inicial</label>
                    <input id="history-start-date" type="date" />
                </div>

                <div className="history-filter">
                    <label htmlFor="history-end-date">Data final</label>
                    <input id="history-end-date" type="date" />
                </div>

                <div className="history-filter">
                    <label htmlFor="history-department">Departamento</label>
                    <select
                        id="history-department"
                        value={departmentFilter}
                        onChange={(event) => setDepartmentFilter(event.target.value)}
                    >
                        <option value="">Todos os departamentos</option>
                        <option value="Tecnologia">Tecnologia</option>
                        <option value="Financeiro">Financeiro</option>
                        <option value="Operações">Operações</option>
                        <option value="Jurídico">Jurídico</option>
                        <option value="Recursos Humanos">Recursos Humanos</option>
                        <option value="Gestão">Gestão</option>
                        <option value="Auditoria">Auditoria</option>
                    </select>
                </div>

                <button className="history-filter-button" type="button">
                    Filtrar
                </button>
            </section>

            <section className="history-table-section">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Departamento</th>
                            <th>Início</th>
                            <th>Fim</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {execucoesPaginadas.map((execucao) => (
                            <tr key={execucao.id}>
                                <td>{execucao.id}</td>
                                <td>{execucao.nome}</td>
                                <td>{execucao.departamento}</td>
                                <td>{execucao.inicio}</td>
                                <td>{execucao.fim}</td>
                                <td>
                                    <span className={`status-badge ${getStatusClass(execucao.status)}`}>
                                        {execucao.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {execucoesFiltradas.length === 0 && (
                            <tr>
                                <td className="history-empty" colSpan={6}>
                                    Nenhuma execução encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <nav className="history-pagination" aria-label="Paginação do histórico">
                <span>
                    {execucoesFiltradas.length} registros
                </span>
                <div className="history-pagination-actions">
                    <button
                        className="history-pagination-button"
                        type="button"
                        title="Ir para a primeira página"
                        aria-label="Ir para a primeira página"
                        disabled={safeCurrentPage === 1}
                        onClick={() => setCurrentPage(1)}
                    >
                        «
                    </button>
                    <button
                        className="history-pagination-button"
                        type="button"
                        title="Página anterior"
                        aria-label="Página anterior"
                        disabled={safeCurrentPage === 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                        ‹
                    </button>
                    {pageNumbers.map((page) => (
                        <button
                            className={`history-pagination-button${page === safeCurrentPage ? ' active' : ''}`}
                            type="button"
                            aria-label={`Ir para a página ${page}`}
                            aria-current={page === safeCurrentPage ? 'page' : undefined}
                            key={page}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        className="history-pagination-button"
                        type="button"
                        title="Próxima página"
                        aria-label="Próxima página"
                        disabled={safeCurrentPage === totalPages}
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    >
                        ›
                    </button>
                    <button
                        className="history-pagination-button"
                        type="button"
                        title="Ir para a última página"
                        aria-label="Ir para a última página"
                        disabled={safeCurrentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                    >
                        »
                    </button>
                </div>
            </nav>
        </div>

    )
}