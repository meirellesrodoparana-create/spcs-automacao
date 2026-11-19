import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import type { Comissionamento } from '../types/database';

type Props = NativeStackScreenProps<RootStackParamList, 'ComissionamentoDetalhe'>;

export default function ComissionamentoDetalheScreen({ route, navigation }: Props) {
  const { comissionamentoId } = route.params;
  const [comissionamento, setComissionamento] = useState<Comissionamento | null>(null);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      supabase
        .from('comissionamentos')
        .select('*')
        .eq('id', comissionamentoId)
        .single()
        .then(({ data }) => {
          if (ativo) {
            setComissionamento(data as Comissionamento);
            setCarregando(false);
          }
        });
      return () => {
        ativo = false;
      };
    }, [comissionamentoId])
  );

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        {comissionamento?.codigo_operacional || 'Comissionamento'}
      </Text>
      <Text style={styles.subtitulo}>Status: {comissionamento?.status}</Text>

      <Pressable
        style={styles.botao}
        onPress={() => navigation.navigate('Cadastro', { comissionamentoId })}
      >
        <Text style={styles.botaoTexto}>Cadastro de Automação</Text>
      </Pressable>
      <Pressable
        style={styles.botao}
        onPress={() => navigation.navigate('Checklist', { comissionamentoId })}
      >
        <Text style={styles.botaoTexto}>Checklist</Text>
      </Pressable>
      <Pressable style={styles.botao} onPress={() => navigation.navigate('Pael', { comissionamentoId })}>
        <Text style={styles.botaoTexto}>PAEL (Painel)</Text>
      </Pressable>
      <Pressable
        style={styles.botao}
        onPress={() => navigation.navigate('Liberacao', { comissionamentoId })}
      >
        <Text style={styles.botaoTexto}>Liberação para Energização</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 24, gap: 12 },
  titulo: { fontSize: 22, fontWeight: '700' },
  subtitulo: { fontSize: 14, color: '#666', marginBottom: 20 },
  botao: { backgroundColor: '#0B5FFF', borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
