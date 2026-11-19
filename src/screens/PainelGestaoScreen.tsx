import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { alertar } from '../lib/alerta';
import { listarTodosComissionamentos, type ComissionamentoComSubestacao } from '../lib/comissionamento';

type Props = NativeStackScreenProps<RootStackParamList, 'PainelGestao'>;

const ROTULO_STATUS: Record<string, string> = {
  em_andamento: 'Em andamento',
  em_montagem: 'Em montagem',
  liberado: 'Liberado',
  liberado_com_ressalvas: 'Liberado com ressalvas',
  nao_liberado: 'Não liberado',
};

// Visão de coordenação/gerência: todos os comissionamentos da equipe,
// de qualquer técnico, em qualquer status. O RLS já permite leitura
// compartilhada — este painel só reúne tudo numa lista só, pensado pra
// uso na versão web.
export default function PainelGestaoScreen({ navigation }: Props) {
  const [lista, setLista] = useState<ComissionamentoComSubestacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setLista(await listarTodosComissionamentos());
    } catch (err) {
      alertar('Erro ao carregar', err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Painel de Gestão</Text>
      <Text style={styles.subtitulo}>{lista.length} comissionamento(s) no total</Text>

      {lista.map((c) => (
        <Pressable
          key={c.id}
          style={styles.cartao}
          onPress={() => navigation.navigate('ComissionamentoDetalhe', { comissionamentoId: c.id })}
        >
          <View style={styles.cartaoTopo}>
            <Text style={styles.cartaoTitulo}>
              {c.subestacoes?.sigla ?? '—'} {c.codigo_operacional ? `· ${c.codigo_operacional}` : ''}
            </Text>
            <Text style={styles.badge}>{ROTULO_STATUS[c.status] ?? c.status}</Text>
          </View>
          <Text style={styles.cartaoSubtitulo}>{c.subestacoes?.nome ?? ''}</Text>
          {c.responsavel_tecnico && <Text style={styles.cartaoDetalhe}>Técnico: {c.responsavel_tecnico}</Text>}
          <Text style={styles.cartaoData}>Criado em {new Date(c.criado_em).toLocaleDateString('pt-BR')}</Text>
        </Pressable>
      ))}

      {lista.length === 0 && <Text style={styles.texto}>Nenhum comissionamento cadastrado ainda.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, gap: 4 },
  titulo: { fontSize: 20, fontWeight: '700' },
  subtitulo: { fontSize: 13, color: '#666', marginBottom: 16 },
  texto: { color: '#555' },
  cartao: { backgroundColor: '#F2F5FF', borderRadius: 10, padding: 14, marginBottom: 10 },
  cartaoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartaoTitulo: { fontWeight: '700', fontSize: 15 },
  cartaoSubtitulo: { color: '#555', marginTop: 2 },
  cartaoDetalhe: { color: '#555', fontSize: 13, marginTop: 2 },
  cartaoData: { color: '#888', fontSize: 12, marginTop: 6 },
  badge: { fontSize: 11, fontWeight: '700', color: '#0B5FFF', backgroundColor: '#E3EBFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
});
