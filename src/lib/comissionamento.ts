import { supabase } from './supabase';
import type { Comissionamento, StatusComissionamento } from '../types/database';

// Fluxo mínimo de criação, sem telas de administração de distribuidora/SE
// ainda — encontra pelo sigla ou cria na hora. Suficiente para o técnico
// abrir um comissionamento em campo sem depender de cadastro prévio.

export async function buscarOuCriarDistribuidora(sigla: string): Promise<string> {
  const siglaNormalizada = sigla.trim().toUpperCase();
  const { data: existente, error: erroBusca } = await supabase
    .from('distribuidoras')
    .select('id')
    .eq('sigla', siglaNormalizada)
    .maybeSingle();
  if (erroBusca) throw erroBusca;
  if (existente) return existente.id;

  const { data: criada, error: erroCriacao } = await supabase
    .from('distribuidoras')
    .insert({ sigla: siglaNormalizada, nome: siglaNormalizada })
    .select('id')
    .single();
  if (erroCriacao) throw erroCriacao;
  return criada.id;
}

export async function buscarOuCriarSubestacao(distribuidoraId: string, sigla: string, nome: string): Promise<string> {
  const siglaNormalizada = sigla.trim().toUpperCase();
  const { data: existente, error: erroBusca } = await supabase
    .from('subestacoes')
    .select('id')
    .eq('distribuidora_id', distribuidoraId)
    .eq('sigla', siglaNormalizada)
    .maybeSingle();
  if (erroBusca) throw erroBusca;
  if (existente) return existente.id;

  const { data: criada, error: erroCriacao } = await supabase
    .from('subestacoes')
    .insert({ distribuidora_id: distribuidoraId, sigla: siglaNormalizada, nome: nome.trim() || siglaNormalizada })
    .select('id')
    .single();
  if (erroCriacao) throw erroCriacao;
  return criada.id;
}

export interface NovoComissionamentoInput {
  distribuidoraSigla: string;
  subestacaoSigla: string;
  subestacaoNome: string;
  codigoOperacional?: string;
  tipoObra?: string;
  responsavelTecnico?: string;
}

export async function criarComissionamento(input: NovoComissionamentoInput): Promise<string> {
  const distribuidoraId = await buscarOuCriarDistribuidora(input.distribuidoraSigla);
  const subestacaoId = await buscarOuCriarSubestacao(distribuidoraId, input.subestacaoSigla, input.subestacaoNome);

  const { data, error } = await supabase
    .from('comissionamentos')
    .insert({
      subestacao_id: subestacaoId,
      codigo_operacional: input.codigoOperacional || null,
      tipo_obra: input.tipoObra || null,
      responsavel_tecnico: input.responsavelTecnico || null,
      status: 'em_andamento' as StatusComissionamento,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export interface ComissionamentoComSubestacao extends Comissionamento {
  subestacoes: { nome: string; sigla: string } | null;
}

export async function listarComissionamentosAbertos(): Promise<ComissionamentoComSubestacao[]> {
  const { data, error } = await supabase
    .from('comissionamentos')
    .select('*, subestacoes(nome, sigla)')
    .neq('status', 'liberado')
    .order('criado_em', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as ComissionamentoComSubestacao[];
}
