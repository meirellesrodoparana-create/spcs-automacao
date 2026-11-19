import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { alertar } from '../lib/alerta';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import type { PaelDisciplina, PaelEtapaTemplate, RealizadoPael } from '../types/database';

type Props = NativeStackScreenProps<RootStackParamList, 'Pael'>;

interface EtapaComExecucao extends PaelEtapaTemplate {
  realizado: RealizadoPael | null;
  observacao: string;
}

const OPCOES: RealizadoPael[] = ['SIM', 'NAO', 'N/A'];
const LABEL: Record<RealizadoPael, string> = { SIM: 'SIM', NAO: 'NÃO', 'N/A': 'N/A' };

export default function PaelScreen({ route }: Props) {
  const { comissionamentoId } = route.params;
  const [disciplinas, setDisciplinas] = useState<PaelDisciplina[]>([]);
  const [etapasPorDisciplina, setEtapasPorDisciplina] = useState<Record<string, EtapaComExecucao[]>>({});
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [{ data: discData, error: erroDisc }, { data: etapasData, error: erroEtapas }, { data: execData, error: erroExec }] =
        await Promise.all([
          supabase.from('pael_disciplinas').select('*').order('ordem'),
          supabase.from('pael_etapas_template').select('*').order('ordem'),
          supabase
            .from('pael_etapas_execucao')
            .select('etapa_template_id, realizado, observacao')
            .eq('comissionamento_id', comissionamentoId),
        ]);
      if (erroDisc) throw erroDisc;
      if (erroEtapas) throw erroEtapas;
      if (erroExec) throw erroExec;

      const execPorEtapa = new Map((execData ?? []).map((e) => [e.etapa_template_id, e]));
      const porDisciplina: Record<string, EtapaComExecucao[]> = {};
      for (const etapa of (etapasData ?? []) as PaelEtapaTemplate[]) {
        const exec = execPorEtapa.get(etapa.id);
        const entry: EtapaComExecucao = {
          ...etapa,
          realizado: (exec?.realizado as RealizadoPael | null) ?? null,
          observacao: exec?.observacao ?? '',
        };
        if (!porDisciplina[etapa.disciplina_id]) porDisciplina[etapa.disciplina_id] = [];
        porDisciplina[etapa.disciplina_id].push(entry);
      }

      setDisciplinas((discData ?? []) as PaelDisciplina[]);
      setEtapasPorDisciplina(porDisciplina);
    } catch (err) {
      alertar('Erro ao carregar PAEL', err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  }, [comissionamentoId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  function atualizarLocal(etapa: EtapaComExecucao, campos: Partial<EtapaComExecucao>) {
    setEtapasPorDisciplina((atual) => ({
      ...atual,
      [etapa.disciplina_id]: atual[etapa.disciplina_id].map((e) =>
        e.id === etapa.id ? { ...e, ...campos } : e
      ),
    }));
  }

  async function salvar(etapa: EtapaComExecucao, campos: { realizado?: RealizadoPael; observacao?: string }) {
    atualizarLocal(etapa, campos);
    try {
      const { error } = await supabase.from('pael_etapas_execucao').upsert(
        {
          comissionamento_id: comissionamentoId,
          etapa_template_id: etapa.id,
          realizado: campos.realizado ?? etapa.realizado,
          observacao: campos.observacao ?? etapa.observacao,
        },
        { onConflict: 'comissionamento_id,etapa_template_id' }
      );
      if (error) throw error;
    } catch (err) {
      alertar('Não foi possível salvar', err instanceof Error ? err.message : String(err));
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
      {disciplinas.map((disciplina) => {
        const etapas = etapasPorDisciplina[disciplina.id] ?? [];
        if (etapas.length === 0) return null;
        return (
          <View key={disciplina.id} style={styles.disciplina}>
            <Text style={styles.disciplinaTitulo}>{disciplina.nome}</Text>
            {etapas.map((etapa) => (
              <View key={etapa.id} style={styles.etapa}>
                <Text style={styles.etapaTexto}>{etapa.descricao}</Text>
                <View style={styles.opcoes}>
                  {OPCOES.map((opcao) => (
                    <Pressable
                      key={opcao}
                      style={[styles.opcao, etapa.realizado === opcao && styles.opcaoSelecionada]}
                      onPress={() => salvar(etapa, { realizado: opcao })}
                    >
                      <Text
                        style={[styles.opcaoTexto, etapa.realizado === opcao && styles.opcaoTextoSelecionado]}
                      >
                        {LABEL[opcao]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={styles.observacao}
                  placeholder="Observação (opcional)"
                  value={etapa.observacao}
                  onChangeText={(texto) => atualizarLocal(etapa, { observacao: texto })}
                  onEndEditing={() => salvar(etapa, { observacao: etapa.observacao })}
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
  disciplina: { marginBottom: 20 },
  disciplinaTitulo: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#0B5FFF' },
  etapa: { marginBottom: 12, backgroundColor: '#F7F8FA', borderRadius: 8, padding: 10 },
  etapaTexto: { fontSize: 14, marginBottom: 8 },
  opcoes: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  opcao: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  opcaoSelecionada: { backgroundColor: '#0B5FFF', borderColor: '#0B5FFF' },
  opcaoTexto: { fontSize: 13, fontWeight: '600', color: '#333' },
  opcaoTextoSelecionado: { color: '#fff' },
  observacao: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff' },
});
