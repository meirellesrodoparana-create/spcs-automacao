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

// Usado pelo Painel de Gestão (coordenador/admin) — ao contrário de
// listarComissionamentosAbertos, traz TODOS os status (inclusive já
// liberados) de TODOS os técnicos, já que o RLS hoje é compartilhado
// entre a equipe inteira (não há coluna de "dono" do comissionamento).
export async function listarTodosComissionamentos(): Promise<ComissionamentoComSubestacao[]> {
  const { data, error } = await supabase
    .from('comissionamentos')
    .select('*, subestacoes(nome, sigla, distribuidoras(sigla))')
    .order('criado_em', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as ComissionamentoComSubestacao[];
}

export interface EquipamentoComTipo {
  id: string;
  codigo_operacional: string | null;
  fabricante: string | null;
  modelo: string | null;
  numero_serie: string | null;
  atualizado_em: string;
  tipos_equipamento: { descricao: string } | null;
}

export async function listarEquipamentosDaSubestacao(subestacaoId: string): Promise<EquipamentoComTipo[]> {
  const { data, error } = await supabase
    .from('equipamentos')
    .select('id, codigo_operacional, fabricante, modelo, numero_serie, atualizado_em, tipos_equipamento(descricao)')
    .eq('subestacao_id', subestacaoId)
    .order('atualizado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as EquipamentoComTipo[];
}

export interface ResumoComissionamento {
  checklistPreenchidos: number;
  paelPreenchidas: number;
  liberacao: { numeroLpe: string; data: string } | null;
}

// Contagens simples (não tenta inferir o total aplicável por tipo de
// equipamento, só quantos itens/etapas já têm algum registro) — dá pra
// ver de relance se o documento já foi começado, sem abrir a tela.
export async function obterResumoComissionamento(comissionamentoId: string): Promise<ResumoComissionamento> {
  const [checklistRes, paelRes, liberacaoRes] = await Promise.all([
    supabase
      .from('checklist_itens_execucao')
      .select('id', { count: 'exact', head: true })
      .eq('comissionamento_id', comissionamentoId)
      .not('status', 'is', null),
    supabase
      .from('pael_etapas_execucao')
      .select('id', { count: 'exact', head: true })
      .eq('comissionamento_id', comissionamentoId)
      .not('realizado', 'is', null),
    supabase
      .from('liberacoes')
      .select('numero_lpe, data')
      .eq('comissionamento_id', comissionamentoId)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (checklistRes.error) throw checklistRes.error;
  if (paelRes.error) throw paelRes.error;
  if (liberacaoRes.error) throw liberacaoRes.error;
  return {
    checklistPreenchidos: checklistRes.count ?? 0,
    paelPreenchidas: paelRes.count ?? 0,
    liberacao: liberacaoRes.data ? { numeroLpe: liberacaoRes.data.numero_lpe, data: liberacaoRes.data.data } : null,
  };
}
