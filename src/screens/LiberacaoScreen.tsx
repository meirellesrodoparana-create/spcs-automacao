import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Switch } from 'react-native';
import { alertar } from '../lib/alerta';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import type { Liberacao, TipoLiberacao } from '../types/database';

type Props = NativeStackScreenProps<RootStackParamList, 'Liberacao'>;

export default function LiberacaoScreen({ route }: Props) {
  const { comissionamentoId } = route.params;
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [registroId, setRegistroId] = useState<string | null>(null);

  const [numeroLpe, setNumeroLpe] = useState('');
  const [tipo, setTipo] = useState<TipoLiberacao>('total');
  const [gerencia, setGerencia] = useState('');
  const [protecaoLiberada, setProtecaoLiberada] = useState(false);
  const [medicaoLiberada, setMedicaoLiberada] = useState(false);
  const [comunicacaoLiberada, setComunicacaoLiberada] = useState(false);
  const [naoConformidades, setNaoConformidades] = useState('');
  const [responsavelCoordenacao, setResponsavelCoordenacao] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('liberacoes')
        .select('*')
        .eq('comissionamento_id', comissionamentoId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const liberacao = data as Liberacao;
        setRegistroId(liberacao.id);
        setNumeroLpe(liberacao.numero_lpe ?? '');
        setTipo(liberacao.tipo);
        setGerencia(liberacao.gerencia ?? '');
        setProtecaoLiberada(liberacao.protecao_liberada);
        setMedicaoLiberada(liberacao.medicao_liberada);
        setComunicacaoLiberada(liberacao.comunicacao_liberada);
        setNaoConformidades(liberacao.nao_conformidades ?? '');
        setResponsavelCoordenacao(liberacao.responsavel_coordenacao ?? '');
      }
    } catch (err) {
      alertar('Erro ao carregar liberação', err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  }, [comissionamentoId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function salvar() {
    if (!numeroLpe.trim()) {
      alertar('Informe o número da LPE');
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        comissionamento_id: comissionamentoId,
        numero_lpe: numeroLpe.trim(),
        tipo,
        data: new Date().toISOString().slice(0, 10),
        gerencia: gerencia.trim() || null,
        protecao_liberada: protecaoLiberada,
        medicao_liberada: medicaoLiberada,
        comunicacao_liberada: comunicacaoLiberada,
        nao_conformidades: naoConformidades.trim() || null,
        responsavel_coordenacao: responsavelCoordenacao.trim() || null,
      };

      if (registroId) {
        const { error } = await supabase.from('liberacoes').update(payload).eq('id', registroId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('liberacoes').insert(payload).select('id').single();
        if (error) throw error;
        setRegistroId(data.id);
      }

      const { error: erroStatus } = await supabase
        .from('comissionamentos')
        .update({ status: 'liberado' })
        .eq('id', comissionamentoId);
      if (erroStatus) throw erroStatus;

      alertar('Liberação salva', 'A LPE foi registrada e o comissionamento marcado como liberado.');
    } catch (err) {
      alertar('Não foi possível salvar', err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
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
      <Text style={styles.label}>Número da LPE</Text>
      <TextInput style={styles.input} value={numeroLpe} onChangeText={setNumeroLpe} placeholder="Ex: LPE-2026-0123" />

      <Text style={styles.label}>Tipo de liberação</Text>
      <View style={styles.opcoes}>
        {(['total', 'parcial'] as TipoLiberacao[]).map((opcao) => (
          <Pressable
            key={opcao}
            style={[styles.opcao, tipo === opcao && styles.opcaoSelecionada]}
            onPress={() => setTipo(opcao)}
          >
            <Text style={[styles.opcaoTexto, tipo === opcao && styles.opcaoTextoSelecionado]}>
              {opcao === 'total' ? 'Total' : 'Parcial'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Gerência responsável</Text>
      <TextInput style={styles.input} value={gerencia} onChangeText={setGerencia} placeholder="Opcional" />

      <View style={styles.linhaSwitch}>
        <Text style={styles.switchLabel}>Proteção liberada</Text>
        <Switch value={protecaoLiberada} onValueChange={setProtecaoLiberada} />
      </View>
      <View style={styles.linhaSwitch}>
        <Text style={styles.switchLabel}>Medição liberada</Text>
        <Switch value={medicaoLiberada} onValueChange={setMedicaoLiberada} />
      </View>
      <View style={styles.linhaSwitch}>
        <Text style={styles.switchLabel}>Comunicação liberada</Text>
        <Switch value={comunicacaoLiberada} onValueChange={setComunicacaoLiberada} />
      </View>

      <Text style={styles.label}>Não conformidades</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={naoConformidades}
        onChangeText={setNaoConformidades}
        placeholder="Descreva pendências, se houver"
        multiline
      />

      <Text style={styles.label}>Responsável pela coordenação</Text>
      <TextInput style={styles.input} value={responsavelCoordenacao} onChangeText={setResponsavelCoordenacao} />

      <Pressable style={styles.botaoSalvar} onPress={salvar} disabled={salvando}>
        <Text style={styles.botaoSalvarTexto}>{salvando ? 'Salvando...' : 'Salvar liberação'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 6, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  opcoes: { flexDirection: 'row', gap: 8 },
  opcao: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  opcaoSelecionada: { backgroundColor: '#0B5FFF', borderColor: '#0B5FFF' },
  opcaoTexto: { fontSize: 13, fontWeight: '600', color: '#333' },
  opcaoTextoSelecionado: { color: '#fff' },
  linhaSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchLabel: { fontSize: 14 },
  botaoSalvar: { backgroundColor: '#0B5FFF', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  botaoSalvarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
