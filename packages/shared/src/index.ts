export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BaseJob {
  id: string;
  name: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type AutomationEventType = 'realtime.connected' | 'automation.command' | 'automation.status';

export interface AutomationEvent<T = unknown> {
  type: AutomationEventType;
  occurredAt: string;
  payload?: T;
}

// -----------------------------------------------------------------------------
// Entidades do Banco de Dados Cronos
// -----------------------------------------------------------------------------

export interface Automacao {
  id: number;
  nome: string;
  descricao?: string | null;
  caminho_exe: string;
  departamento: string;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

export interface Maquina {
  id: number;
  nome: string;
  secret: string;
  ativo: boolean;
  ip_address?: string | null;
  ultima_conexao?: string | null;
  data_criacao: string;
  data_atualizacao: string;
}

export type TipoGatilho = 'diario' | 'semanal' | 'mensal';
export type RegraDiaUtil = 'manter' | 'postergar' | 'adiantar';

export interface Gatilho {
  id: number;
  automacao_id: number;
  maquina_id: number;
  tipo: TipoGatilho;
  dia_execucao?: number | null;
  horario_execucao: string; // formato HH:mm:ss
  regra_dia_util: RegraDiaUtil;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

export type StatusHistorico = 'sucesso' | 'pendente' | 'erro' | 'parado' | 'em_execucao';
export type TipoDisparoHistorico = 'manual' | 'gatilho';

export interface Historico {
  id: number;
  automacao_id: number;
  maquina_id?: number | null;
  gatilho_id?: number | null;
  data_inicio: string;
  data_fim?: string | null;
  status: StatusHistorico;
  erro?: string | null;
  tipo: TipoDisparoHistorico;
  criado_em: string;
}
