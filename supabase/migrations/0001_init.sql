-- SPCS - Automação
-- Schema inicial, baseado no mapeamento dos 4 documentos-fonte
-- (Cadastro de Automação, Checklist, Liberação/LPE, Painel/PAEL)
-- Projeto Supabase novo e separado do prolux-field-dashboard.

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. Núcleo comum: distribuidoras, subestações, equipamentos
-- =========================================================

create table distribuidoras (
  id uuid primary key default gen_random_uuid(),
  sigla text not null unique,        -- ex: EQTL MA, EQTL PI, EQTL PA, EQTL AL
  nome text not null,
  created_at timestamptz not null default now()
);

create table subestacoes (
  id uuid primary key default gen_random_uuid(),
  distribuidora_id uuid not null references distribuidoras(id),
  nome text not null,
  sigla text not null,
  regional text,
  centro_de_custo text,
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  created_at timestamptz not null default now(),
  unique (distribuidora_id, sigla)
);

-- Tipos de equipamento/IED vistos no Cadastro de Automação atual.
-- Mantido como tabela (não enum) para permitir adicionar tipos sem migration.
create table tipos_equipamento (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,       -- ex: RELE, MEDIDOR, PAINEL_COM, PAINEL_CA, PAINEL_CC,
                                      --     CONV_MIDIA, RETIFICADOR, BANCO_BAT, SWITCH,
                                      --     TERM_SERVER, UTR
  descricao text not null
);

create table equipamentos (
  id uuid primary key default gen_random_uuid(),
  subestacao_id uuid not null references subestacoes(id),
  tipo_equipamento_id uuid not null references tipos_equipamento(id),
  codigo_operacional text,           -- ex: "751", "DJ L52-1"
  fabricante text,
  modelo text,
  tensao text,
  part_number text,
  numero_serie text,
  ano_fabricacao int,
  data_energizacao date,
  -- campos específicos por tipo (ex.: retificador → tensão de saída;
  -- banco de baterias → qtde de elementos + capacidade nominal)
  campos_especificos jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create index equipamentos_subestacao_idx on equipamentos(subestacao_id);
create index equipamentos_tipo_idx on equipamentos(tipo_equipamento_id);

create table equipamento_fotos (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid not null references equipamentos(id) on delete cascade,
  tipo text not null check (tipo in ('placa', 'foto_1', 'foto_2', 'foto_3')),
  storage_path text not null,        -- caminho no Supabase Storage
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  capturado_em timestamptz not null default now(),
  -- resultado bruto do OCR/visão da placa, antes da confirmação do técnico
  ocr_resultado jsonb
);

create index equipamento_fotos_equipamento_idx on equipamento_fotos(equipamento_id);

-- =========================================================
-- 2. Comissionamento (agrega os 4 documentos)
-- =========================================================

create table comissionamentos (
  id uuid primary key default gen_random_uuid(),
  subestacao_id uuid not null references subestacoes(id),
  equipamento_principal_id uuid references equipamentos(id),
  codigo_operacional text,
  tipo_obra text,
  responsavel_comissionamento text,
  responsavel_tecnico text,
  pep_obra text,
  data_inicio date,
  data_fim date,
  houve_atraso boolean not null default false,
  motivo_atraso text,
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'liberado', 'em_montagem', 'liberado_com_ressalvas', 'nao_liberado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index comissionamentos_subestacao_idx on comissionamentos(subestacao_id);

-- =========================================================
-- 3. Checklist (documento 2) — dinâmico por tipo de equipamento
-- =========================================================

-- Grupos vistos no documento atual: Transformadores de Instrumento,
-- Caixa de Interligação, Painel do Equipamento, Painel de Comunicação,
-- Painel de Proteção, Medição, Trafo, Retificador, Painel CA/CC, Subestação.
create table checklist_grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem int not null default 0
);

-- Define quais itens existem para quais tipos de equipamento.
-- Um item só aparece no checklist de um comissionamento se o tipo do
-- equipamento comissionado estiver em `aplica_a_tipos`.
create table checklist_itens_template (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references checklist_grupos(id),
  descricao text not null,
  ordem int not null default 0,
  aplica_a_tipos uuid[] not null default '{}'  -- array de tipos_equipamento.id; vazio = aplica a todos
);

create index checklist_itens_template_grupo_idx on checklist_itens_template(grupo_id);

create table checklist_itens_execucao (
  id uuid primary key default gen_random_uuid(),
  comissionamento_id uuid not null references comissionamentos(id) on delete cascade,
  item_template_id uuid not null references checklist_itens_template(id),
  status text check (status in ('OK', 'NOK', 'N/A')),
  observacao text,
  atualizado_em timestamptz not null default now(),
  unique (comissionamento_id, item_template_id)
);

create index checklist_itens_execucao_comissionamento_idx on checklist_itens_execucao(comissionamento_id);

-- =========================================================
-- 4. PAEL / Painel (documento 4) — execução passo a passo
-- =========================================================

-- Disciplinas vistas no documento atual: Medição, Proteção Bay,
-- Sistema de Alimentação CC, Proteção Transformador,
-- Regulação + Controle de Temperatura, Automatismos.
create table pael_disciplinas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem int not null default 0
);

create table pael_etapas_template (
  id uuid primary key default gen_random_uuid(),
  disciplina_id uuid not null references pael_disciplinas(id),
  descricao text not null,
  ordem int not null default 0,
  aplica_a_tipos uuid[] not null default '{}'
);

create table pael_etapas_execucao (
  id uuid primary key default gen_random_uuid(),
  comissionamento_id uuid not null references comissionamentos(id) on delete cascade,
  etapa_template_id uuid not null references pael_etapas_template(id),
  realizado text check (realizado in ('SIM', 'NAO', 'N/A')),
  observacao text,
  atualizado_em timestamptz not null default now(),
  unique (comissionamento_id, etapa_template_id)
);

create index pael_etapas_execucao_comissionamento_idx on pael_etapas_execucao(comissionamento_id);

-- Evidências fotográficas da aba "TESTE CA" (QDCA, Retificador, Relé, T.I.)
create table pael_evidencias (
  id uuid primary key default gen_random_uuid(),
  comissionamento_id uuid not null references comissionamentos(id) on delete cascade,
  subsistema text not null,          -- QDCA, RETIFICADOR, RELE, TI
  storage_path text not null,
  capturado_em timestamptz not null default now()
);

-- =========================================================
-- 5. Liberação para Energização (documento 3 / LPE)
-- =========================================================

create table liberacoes (
  id uuid primary key default gen_random_uuid(),
  comissionamento_id uuid not null references comissionamentos(id) on delete cascade,
  numero_lpe text not null,
  tipo text not null check (tipo in ('total', 'parcial')),
  data date not null default current_date,
  gerencia text,
  protecao_liberada boolean not null default false,
  medicao_liberada boolean not null default false,
  comunicacao_liberada boolean not null default false,
  nao_conformidades text,
  responsavel_coordenacao text,
  visto_gerencia text,
  criado_em timestamptz not null default now()
);

create index liberacoes_comissionamento_idx on liberacoes(comissionamento_id);

-- Equipamentos cobertos por uma liberação (tabela do doc 3: Tipo,
-- Código Operacional, Part Number, Nº/Série, Nº Serialização)
create table liberacao_equipamentos (
  id uuid primary key default gen_random_uuid(),
  liberacao_id uuid not null references liberacoes(id) on delete cascade,
  equipamento_id uuid not null references equipamentos(id),
  numero_serializacao text
);

-- =========================================================
-- 6. Usuários / papéis (técnico-operador, coordenador, admin)
-- =========================================================

create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  matricula text,
  papel text not null default 'tecnico'
    check (papel in ('tecnico', 'coordenador', 'admin')),
  criado_em timestamptz not null default now()
);

-- =========================================================
-- RLS — habilitado em todas as tabelas; políticas básicas por
-- usuário autenticado. Refinar por papel quando os perfis de
-- acesso estiverem definidos com o Tarick.
-- =========================================================

alter table distribuidoras enable row level security;
alter table subestacoes enable row level security;
alter table tipos_equipamento enable row level security;
alter table equipamentos enable row level security;
alter table equipamento_fotos enable row level security;
alter table comissionamentos enable row level security;
alter table checklist_grupos enable row level security;
alter table checklist_itens_template enable row level security;
alter table checklist_itens_execucao enable row level security;
alter table pael_disciplinas enable row level security;
alter table pael_etapas_template enable row level security;
alter table pael_etapas_execucao enable row level security;
alter table pael_evidencias enable row level security;
alter table liberacoes enable row level security;
alter table liberacao_equipamentos enable row level security;
alter table perfis enable row level security;

create policy "autenticados podem ler tudo" on distribuidoras for select using (auth.role() = 'authenticated');
create policy "autenticados podem ler tudo" on subestacoes for select using (auth.role() = 'authenticated');
create policy "autenticados podem ler tudo" on tipos_equipamento for select using (auth.role() = 'authenticated');
create policy "autenticados podem ler/escrever" on equipamentos for all using (auth.role() = 'authenticated');
create policy "autenticados podem ler/escrever" on equipamento_fotos for all using (auth.role() = 'authenticated');
create policy "autenticados podem ler/escrever" on comissionamentos for all using (auth.role() = 'authenticated');
create policy "autenticados podem ler tudo" on checklist_grupos for select using (auth.role() = 'authenticated');
create policy "autenticados podem ler tudo" on checklist_itens_template for select using (auth.role() = 'authenticated');
create policy "autenticados podem ler/escrever" on checklist_itens_execucao for all using (auth.role() = 'authenticated');
create policy "autenticados podem ler tudo" on pael_disciplinas for select using (auth.role() = 'authenticated');
create policy "autenticados podem ler tudo" on pael_etapas_template for select using (auth.role() = 'authenticated');
create policy "autenticados podem ler/escrever" on pael_etapas_execucao for all using (auth.role() = 'authenticated');
create policy "autenticados podem ler/escrever" on pael_evidencias for all using (auth.role() = 'authenticated');
create policy "autenticados podem ler/escrever" on liberacoes for all using (auth.role() = 'authenticated');
create policy "autenticados podem ler/escrever" on liberacao_equipamentos for all using (auth.role() = 'authenticated');
create policy "usuario ve o proprio perfil" on perfis for select using (auth.uid() = id);
