-- Dados de referência vistos nos documentos-fonte reais (comissionamento
-- do Disjuntor 52-1 / LT, SE Atlântida Sul, e os documentos-padrão da pasta
-- "SPCS - Automação/DOCUMENTOS PADRÕES PARA RELATÓRIO"). Os itens de
-- checklist e as etapas de PAEL em si são preenchidos em
-- 0003_checklist_pael_reais.sql, a partir dos arquivos reais.

insert into tipos_equipamento (codigo, descricao) values
  ('RELE', 'Relé de proteção'),
  ('MEDIDOR', 'Medidor'),
  ('PAINEL_COM', 'Painel de Comunicação'),
  ('PAINEL_CA', 'Painel CA'),
  ('PAINEL_CC', 'Painel CC'),
  ('CONV_MIDIA', 'Conversor de Mídia'),
  ('RETIFICADOR', 'Retificador'),
  ('BANCO_BAT', 'Banco de Baterias'),
  ('BANCO_CAP', 'Banco de Capacitor'),
  ('SWITCH', 'Switch'),
  ('TERM_SERVER', 'Terminal Server'),
  ('UTR', 'Unidade Terminal Remota')
on conflict (codigo) do nothing;

-- Nomes exatamente como aparecem em "8_Check-List inconformidades
-- (OBRIGATÓRIO).docx" (e na variante idêntica de Documentos_medição).
insert into checklist_grupos (nome, ordem) values
  ('Transformadores de Instrumentos', 1),
  ('Caixa de Interligação Transformador de Instrumento', 2),
  ('Painel Equipamento (Disjuntor)', 3),
  ('Painel de Comunicação', 4),
  ('Painel de Proteção', 5),
  ('Medição', 6),
  ('Trafo', 7),
  ('Retificador', 8),
  ('Painel CA/CC', 9),
  ('Subestação', 10)
on conflict (nome) do nothing;

insert into pael_disciplinas (nome, ordem) values
  ('Medição', 1),
  ('Proteção Bay', 2),
  ('Sistema de Alimentação CC', 3),
  ('Proteção Transformador', 4),
  ('Regulação e Controle de Temperatura', 5),
  ('Automatismos', 6)
on conflict (nome) do nothing;
