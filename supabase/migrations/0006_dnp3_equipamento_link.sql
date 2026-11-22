-- Vincula um equipamento (Cadastro de Automação) à aplicação do mapa DNP3
-- que descreve seus pontos — decidido uma vez no início do comissionamento
-- e reaproveitado depois pela Conferência DNP3 (compara o log de eventos
-- do relé contra esse mapa, sem o técnico escolher de novo a cada ensaio).
alter table equipamentos
  add column aplicacao_dnp3_id uuid references mapas_dnp3_aplicacoes(id);
