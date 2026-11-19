import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase, supabaseConfigurado } from '../lib/supabase';
import { criarComissionamento, listarComissionamentosAbertos, type ComissionamentoComSubestacao } from '../lib/comissionamento';

type Props = NativeStackScreenProps<RootStackParamList, 'Comissionamento'>;

export default function ComissionamentoScreen({ navigation }: Props) {
  const [abertos, setAbertos] = useState<ComissionamentoComSubestacao[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [distribuidoraSigla, setDistribuidoraSigla] = useState('');
  const [subestacaoSigla, setSubestacaoSigla] = useState('');
  const [subestacaoNome, setSubestacaoNome] = useState('');
  const [codigoOperacional, setCodigoOperacional] = useState('');
  const [tipoObra, setTipoObra] = useState('');
  const [criando, setCriando] = useState(false);

  const carregarAbertos = useCallback(async () => {
    if (!supabaseConfigurado) return;
    setCarregando(true);
    try {
      setAbertos(await listarComissionamentosAbertos());
    } catch (err) {
      Alert.alert('Erro ao carregar', err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarAbertos();
    }, [carregarAbertos])
  );

  async function criar() {
    if (!supabaseConfigurado) {
      Alert.alert('Supabase não configurado', 'Preencha o .env antes de criar um comissionamento.');
      return;
    }
    if (!distribuidoraSigla || !subestacaoSigla) {
      Alert.alert('Faltam dados', 'Informe ao menos a distribuidora e a sigla da subestação.');
      return;
    }
    setCriando(true);
    try {
      const id = await criarComissionamento({
        distribuidoraSigla,
        subestacaoSigla,
        subestacaoNome: subestacaoNome || subestacaoSigla,
        codigoOperacional,
        tipoObra,
      });
      navigation.navigate('ComissionamentoDetalhe', { comissionamentoId: id });
    } catch (err) {
      Alert.alert('Erro ao criar', err instanceof Error ? err.message : String(err));
    } finally {
      setCriando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Comissionamentos em andamento</Text>
      {carregando && <Text style={styles.texto}>Carregando...</Text>}
      {!carregando && abertos.length === 0 && (
        <Text style={styles.texto}>Nenhum comissionamento aberto. Crie um abaixo.</Text>
      )}
      {abertos.map((c) => (
        <Pressable
          key={c.id}
          style={styles.cartao}
          onPress={() => navigation.navigate('ComissionamentoDetalhe', { comissionamentoId: c.id })}
        >
          <Text style={styles.cartaoTitulo}>
            {c.subestacoes?.sigla ?? '—'} {c.codigo_operacional ? `· ${c.codigo_operacional}` : ''}
          </Text>
          <Text style={styles.cartaoSubtitulo}>{c.subestacoes?.nome ?? ''} · {c.status}</Text>
        </Pressable>
      ))}

      <Text style={[styles.titulo, styles.tituloSecundario]}>Novo comissionamento</Text>
      <Campo label="Distribuidora (sigla)" valor={distribuidoraSigla} onChange={setDistribuidoraSigla} />
      <Campo label="Subestação (sigla)" valor={subestacaoSigla} onChange={setSubestacaoSigla} />
      <Campo label="Subestação (nome completo)" valor={subestacaoNome} onChange={setSubestacaoNome} />
      <Campo label="Código Operacional (ex.: DJ L52-1)" valor={codigoOperacional} onChange={setCodigoOperacional} />
      <Campo label="Tipo de obra" valor={tipoObra} onChange={setTipoObra} />

      <Pressable style={styles.botao} onPress={criar} disabled={criando}>
        <Text style={styles.botaoTexto}>{criando ? 'Criando...' : 'Criar e abrir'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Campo({ label, valor, onChange }: { label: string; valor: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={valor} onChangeText={onChange} autoCapitalize="characters" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 4 },
  titulo: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  tituloSecundario: { marginTop: 24 },
  texto: { color: '#555', marginBottom: 12 },
  cartao: { backgroundColor: '#F2F5FF', borderRadius: 10, padding: 14, marginBottom: 10 },
  cartaoTitulo: { fontWeight: '700', fontSize: 15 },
  cartaoSubtitulo: { color: '#555', marginTop: 2 },
  campo: { marginBottom: 12 },
  label: { fontSize: 13, color: '#444', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  botao: { backgroundColor: '#0B5FFF', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  botaoTexto: { color: '#fff', fontWeight: '600' },
});
