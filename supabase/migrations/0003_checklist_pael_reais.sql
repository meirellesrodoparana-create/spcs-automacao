-- Itens reais do Checklist (108 linhas / 94 itens, conforme
-- '8_Check-List inconformidades (OBRIGATÓRIO).docx' e sua variante
-- de medição — os dois arquivos têm o MESMO template de 108 linhas.
--
-- IMPORTANTE: na prática o checklist NÃO é filtrado dinamicamente por
-- tipo de equipamento — é um único template estático reaproveitado em
-- todo comissionamento; grupos que não se aplicam (ex.: 'Trafo' num
-- comissionamento de disjuntor de alimentador) são simplesmente
-- marcados N/A pelo técnico, e não ocultados. Por isso aplica_a_tipos
-- fica vazio (aplica a todos) em todos os itens abaixo — ver nota em
-- claude/mapeamento-documentos-origem.md.

-- Grupo: Transformadores de Instrumentos
insert into checklist_itens_template (grupo_id, descricao, ordem)
select id, v.descricao, v.ordem from checklist_grupos, (values
  ('Polaridade dos Transformadores de Instrumento TP', 1),
  ('Polaridade dos Transformadores de Instrumento TC', 2),
  ('Faseamento do TP', 3),
  ('Faseamento do TC', 4),
  ('Relação de transformação do TP(primário e secundário)', 5),
  ('Relação de transformação do TC(primário e secundário)', 6),
  ('Estado de conservação dos bornes', 7),
  ('Estado de conservação dos cabos/conexões', 8),
  ('Os fios estão anilhados e os cabos identificados?', 9)
) as v(descricao, ordem)
where checklist_grupos.nome = 'Transformadores de Instrumentos';

-- Grupo: Caixa de Interligação Transformador de Instrumento
insert into checklist_itens_template (grupo_id, descricao, ordem)
select id, v.descricao, v.ordem from checklist_grupos, (values
  ('Estado de conservação de tomadas', 1),
  ('Sistema de desumidificação em 25° a 30°', 2),
  ('Estado de conservação dos bornes', 3),
  ('Estado de conservação dos cabos/conexões', 4),
  ('Os enrolamentos sem uso estão curto-circuitados (TC) ou abertos (TP)', 5),
  ('Estado de conservação da vedação do armário', 6),
  ('As tubulações estão vedadas', 7),
  ('Os fios estão anilhados e os cabos identificados?', 8),
  ('Limpeza dos Painéis de Medição', 9)
) as v(descricao, ordem)
where checklist_grupos.nome = 'Caixa de Interligação Transformador de Instrumento';

-- Grupo: Painel Equipamento (Disjuntor)
insert into checklist_itens_template (grupo_id, descricao, ordem)
select id, v.descricao, v.ordem from checklist_grupos, (values
  ('Verificação da fiação interna dos painéis ou cubículos;', 1),
  ('Fibra ótica conectada (ponto-a-ponto), identificada, bem acondicionada e sem lesões?', 2),
  ('Estado de conservação e identificação dos relés auxiliares e contactores.', 3),
  ('Estado de conservação das conexões das fiações, réguas e terminais', 4),
  ('Estado de conservação do aterramento dos painéis', 5),
  ('As tubulações estão vedadas?', 6),
  ('Os fios estão anilhados e os cabos identificados?', 7),
  ('Sinalização Estado do Disjuntor do motor', 8),
  ('Sinalização Mola', 9),
  ('Sinalização Bobina de Abertura', 10),
  ('Sinalização Bobina de Abertura Auxiliar', 11),
  ('Sinalização Bobina de Fechamento', 12),
  ('Sinalização Bobina de Fechamento auxiliar', 13),
  ('Supervisão do Motor', 14),
  ('Supervisão do Corte do Motor', 15),
  ('Supervisão de Gás SF6', 16),
  ('Supervisão de TP', 17),
  ('Mecanismo 69', 18),
  ('Comandos de Abertura', 19),
  ('Comandos de Fechamento', 20),
  ('Todos os IEDs estão identificados?', 21),
  ('Limpeza dos Painéis de Proteção', 22)
) as v(descricao, ordem)
where checklist_grupos.nome = 'Painel Equipamento (Disjuntor)';

-- Grupo: Painel de Comunicação
insert into checklist_itens_template (grupo_id, descricao, ordem)
select id, v.descricao, v.ordem from checklist_grupos, (values
  ('Fibras dos IEDs identificadas?', 1),
  ('Fibras dos Switches identificadas?', 2),
  ('Cabo de rede da medição identificada?', 3),
  ('Cabo de rede do Retificador identificado?', 4),
  ('Sistema de redundância com dois Switches instalados?', 5)
) as v(descricao, ordem)
where checklist_grupos.nome = 'Painel de Comunicação';

-- Grupo: Painel de Proteção
insert into checklist_itens_template (grupo_id, descricao, ordem)
select id, v.descricao, v.ordem from checklist_grupos, (values
  ('Fibra ótica conectada (ponto-a-ponto), identificada, bem acondicionada e sem lesões?', 1),
  ('Estado de conservação dos relés auxiliares e contactores.', 2),
  ('Estado de conservação das conexões das fiações e réguas terminais', 3),
  ('Os fios estão anilhados e os cabos identificados', 4),
  ('Sinalização Estado dos Disjuntores', 5)
) as v(descricao, ordem)
where checklist_grupos.nome = 'Painel de Proteção';

-- Grupo: Medição
insert into checklist_itens_template (grupo_id, descricao, ordem)
select id, v.descricao, v.ordem from checklist_grupos, (values
  ('Medição instalada?', 1),
  ('Implementada alimentação do medidor em Vcc?', 2),
  ('Os cabos de alimentação do medidor estão identificados/tagueados?', 3),
  ('Estado de conservação dos bornes', 4),
  ('Estado de conservação dos cabos/conexões', 5),
  ('Tagueamento dos cabos de corrente e tensão;', 6),
  ('Comunicação do medidor (serial ou ethernet) instalada?', 7),
  ('Cabos de comunicação tagueados/identificado?', 8),
  ('Limpeza dos Painéis de Medição', 9)
) as v(descricao, ordem)
where checklist_grupos.nome = 'Medição';

-- Grupo: Trafo
insert into checklist_itens_template (grupo_id, descricao, ordem)
select id, v.descricao, v.ordem from checklist_grupos, (values
  ('Cabos do PT-100 conectados?', 1),
  ('Arquitetura do Sistema de Automação conforme padrão?', 2),
  ('Sentido de rotação dos Moto-ventiladores montado corretamente?', 3),
  ('Fusíveis substituídos por Disjuntores?', 4),
  ('Estado de Conservação das Contactoras, Disjuntores, Sensores', 5),
  ('Relé de gás (63) alarme e trip', 6),
  ('Nível de óleo alarme', 7),
  ('Relé ruptura de membrana alarme', 8),
  ('Nível de óleo do comutador alarme', 9),
  ('Válvula de alivio de pressão alarme', 10),
  ('Alarme da Nível de Óleo', 11),
  ('Alarme de Proteção do Comutador', 12),
  ('Alarme da Temperatura do Óleo', 13),
  ('Alarme da Temperatura de Enrolamento', 14),
  ('Alarme Relé de Membrana', 15),
  ('Disparo do Relé de Bloqueio 86', 16),
  ('Comando 86', 17),
  ('Disparo do relé 87', 18),
  ('Disparo Enrolamento Fonte', 19),
  ('Disparo enrolamento Carga', 20),
  ('Tensão CA Motor - VF', 21),
  ('Estado da Ventilação Forçada', 22),
  ('Ventilação Forçada', 23),
  ('Comutador', 24),
  ('Alarme Subtensão', 25),
  ('Alarme Sobretensão', 26),
  ('Alarme Sobrecorrente', 27),
  ('Elevar TAP', 28),
  ('Diminuir TAP', 29)
) as v(descricao, ordem)
where checklist_grupos.nome = 'Trafo';

-- Grupo: Retificador
insert into checklist_itens_template (grupo_id, descricao, ordem)
select id, v.descricao, v.ordem from checklist_grupos, (values
  ('Sensores de temperatura do Retificador lançado para sala de baterias e outro pra sala de comando?', 1),
  ('Cabo de rede', 2),
  ('Sensores de temperatura', 3)
) as v(descricao, ordem)
where checklist_grupos.nome = 'Retificador';

-- Grupo: Painel CA/CC
insert into checklist_itens_template (grupo_id, descricao, ordem)
select id, v.descricao, v.ordem from checklist_grupos, (values
  ('Circuitos de alimentação identificados?', 1),
  ('Cabo de Rede do Medidor do Painel CA lançado e identificado?', 2)
) as v(descricao, ordem)
where checklist_grupos.nome = 'Painel CA/CC';

-- Grupo: Subestação
insert into checklist_itens_template (grupo_id, descricao, ordem)
select id, v.descricao, v.ordem from checklist_grupos, (values
  ('Protejo da SE', 1)
) as v(descricao, ordem)
where checklist_grupos.nome = 'Subestação';
-- Etapas reais do PAEL por disciplina, conforme
-- '2_PAEL - Comissionamento_Elétrico_(OBRIGATÓRIO).xlsx' e o exemplo
-- preenchido em RELÉ_2414/1_PAEL...SBT11C4.xlsx (mesmo template; a
-- única variação observada entre os dois foi 1 etapa extra em
-- 'Proteção Transformador', já incluída abaixo).
--
-- Mesma observação do checklist: é um template único e estático —
-- disciplinas que não se aplicam ao equipamento comissionado (ex.:
-- 'Proteção Transformador' ao comissionar um disjuntor de bay) são
-- marcadas N/A pelo técnico, não removidas do documento. aplica_a_tipos
-- fica vazio (todos) em todas as etapas abaixo.

-- Disciplina: Medição
insert into pael_etapas_template (disciplina_id, descricao, ordem)
select id, v.descricao, v.ordem from pael_disciplinas, (values
  ('Realizar o as-built das conexões do medidor', 1),
  ('Realizar reaperto e tração em todos os bornes utilizados', 2),
  ('Configurar o medidor', 3),
  ('Realizar injeção de corrente no primário dos TCs e confirmar fase e valor', 4),
  ('Realizar injeção de tensão no secundário do TP e confirmar fase e valor', 5),
  ('Realizar teste de comunicação entre o medidor e a sede', 6),
  ('Realizar novamente reaperto e tração dos circuitos dos TCs', 7)
) as v(descricao, ordem)
where pael_disciplinas.nome = 'Medição';

-- Disciplina: Proteção Bay
insert into pael_etapas_template (disciplina_id, descricao, ordem)
select id, v.descricao, v.ordem from pael_disciplinas, (values
  ('Realizar o as-built da obra do bay', 1),
  ('Realizar reaperto e tração em todos os bornes utilizados', 2),
  ('Checar alimentação CA e CC dos bays + paineis', 3),
  ('Configurar o relé', 4),
  ('Realizar injeção de corrente no primário dos TCs e confirmar fase e valor', 5),
  ('Realizar injeção de tensão no secundário do TP e confirmar fase e valor', 6),
  ('Testar todas as sinalizações entre equipamento e relé', 7),
  ('Testar todos os comandos entre equipamento e relé', 8),
  ('Realizar teste de comunicação entre relé e SCADA', 9),
  ('Realizar todos os comandos no SCADA e confirmar o comando executado em campo', 10),
  ('Realizar checklist de proteção (testes por proteção + ciclo de religamento)', 11),
  ('Realizar novamente reaperto e tração dos circuitos dos TCs', 12),
  ('Realizar teste de falta de CA', 13)
) as v(descricao, ordem)
where pael_disciplinas.nome = 'Proteção Bay';

-- Disciplina: Sistema de Alimentação CC
insert into pael_etapas_template (disciplina_id, descricao, ordem)
select id, v.descricao, v.ordem from pael_disciplinas, (values
  ('Realizar o as-built da obra do sistema CC (TSA, Painel CA, Painel CC, BB e Retificador)', 1),
  ('Realizar reaperto e tração em todos os bornes utilizados (incluso das baterias)', 2),
  ('Configurar o retificador e fazer os testes de carga (carregar o BB) e flutuação', 3),
  ('Fazer o teste de falta de CA', 4),
  ('Realizar teste de comunicação entre o retificador e a sede', 5)
) as v(descricao, ordem)
where pael_disciplinas.nome = 'Sistema de Alimentação CC';

-- Disciplina: Proteção Transformador
insert into pael_etapas_template (disciplina_id, descricao, ordem)
select id, v.descricao, v.ordem from pael_disciplinas, (values
  ('Realizar o as-built da obra do transformador', 1),
  ('Realizar reaperto e tração em todos os bornes utilizados', 2),
  ('Checar alimentação CA e CC do transformador + paineis', 3),
  ('Configurar o relé', 4),
  ('Realizar injeção de corrente no secundário dos TCs do lado de alta e confirmar fase e valor', 5),
  ('Realizar injeção de corrente no secundário dos TCs do lado de baixa e confirmar fase e valor', 6),
  ('Testar todas as sinalizações entre equipamento e relé', 7),
  ('Testar todos os comandos entre equipamento e relé', 8),
  ('Realizar teste de comunicação entre relé e SCADA', 9),
  ('Realizar todos os comandos no SCADA e confirmar o comando executado em campo', 10),
  ('Realizar checklist de proteção (testes por proteção + diferencial)', 11),
  ('Realizar teste de funcionamento do relé de bloqueio', 12),
  ('Retirar o ponto físico de TRIP 63 e retirar da equação de TRIP a proteção diferencial', 13),
  ('Realizar novamente reaperto e tração dos circuitos dos TCs', 14),
  ('Realizar configuração do analizador de gás e umidade (AGU)', 15),
  ('Realizar teste de falta de CA', 16)
) as v(descricao, ordem)
where pael_disciplinas.nome = 'Proteção Transformador';

-- Disciplina: Regulação e Controle de Temperatura
insert into pael_etapas_template (disciplina_id, descricao, ordem)
select id, v.descricao, v.ordem from pael_disciplinas, (values
  ('Realizar o as-built da obra do transformador', 1),
  ('Realizar reaperto e tração em todos os bornes utilizados', 2),
  ('Checar alimentação CA e CC do transformador + paineis', 3),
  ('Configurar o relé', 4),
  ('Realizar injeção de corrente no secundário dos TCs de imagem térmica e confirmar fase e valor', 5),
  ('Realizar injeção de tensão no secundário do TP e confirmar fase e valor', 6),
  ('Testar todas as sinalizações entre equipamento e relé', 7),
  ('Testar todos os comandos entre equipamento e relé', 8),
  ('Realizar teste de comunicação entre relé e SCADA', 9),
  ('Realizar todos os comandos no SCADA e confirmar o comando executado em campo', 10),
  ('Realizar teste de regulação automática', 11),
  ('Confirmar valor normal de Temperatura de Óleo de Enrolamento', 12),
  ('Realizar novamente reaperto e tração dos circuitos dos TCs', 13),
  ('Realizar teste de falta de CA', 14)
) as v(descricao, ordem)
where pael_disciplinas.nome = 'Regulação e Controle de Temperatura';

-- Disciplina: Automatismos
insert into pael_etapas_template (disciplina_id, descricao, ordem)
select id, v.descricao, v.ordem from pael_disciplinas, (values
  ('Inserir as lógicas do automatismo nos relés do esquema', 1),
  ('Desabilitar o TRIP por automatismo no relé', 2),
  ('Configurar as interações entre os relés (comunicação entre relés)', 3),
  ('Rever as lógicas do automatismo', 4),
  ('Teste de comunicação entre os relés (identificar informação sendo transmitida)', 5),
  ('Reativar o TRIP por automatismo', 6)
) as v(descricao, ordem)
where pael_disciplinas.nome = 'Automatismos';
-- Retificador tem documentos de comissionamento PRÓPRIOS e
-- SEPARADOS do conjunto padrão de 4 documentos (não usa o Checklist
-- de 108 itens nem o PAEL de 6 disciplinas) — conforme
-- 'CHECKLIST COMISSIONAMENTO RETIFICADOR_Rev3.xlsx' e
-- 'CHECKLIST ATUALIZAÇÃO DE FIRMWARE RETIFICADOR_Rev1.xlsx'.
-- Modelados aqui como duas disciplinas adicionais de PAEL (mesma
-- estrutura etapa/realizado/observação), restritas ao tipo RETIFICADOR.

insert into pael_disciplinas (nome, ordem) values
  ('Retificador - Comissionamento Elétrico', 7),
  ('Retificador - Atualização de Firmware', 8)
on conflict (nome) do nothing;

-- Retificador - Comissionamento Elétrico (34 etapas)
insert into pael_etapas_template (disciplina_id, descricao, ordem, aplica_a_tipos)
select id, v.descricao, v.ordem, array[(select id from tipos_equipamento where codigo = 'RETIFICADOR')]
from pael_disciplinas, (values
  ('Verificar aterramento do equipamento', 1),
  ('Realizar teste de tração e reaperto', 2),
  ('Checar tensão de entrada 220 VCA na régua BT1', 3),
  ('Checar circuito de alimentação de iluminação em VCA', 4),
  ('Checar circuito de alimentação de tomadas em VCA', 5),
  ('Checar se todos os módulos retificadores (parte superior) estão conectados', 6),
  ('Checar se todos os módulos rectinverter (parte inferior) estão conectados', 7),
  ('Módulo BCU inserido?', 8),
  ('Módulo BMU (Baterias) ligados em série?', 9),
  ('Módulos BMU (Baterias) montados na sequência correta?', 10),
  ('Checar a conexão do cabo de comunicação entre BCU e os módulos BMU', 11),
  ('Realizar a conexão do cabo de Comunicação MODBUS entre a BCU e a controladora IHM', 12),
  ('Verificar se todos os disjuntores estão desligados', 13),
  ('Colocar chave do módulo BCU na posição ON', 14),
  ('Ligar o disjuntor DJE (disjuntor CA)', 15),
  ('Verificar se o LED power da BCU (unidade de controle da bateria) está ligado', 16),
  ('Ligar os disjuntores DJ1 à DJ5 (alimentação dos módulos)', 17),
  ('Verificar se todos os módulos estão ligados e sem alarmes', 18),
  ('Verificar se a IHM está ligada', 19),
  ('Ligar o disjuntor DJB (disjuntor da bateria)', 20),
  ('Constatar ausência de alarmes na IHM', 21),
  ('Verificar alimentação CA nos disjuntores DJC1 à DJC8', 22),
  ('Verificar alimentação CC nos disjuntores DJC9 à DJC16', 23),
  ('Verificar capacidade das bateria através da IHM', 24),
  ('Configurar IP do retificador na faixa de rede da SE utilizando endereço definido pela automação', 25),
  ('Conectar IHM a rede da automação', 26),
  ('Integrar retificador com o SCADA (validar todas as sinalizações)', 27),
  ('Validar acesso remoto ao retificador (via interface WEB pelo TS)', 28),
  ('Realizar teste de falta VCA (sem cargas)', 29),
  ('Realizar migração das cargas para o retificador', 30),
  ('Verificar se todas as cargas estão alimentadas', 31),
  ('Realizar teste de falta VCA e autonomia dos bancos (com cargas)', 32),
  ('Verificar se o retificador parte em rampa ao retornar da falta VCA. Medir com amperímetro a corrente da bateria e verificar a transição de descarga para carga', 33),
  ('Verificar se a corrente da bateria zera pouco tempo após a capacidade atingir 100%. Verificar se a tensão máxima da célula está em torno de 3,55V', 34),
  ('Verificar se todas as tubulações estão vedadas', 35)
) as v(descricao, ordem)
where pael_disciplinas.nome = 'Retificador - Comissionamento Elétrico';

-- Retificador - Atualização de Firmware (12 etapas)
insert into pael_etapas_template (disciplina_id, descricao, ordem, aplica_a_tipos)
select id, v.descricao, v.ordem, array[(select id from tipos_equipamento where codigo = 'RETIFICADOR')]
from pael_disciplinas, (values
  ('Verificar o status da bateria. Se estiver em trip ou alarme realizar o desbloqueio.', 1),
  ('Conectar o conversor USBCAN2 e acessar o BMS', 2),
  ('Verificar o estado de carga da bateria. Se estiver carregada descarregar até 97% pelo menos.', 3),
  ('Acessar a controladora Smartpack através da porta ethernet frontal. IP 10.10.0.1', 4),
  ('Descarregar o arquivo de complemento na Smartpack', 5),
  ('Após a descarga da bateria até 97%, religar a energia CA e verificar no BMS ou amperímetro se a corrente na bateria subirá em rampa quando o retificador iniciar a recarga.', 6),
  ('Realizar a atualização de firmware da bateria.', 7),
  ('Verificar se o SOC (Estado de Carga) da bateria vai para 100% quando a célula de maior tensão atingir 3,5V por pelo menos 1 segundo', 8),
  ('Verificar se a corrente da bateria vai para 0,0A quando a célula de maior tensão atingir 3,55V por pelo menos 1 segundo', 9),
  ('Desligar a energia CA e verificar se a bateria assumiu as cargas', 10),
  ('Religar a energia CA e repetir as verificações dos passos 9 e 10.', 11),
  ('Constatar ausência de alarmes na IHM', 12)
) as v(descricao, ordem)
where pael_disciplinas.nome = 'Retificador - Atualização de Firmware';
-- Documentos exigidos por tipo de atividade de comissionamento,
-- conforme 'POP - DOCUMENTAÇÕES COMISSIONAMENTO.docx' (POP corporativo
-- de Automação da Equatorial). Referência para orientar o app sobre
-- quais anexos/documentos complementares pedir em cada fluxo — hoje
-- somente informativo, não bloqueia a liberação.
create table tipos_atividade_comissionamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  documentos_necessarios jsonb not null default '[]'::jsonb
);

alter table tipos_atividade_comissionamento enable row level security;
create policy "autenticados podem ler tudo" on tipos_atividade_comissionamento for select using (auth.role() = 'authenticated');

insert into tipos_atividade_comissionamento (nome, documentos_necessarios) values
  ('Comissionamento Disjuntor (Alimentador / Entrada e saída de linha / Banco de capacitor)', '["PAEL","Planilha de cadastro de Ativos","Ordem de Ajuste","Planilha de teste de proteção","Arquivo relé.rdb","Testes de proteção em .txt","Eventos do Elipse (com equipe SCADA)","Diagrama fasorial","Check-List de Inconformidades","Projeto da seletividade lógica implantada (arquivo architect), se aplicável","Lista de pontos do equipamento comissionado","Fotografia do as-built do equipamento"]'::jsonb),
  ('Comissionamento Reator', '["PAEL","Planilha de cadastro de Ativos","Ordem de Ajuste","Planilha de teste de proteção","Arquivo relé.rdb","Testes de proteção em .txt","Eventos do Elipse (com equipe SCADA)","Diagrama fasorial","Check-List de Inconformidades","Lista de pontos do equipamento comissionado","Fotografia do as-built do equipamento"]'::jsonb),
  ('Comissionamento Transformador - Relé 787', '["PAEL (Proteção Transformador)","Planilha de cadastro de Ativos","Ordem de Ajuste","Planilha de teste de proteção de Trafo","Arquivo relé.rdb","Testes de proteção em .txt","Eventos do Elipse (Diferencial, Gás, 50/51 Alta/Baixa, Intrínsecas, Comandos)","Diagrama fasorial","Check-List de Inconformidades","Projeto da seletividade lógica implantada, se aplicável","Planilha de ensaio de curto-circuito (Trafo desenergizado)","Lista de pontos do equipamento comissionado","Fotografia do as-built do equipamento"]'::jsonb),
  ('Comissionamento Transformador - Relé 2414', '["PAEL (Regulação + Controle de Temperatura)","Cadastro de Ativos","Ordem de Ajuste","Arquivo do relé .rdb","Eventos do Elipse (Comandos, Comutação, Temperatura, teste de TAP)","Check-List de Inconformidades","Lista de pontos do equipamento comissionado","Fotografia do as-built do equipamento"]'::jsonb),
  ('Comissionamento Baixa do Trafo', '["PAEL","Planilha de Cadastro de Ativos","Ordem de Ajuste","Planilha de teste de proteção","Arquivo relé.rdb","Testes de proteção em .txt","Eventos do Elipse (com equipe SCADA)","Diagrama fasorial","Projeto da seletividade lógica implantada","Check-List de Inconformidades","Lista de pontos do equipamento comissionado","Fotografia do as-built do equipamento"]'::jsonb),
  ('Comissionamento Banco de Capacitores', '["PAEL","Cadastro de Ativos","Ordem de Ajuste","Planilha de proteção (se houver teste de proteção)","Arquivo do relé .rdb","Eventos do Elipse (testes de comando/sinalização, funções 27 e 59)","Check-List de Inconformidades","Lista de pontos do equipamento comissionado","Fotografia do as-built do equipamento"]'::jsonb),
  ('Substituição do Relé', '["PAEL","Ordem de Ajuste","Arquivo relé .rdb","Planilha de proteção","Testes de proteção em .txt","Eventos do Elipse (com equipe SCADA)","Diagrama fasorial","Seletividade lógica (se houver)","Lista de pontos do equipamento comissionado","Fotografia do as-built do equipamento"]'::jsonb),
  ('Substituição de TC/TP (sem alteração de RTC)', '["PAEL","Diagrama fasorial","Eventos dos testes de comando e sinalização"]'::jsonb),
  ('Substituição de Disjuntor/Religadores (sem alteração de RTC)', '["PAEL","Eventos do Elipse (registro de comandos e supervisões)"]'::jsonb),
  ('Comissionamento de Equipamentos da SE Móvel', '["PAEL","Ordem de Ajuste","Arquivo relé .rdb","Ensaio de proteção","Eventos do Elipse (comandos, proteções e sinalizações)","Liberação para energização","Lista de pontos do equipamento comissionado"]'::jsonb);