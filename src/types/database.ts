// Tipos espelhando o schema em supabase/migrations/0001_init.sql.
// Mantidos manualmente por enquanto; quando o projeto Supabase existir,
// trocar por tipos gerados via `supabase gen types typescript`.

export type PapelUsuario = 'tecnico' | 'coordenador' | 'admin';

export type StatusComissionamento =
  | 'em_andamento'
  | 'liberado'
  | 'em_montagem'
  | 'liberado_com_ressalvas'
  | 'nao_liberado';

export type StatusChecklistItem = 'OK' | 'NOK' | 'N/A';
export type RealizadoPael = 'SIM' | 'NAO' | 'N/A';
export type TipoLiberacao = 'total' | 'parcial';

export interface Distribuidora {
  id: string;
  sigla: string;
  nome: string;
}

export interface Subestacao {
  id: string;
  distribuidora_id: string;
  nome: string;
  sigla: string;
  regional: string | null;
  centro_de_custo: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface TipoEquipamento {
  id: string;
  codigo: string;
  descricao: string;
}

export interface Equipamento {
  id: string;
  subestacao_id: string;
  tipo_equipamento_id: string;
  codigo_operacional: string | null;
  fabricante: string | null;
  modelo: string | null;
  tensao: string | null;
  part_number: string | null;
  numero_serie: string | null;
  ano_fabricacao: number | null;
  data_energizacao: string | null;
  campos_especificos: Record<string, unknown>;
  atualizado_em: string;
}

export interface EquipamentoFoto {
  id: string;
  equipamento_id: string;
  tipo: 'placa' | 'foto_1' | 'foto_2' | 'foto_3';
  storage_path: string;
  latitude: number | null;
  longitude: number | null;
  capturado_em: string;
  ocr_resultado: PlacaOcrResultado | null;
}

// Campos que a Edge Function de OCR tenta extrair da placa de
// identificação do equipamento (relé/medidor/retificador).
export interface PlacaOcrResultado {
  fabricante?: string;
  modelo?: string;
  numero_serie?: string;
  part_number?: string;
  confianca?: number;
}

export interface Comissionamento {
  id: string;
  subestacao_id: string;
  equipamento_principal_id: string | null;
  codigo_operacional: string | null;
  tipo_obra: string | null;
  responsavel_comissionamento: string | null;
  responsavel_tecnico: string | null;
  pep_obra: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  houve_atraso: boolean;
  motivo_atraso: string | null;
  status: StatusComissionamento;
}

export interface ChecklistItemExecucao {
  id: string;
  comissionamento_id: string;
  item_template_id: string;
  status: StatusChecklistItem | null;
  observacao: string | null;
}

export interface PaelEtapaExecucao {
  id: string;
  comissionamento_id: string;
  etapa_template_id: string;
  realizado: RealizadoPael | null;
  observacao: string | null;
}

export interface Liberacao {
  id: string;
  comissionamento_id: string;
  numero_lpe: string;
  tipo: TipoLiberacao;
  data: string;
  gerencia: string | null;
  protecao_liberada: boolean;
  medicao_liberada: boolean;
  comunicacao_liberada: boolean;
  nao_conformidades: string | null;
  responsavel_coordenacao: string | null;
  visto_gerencia: string | null;
}

export interface Perfil {
  id: string;
  nome: string;
  matricula: string | null;
  papel: PapelUsuario;
}
