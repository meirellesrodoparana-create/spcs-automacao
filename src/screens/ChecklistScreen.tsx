import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { alertar } from '../lib/alerta';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { listarEquipamentosDaSubestacao, type EquipamentoComTipo } from '../lib/comissionamento';
import { escaparHtml, imprimirOuCompartilharPdf, montarHtmlDocumento } from '../lib/pdf';
import type { ChecklistGrupo, ChecklistItemTemplate, StatusChecklistItem } from '../types/database';

type Props = NativeStackScreenProps<RootStackParamList, 'Checklist'>;

interface ItemComExecucao extends ChecklistItemTemplate {
  status: StatusChecklistItem | null;
  observacao: string;
}

const OPCOES: StatusChecklistItem[] = ['OK', 'NOK', 'N/A'];

export default function ChecklistScreen({ route }: Props) {
  const { comissionamentoId } = route.params;
  const [grupos, setGrupos] = useState<ChecklistGrupo[]>([]);
  const [itensPorGrupo, setItensPorGrupo] = useState<Record<string, ItemComExecucao[]>>({});
  const [equipamentos, setEquipamentos] = useState<EquipamentoComTipo[]>([]);
  const [codigoComissionamento, setCodigoComissionamento] = useState<string>('');
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [imprimindo, setImprimindo] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [
        { data: gruposData, error: erroGrupos },
        { data: itensData, error: erroItens },
        { data: execData, error: erroExec },
        { data: comData, error: erroCom },
      ] = await Promise.all([
        supabase.from('checklist_grupos').select('*').order('ordem'),
        supabase.from('checklist_itens_template').select('*').order('ordem'),
        supabase
          .from('checklist_itens_execucao')
          .select('item_template_id, status, observacao')
          .eq('comissionamento_id', comissionamentoId),
        supabase.from('comissionamentos').select('codigo_operacional, subestacao_id').eq('id', comissionamentoId).single(),
      ]);
      if (erroGrupos) throw erroGrupos;
      if (erroItens) throw erroItens;
      if (erroExec) throw erroExec;
      if (erroCom) throw erroCom;

      const execPorItem = new Map((execData ?? []).map((e) => [e.item_template_id, e]));
      const porGrupo: Record<string, ItemComExecucao[]> = {};
      for (const item of (itensData ?? []) as ChecklistItemTemplate[]) {
        const exec = execPorItem.get(item.id);
        const entry: ItemComExecucao = {
          ...item,
          status: (exec?.status as StatusChecklistItem | null) ?? null,
          observacao: exec?.observacao ?? '',
        };
        if (!porGrupo[item.grupo_id]) porGrupo[item.grupo_id] = [];
        porGrupo[item.grupo_id].push(entry);
      }

      setGrupos((gruposData ?? []) as ChecklistGrupo[]);
      setItensPorGrupo(porGrupo);
      setCodigoComissionamento(comData?.codigo_operacional ?? '');
      if (comData?.subestacao_id) {
        setEquipamentos(await listarEquipamentosDaSubestacao(comData.subestacao_id));
      }
    } catch (err) {
      alertar('Erro ao carregar checklist', err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  }, [comissionamentoId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  function atualizarLocal(item: ItemComExecucao, campos: Partial<Pick<ItemComExecucao, 'status' | 'observacao'>>) {
    setItensPorGrupo((atual) => ({
      ...atual,
      [item.grupo_id]: atual[item.grupo_id].map((i) => (i.id === item.id ? { ...i, ...campos } : i)),
    }));
  }

  async function salvar(item: ItemComExecucao, campos: { status?: StatusChecklistItem; observacao?: string }) {
    setSalvandoId(item.id);
    // Atualização otimista: marca na tela antes da resposta do servidor.
    atualizarLocal(item, campos);
    try {
      const { error } = await supabase
        .from('checklist_itens_execucao')
        .upsert(
          {
            comissionamento_id: comissionamentoId,
            item_template_id: item.id,
            status: campos.status ?? item.status,
            observacao: campos.observacao ?? item.observacao,
          },
          { onConflict: 'comissionamento_id,item_template_id' }
        );
      if (error) throw error;
    } catch (err) {
      alertar('Não foi possível salvar', err instanceof Error ? err.message : String(err));
    } finally {
      setSalvandoId(null);
    }
  }

  const todosOsItens = useMemo(() => Object.values(itensPorGrupo).flat(), [itensPorGrupo]);
  const resumo = useMemo(() => {
    const ok = todosOsItens.filter((i) => i.status === 'OK').length;
    const nok = todosOsItens.filter((i) => i.status === 'NOK').length;
    const na = todosOsItens.filter((i) => i.status === 'N/A').length;
    const pendente = todosOsItens.length - ok - nok - na;
    return { ok, nok, na, pendente, total: todosOsItens.length };
  }, [todosOsItens]);

  async function imprimir() {
    setImprimindo(true);
    try {
      const cabecalhoEquipamentos = equipamentos
        .map((eq) => `${eq.tipos_equipamento?.descricao ?? ''}: ${[eq.fabricante, eq.modelo, eq.numero_serie].filter(Boolean).join(' / ') || '—'}`)
        .join('<br/>');
      const corpoGrupos = grupos
        .map((grupo) => {
          const itens = itensPorGrupo[grupo.id] ?? [];
          if (itens.length === 0) return '';
          const linhas = itens
            .map(
              (item) => `<tr>
                <td>${escaparHtml(item.descricao)}</td>
                <td class="status-${escaparHtml(item.status ?? '')}">${escaparHtml(item.status ?? '—')}</td>
                <td>${escaparHtml(item.observacao)}</td>
              </tr>`
            )
            .join('');
          return `<h2>${escaparHtml(grupo.nome)}</h2><table><thead><tr><th>Item</th><th>Status</th><th>Observação</th></tr></thead><tbody>${linhas}</tbody></table>`;
        })
        .join('');
      const corpo = `<p><strong>Equipamentos:</strong><br/>${cabecalhoEquipamentos || '—'}</p>
        <p><strong>Resumo:</strong> ${resumo.ok} OK · ${resumo.nok} NOK · ${resumo.na} N/A · ${resumo.pendente} pendente(s) de ${resumo.total}</p>
        ${corpoGrupos}`;
      const html = montarHtmlDocumento('Checklist de Inconformidades', codigoComissionamento || 'Comissionamento', corpo);
      await imprimirOuCompartilharPdf(html, 'Checklist');
    } catch (err) {
      alertar('Não foi possível gerar o PDF', err instanceof Error ? err.message : String(err));
    } finally {
      setImprimindo(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.cabecalho}>
        <Text style={styles.resumoTexto}>
          {resumo.ok} OK · {resumo.nok} NOK · {resumo.na} N/A · {resumo.pendente} pendente(s) de {resumo.total}
        </Text>
        <Pressable onPress={imprimir} disabled={imprimindo}>
          <Text style={styles.linkImprimir}>{imprimindo ? 'Gerando...' : '🖨️ Imprimir / PDF'}</Text>
        </Pressable>
      </View>

      {grupos.map((grupo) => {
        const itens = itensPorGrupo[grupo.id] ?? [];
        if (itens.length === 0) return null;
        return (
          <View key={grupo.id} style={styles.grupo}>
            <Text style={styles.grupoTitulo}>{grupo.nome}</Text>
            {itens.map((item) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.itemTexto}>{item.descricao}</Text>
                <View style={styles.opcoes}>
                  {OPCOES.map((opcao) => (
                    <Pressable
                      key={opcao}
                      style={[
                        styles.opcao,
                        item.status === opcao && styles[`opcao_${opcao.replace('/', '')}` as 'opcao_OK'],
                      ]}
                      onPress={() => salvar(item, { status: opcao })}
                      disabled={salvandoId === item.id}
                    >
                      <Text
                        style={[styles.opcaoTexto, item.status === opcao && styles.opcaoTextoSelecionado]}
                      >
                        {opcao}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={styles.observacao}
                  placeholder="Observação / providência (opcional)"
                  value={item.observacao}
                  onChangeText={(texto) => atualizarLocal(item, { observacao: texto })}
                  onEndEditing={() => salvar(item, { observacao: item.observacao })}
                />
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 48 },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  resumoTexto: { fontSize: 12, color: '#555', fontWeight: '600' },
  linkImprimir: { color: '#0B5FFF', fontWeight: '600', fontSize: 13 },
  grupo: { marginBottom: 20 },
  grupoTitulo: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#0B5FFF' },
  item: { marginBottom: 12, backgroundColor: '#F7F8FA', borderRadius: 8, padding: 10 },
  itemTexto: { fontSize: 14, marginBottom: 8 },
  opcoes: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  opcao: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  opcao_OK: { backgroundColor: '#1E9E57', borderColor: '#1E9E57' },
  opcao_NOK: { backgroundColor: '#D6334C', borderColor: '#D6334C' },
  opcao_NA: { backgroundColor: '#8A8F98', borderColor: '#8A8F98' },
  opcaoTexto: { fontSize: 13, fontWeight: '600', color: '#333' },
  opcaoTextoSelecionado: { color: '#fff' },
  observacao: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff' },
});
