import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { alertar } from '../lib/alerta';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import type { ChecklistGrupo, ChecklistItemTemplate, StatusChecklistItem } from '../types/database';

type Props = NativeStackScreenProps<RootStackParamList, 'Checklist'>;

interface ItemComExecucao extends ChecklistItemTemplate {
  status: StatusChecklistItem | null;
}

const OPCOES: StatusChecklistItem[] = ['OK', 'NOK', 'N/A'];

export default function ChecklistScreen({ route }: Props) {
  const { comissionamentoId } = route.params;
  const [grupos, setGrupos] = useState<ChecklistGrupo[]>([]);
  const [itensPorGrupo, setItensPorGrupo] = useState<Record<string, ItemComExecucao[]>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [{ data: gruposData, error: erroGrupos }, { data: itensData, error: erroItens }, { data: execData, error: erroExec }] =
        await Promise.all([
          supabase.from('checklist_grupos').select('*').order('ordem'),
          supabase.from('checklist_itens_template').select('*').order('ordem'),
          supabase
            .from('checklist_itens_execucao')
            .select('item_template_id, status')
            .eq('comissionamento_id', comissionamentoId),
        ]);
      if (erroGrupos) throw erroGrupos;
      if (erroItens) throw erroItens;
      if (erroExec) throw erroExec;

      const statusPorItem = new Map((execData ?? []).map((e) => [e.item_template_id, e.status as StatusChecklistItem | null]));
      const porGrupo: Record<string, ItemComExecucao[]> = {};
      for (const item of (itensData ?? []) as ChecklistItemTemplate[]) {
        const entry: ItemComExecucao = { ...item, status: statusPorItem.get(item.id) ?? null };
        if (!porGrupo[item.grupo_id]) porGrupo[item.grupo_id] = [];
        porGrupo[item.grupo_id].push(entry);
      }

      setGrupos((gruposData ?? []) as ChecklistGrupo[]);
      setItensPorGrupo(porGrupo);
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

  async function marcar(item: ItemComExecucao, status: StatusChecklistItem) {
    setSalvandoId(item.id);
    // Atualização otimista: marca na tela antes da resposta do servidor.
    setItensPorGrupo((atual) => ({
      ...atual,
      [item.grupo_id]: atual[item.grupo_id].map((i) => (i.id === item.id ? { ...i, status } : i)),
    }));
    try {
      const { error } = await supabase
        .from('checklist_itens_execucao')
        .upsert(
          { comissionamento_id: comissionamentoId, item_template_id: item.id, status },
          { onConflict: 'comissionamento_id,item_template_id' }
        );
      if (error) throw error;
    } catch (err) {
      alertar('Não foi possível salvar', err instanceof Error ? err.message : String(err));
    } finally {
      setSalvandoId(null);
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
                      onPress={() => marcar(item, opcao)}
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
  grupo: { marginBottom: 20 },
  grupoTitulo: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#0B5FFF' },
  item: { marginBottom: 12, backgroundColor: '#F7F8FA', borderRadius: 8, padding: 10 },
  itemTexto: { fontSize: 14, marginBottom: 8 },
  opcoes: { flexDirection: 'row', gap: 8 },
  opcao: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  opcao_OK: { backgroundColor: '#1E9E57', borderColor: '#1E9E57' },
  opcao_NOK: { backgroundColor: '#D6334C', borderColor: '#D6334C' },
  opcao_NA: { backgroundColor: '#8A8F98', borderColor: '#8A8F98' },
  opcaoTexto: { fontSize: 13, fontWeight: '600', color: '#333' },
  opcaoTextoSelecionado: { color: '#fff' },
});
