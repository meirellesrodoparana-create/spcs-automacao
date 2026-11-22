import { supabase } from './supabase';
import type { PontoMapa } from './dnp3Matcher';

export interface AplicacaoDnp3 {
  id: string;
  modelo_rele: string;
  aplicacao: string;
  nome_aba_origem: string;
}

/** Lista as aplicações DNP3 cadastradas (para o seletor no Cadastro de Automação). */
export async function listarAplicacoesDnp3(): Promise<AplicacaoDnp3[]> {
  const { data, error } = await supabase
    .from('mapas_dnp3_aplicacoes')
    .select('id, modelo_rele, aplicacao, nome_aba_origem')
    .order('modelo_rele')
    .order('aplicacao');
  if (error) throw error;
  return (data ?? []) as AplicacaoDnp3[];
}

/** Busca os pontos de uma aplicação específica, no formato que o motor de comparação espera. */
export async function buscarPontosDaAplicacao(aplicacaoId: string): Promise<PontoMapa[]> {
  const { data, error } = await supabase
    .from('mapas_dnp3_pontos')
    .select('tipo, posicao, wordbit, descricao, valor_0, valor_1, comissionado')
    .eq('aplicacao_id', aplicacaoId)
    .order('posicao');
  if (error) throw error;
  return (data ?? []) as PontoMapa[];
}

export interface EquipamentoComAplicacaoDnp3 {
  id: string;
  codigo_operacional: string | null;
  fabricante: string | null;
  modelo: string | null;
  numero_serie: string | null;
  aplicacao_dnp3_id: string | null;
  mapas_dnp3_aplicacoes: { modelo_rele: string; aplicacao: string } | null;
}

/** Relés (tipo_equipamento = RELE) da subestação que já têm uma aplicação DNP3 vinculada no Cadastro. */
export async function listarRelesComMapaDnp3(subestacaoId: string): Promise<EquipamentoComAplicacaoDnp3[]> {
  const { data: tipoRele, error: erroTipo } = await supabase
    .from('tipos_equipamento')
    .select('id')
    .eq('codigo', 'RELE')
    .single();
  if (erroTipo) throw erroTipo;

  const { data, error } = await supabase
    .from('equipamentos')
    .select('id, codigo_operacional, fabricante, modelo, numero_serie, aplicacao_dnp3_id, mapas_dnp3_aplicacoes(modelo_rele, aplicacao)')
    .eq('subestacao_id', subestacaoId)
    .eq('tipo_equipamento_id', tipoRele.id)
    .not('aplicacao_dnp3_id', 'is', null);
  if (error) throw error;
  return (data ?? []) as unknown as EquipamentoComAplicacaoDnp3[];
}
