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

function formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export default function Historico() {
    const execucoes = [
        { id: 1, nome: 'Sincronização de dados', departamento: 'Tecnologia', inicio: '08:00:12', fim: '08:04:37', status: 'Concluído' },
        { id: 2, nome: 'Processamento financeiro', departamento: 'Financeiro', inicio: '09:15:04', fim: '09:18:29', status: 'Concluído' },
        { id: 3, nome: 'Envio de relatórios', departamento: 'Operações', inicio: '10:30:21', fim: '—', status: 'Em andamento' },
    ];

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
                        {execucoes.map((execucao) => (
                            <tr key={execucao.id}>
                                <td>{execucao.id}</td>
                                <td>{execucao.nome}</td>
                                <td>{execucao.departamento}</td>
                                <td>{execucao.inicio}</td>
                                <td>{execucao.fim}</td>
                                <td>{execucao.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>

    )
}