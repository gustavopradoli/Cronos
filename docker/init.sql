-- =============================================================================
-- CRONOS ORCHESTRATOR - SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS (PostgreSQL 16)
-- Executado automaticamente no primeiro boot do container PostgreSQL (docker-entrypoint-initdb.d)
-- =============================================================================

-- Habilita extensões para UUID e funções criptográficas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função utilitária para atualizar automaticamente a coluna data_atualizacao
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. TABELA: automacoes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automacoes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(500),
    caminho_exe VARCHAR(500) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_automacoes_updated_at
BEFORE UPDATE ON automacoes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE automacoes IS 'Armazena os robôs e processos automatizados cadastrados no orquestrador';
COMMENT ON COLUMN automacoes.id IS 'Identificador único da automação (PK)';
COMMENT ON COLUMN automacoes.nome IS 'Nome de exibição amigável da automação';
COMMENT ON COLUMN automacoes.descricao IS 'Descrição detalhada das funções do robô';
COMMENT ON COLUMN automacoes.caminho_exe IS 'Caminho completo do arquivo executável (.exe) na máquina do agente';
COMMENT ON COLUMN automacoes.departamento IS 'Departamento responsável ou proprietário da automação (ex: Financeiro, TI, Fiscal)';
COMMENT ON COLUMN automacoes.ativo IS 'Indica se a automação está habilitada para execução';
COMMENT ON COLUMN automacoes.data_criacao IS 'Data e hora do cadastro no formato com timezone';

-- -----------------------------------------------------------------------------
-- 2. TABELA: maquinas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maquinas (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    secret VARCHAR(255) NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address VARCHAR(45),
    ultima_conexao TIMESTAMPTZ,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_maquinas_updated_at
BEFORE UPDATE ON maquinas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE maquinas IS 'Armazena as máquinas clientes/runners que executam as automações';
COMMENT ON COLUMN maquinas.id IS 'Identificador único da máquina (PK)';
COMMENT ON COLUMN maquinas.nome IS 'Nome/Hostname identificador da máquina';
COMMENT ON COLUMN maquinas.secret IS 'Token/segredo único de autenticação para comunicação segura com o orquestrador';
COMMENT ON COLUMN maquinas.ativo IS 'Flag booleana indicando se a máquina está ativa (substitui flg_ativa)';
COMMENT ON COLUMN maquinas.ultima_conexao IS 'Registro do último ping/heartbeat recebido do cliente';

-- -----------------------------------------------------------------------------
-- 3. TABELA: gatilhos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gatilhos (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    automacao_id INTEGER NOT NULL REFERENCES automacoes(id) ON DELETE CASCADE,
    maquina_id INTEGER NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('diario', 'semanal', 'mensal')),
    dia_execucao SMALLINT CHECK (dia_execucao BETWEEN 1 AND 31),
    horario_execucao TIME NOT NULL,
    regra_dia_util VARCHAR(20) NOT NULL DEFAULT 'manter' CHECK (regra_dia_util IN ('manter', 'postergar', 'adiantar')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_gatilhos_updated_at
BEFORE UPDATE ON gatilhos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE gatilhos IS 'Configurações de agendamentos recorrentes (triggers) das automações';
COMMENT ON COLUMN gatilhos.id IS 'Identificador único do gatilho (PK)';
COMMENT ON COLUMN gatilhos.automacao_id IS 'FK referenciando automacoes(id)';
COMMENT ON COLUMN gatilhos.maquina_id IS 'FK referenciando maquinas(id) onde será executado';
COMMENT ON COLUMN gatilhos.tipo IS 'Periodicidade do agendamento (diario, semanal, mensal)';
COMMENT ON COLUMN gatilhos.dia_execucao IS 'Dia da execução: 1-7 (segunda a domingo) para semanal, ou 1-31 para mensal';
COMMENT ON COLUMN gatilhos.horario_execucao IS 'Horário exato da execução diária/agendada (ex: 08:30:00)';
COMMENT ON COLUMN gatilhos.regra_dia_util IS 'Estratégia para feriados e fins de semana: manter, postergar ou adiantar';
COMMENT ON COLUMN gatilhos.ativo IS 'Indica se o agendamento está ativo';

-- -----------------------------------------------------------------------------
-- 4. TABELA: historico
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    automacao_id INTEGER NOT NULL REFERENCES automacoes(id) ON DELETE CASCADE,
    maquina_id INTEGER REFERENCES maquinas(id) ON DELETE SET NULL,
    gatilho_id INTEGER REFERENCES gatilhos(id) ON DELETE SET NULL,
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('sucesso', 'pendente', 'erro', 'parado', 'em_execucao')),
    erro TEXT,
    tipo VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (tipo IN ('manual', 'gatilho')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE historico IS 'Log e histórico de todas as execuções de robôs no sistema';
COMMENT ON COLUMN historico.id IS 'Identificador do registro de execução (PK em BIGINT para auditoria)';
COMMENT ON COLUMN historico.automacao_id IS 'FK referenciando automacoes(id)';
COMMENT ON COLUMN historico.maquina_id IS 'FK referenciando maquinas(id). Mantém histórico mesmo se a máquina for removida';
COMMENT ON COLUMN historico.gatilho_id IS 'FK referenciando gatilhos(id), caso a execução tenha sido gerada por um gatilho';
COMMENT ON COLUMN historico.data_inicio IS 'Timestamp de início da execução';
COMMENT ON COLUMN historico.data_fim IS 'Timestamp de término ou interrupção (NULL enquanto estiver em andamento)';
COMMENT ON COLUMN historico.status IS 'Status da execução: sucesso, pendente, erro, parado ou em_execucao';
COMMENT ON COLUMN historico.erro IS 'Mensagem de erro, logs detalhados e stack trace completo quando houver falha';
COMMENT ON COLUMN historico.tipo IS 'Origem do disparo: manual ou gatilho';

-- -----------------------------------------------------------------------------
-- ÍNDICES PARA OTIMIZAÇÃO DE BUSCAS E JOINS
-- -----------------------------------------------------------------------------
-- Índices para automacoes
CREATE INDEX IF NOT EXISTS idx_automacoes_departamento ON automacoes(departamento);
CREATE INDEX IF NOT EXISTS idx_automacoes_ativo ON automacoes(ativo);

-- Índices para maquinas
CREATE INDEX IF NOT EXISTS idx_maquinas_nome ON maquinas(nome);
CREATE INDEX IF NOT EXISTS idx_maquinas_ativo ON maquinas(ativo);

-- Índices para gatilhos
CREATE INDEX IF NOT EXISTS idx_gatilhos_automacao_id ON gatilhos(automacao_id);
CREATE INDEX IF NOT EXISTS idx_gatilhos_maquina_id ON gatilhos(maquina_id);
CREATE INDEX IF NOT EXISTS idx_gatilhos_tipo_ativo ON gatilhos(tipo, ativo);

-- Índices para historico
CREATE INDEX IF NOT EXISTS idx_historico_automacao_id ON historico(automacao_id);
CREATE INDEX IF NOT EXISTS idx_historico_maquina_id ON historico(maquina_id);
CREATE INDEX IF NOT EXISTS idx_historico_status ON historico(status);
CREATE INDEX IF NOT EXISTS idx_historico_data_inicio ON historico(data_inicio DESC);

-- -----------------------------------------------------------------------------
-- 5. TABELA: usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_login TIMESTAMPTZ,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE usuarios IS 'Armazena os usuários de acesso ao sistema Cronos';
COMMENT ON COLUMN usuarios.id IS 'Identificador único do usuário (PK)';
COMMENT ON COLUMN usuarios.nome IS 'Nome completo ou de exibição do usuário';
COMMENT ON COLUMN usuarios.email IS 'E-mail único utilizado para autenticação';
COMMENT ON COLUMN usuarios.senha_hash IS 'Hash seguro da senha do usuário gerado com bcrypt';
COMMENT ON COLUMN usuarios.ativo IS 'Indica se a conta do usuário está ativa';
COMMENT ON COLUMN usuarios.ultimo_login IS 'Registro do último acesso efetuado pelo usuário';

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- Usuário Administrador Padrão (Senha padrão: admin123)
INSERT INTO usuarios (nome, email, senha_hash, ativo)
VALUES (
    'Administrador Cronos',
    'admin@cronos.com',
    crypt('admin123', gen_salt('bf', 10)),
    TRUE
)
ON CONFLICT (email) DO NOTHING;

