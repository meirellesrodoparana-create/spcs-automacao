-- Dados de referência vistos nos 4 documentos-fonte reais
-- (comissionamento do Disjuntor 52-1 / LT, SE Atlântida Sul).
-- Os itens de checklist/PAEL por tipo de equipamento ainda não foram
-- detalhados item a item para todos os tipos — ver ponto em aberto
-- no doc de arquitetura (confirmar grupos do Banco de Capacitor etc.
-- com o Tarick antes de preencher checklist_itens_template).

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

insert into checklist_grupos (nome, ordem) values
  ('Transformadores de Instrumento', 1),
  ('Caixa de Interligação', 2),
  ('Painel do Equipamento', 3),
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
