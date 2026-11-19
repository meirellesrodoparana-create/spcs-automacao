import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { alertar } from '../lib/alerta';
import {
  listarEquipamentosDaSubestacao,
  obterResumoComissionamento,
  type EquipamentoComTipo,
  type ResumoComissionamento,
} from '../lib/comissionamento';
import type { Comissionamento } from '../types/database';

type Props = NativeStackScreenProps<RootStackParamList, 'ComissionamentoDetalhe'>;

export default function ComissionamentoDetalheScreen({ route, navigation }: Props) {
  const { comissionamentoId } = route.params;
  const [comissionamento, setComissionamento] = useState<Comissionamento | null>(null);
  const [equipamentos, setEquipamentos] = useState<EquipamentoComTipo[]>([]);
  const [resumo, setResumo] = useState<ResumoComissionamento | null>(null);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      (async () => {
        try {
          const { data: com, error: erroCom } = await supabase
            .from('comissionamentos')
            .select('*')
            .eq('id', comissionamentoId)
            .single();
          if (erroCom) throw erroCom;
          if (!ativo) return;
          setComissionamento(com as Comissionamento);

          const [equips, resumoDados] = await Promise.all([
            listarEquipamentosDaSubestacao(com.subestacao_id),
            obterResumoComissionamento(comissionamentoId),
          ]);
          if (!ativo) return;
          setEquipamentos(equips);
          setResumo(resumoDados);
        } catch (err) {
          if (ativo) alertar('Erro ao carregar', err instanceof Error ? err.message : String(err));
        } finally {
          if (ativo) setCarregando(false);
        }
      })();
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
    <ScrollView contentContainerStyle={styles.container}>
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
        <Text style={styles.botaoTexto}>
          Checklist{resumo ? ` (${resumo.checklistPreenchidos} itens preenchidos)` : ''}
        </Text>
      </Pressable>
      <Pressable style={styles.botao} onPress={() => navigation.navigate('Pael', { comissionamentoId })}>
        <Text style={styles.botaoTexto}>
          PAEL (Painel){resumo ? ` (${resumo.paelPreenchidas} etapas preenchidas)` : ''}
        </Text>
      </Pressable>
      <Pressable
        style={styles.botao}
        onPress={() => navigation.navigate('Liberacao', { comissionamentoId })}
      >
        <Text style={styles.botaoTexto}>
          Liberação para Energização
          {resumo?.liberacao ? ` — LPE ${resumo.liberacao.numeroLpe}` : ' (ainda não emitida)'}
        </Text>
      </Pressable>

      <Text style={styles.secaoTitulo}>Equipamentos cadastrados nesta subestação</Text>
      {equipamentos.length === 0 && (
        <Text style={styles.textoVazio}>Nenhum equipamento cadastrado ainda — use "Cadastro de Automação" acima.</Text>
      )}
      {equipamentos.map((eq) => (
        <View key={eq.id} style={styles.cartaoEquipamento}>
          <Text style={styles.equipamentoTipo}>{eq.tipos_equipamento?.descricao ?? 'Equipamento'}</Text>
          <Text style={styles.equipamentoDetalhe}>
            {[eq.codigo_operacional, eq.fabricante, eq.modelo].filter(Boolean).join(' · ') || 'Sem detalhes preenchidos'}
          </Text>
          {eq.numero_serie && <Text style={styles.equipamentoDetalheSecundario}>Nº série: {eq.numero_serie}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 24, gap: 12 },
  titulo: { fontSize: 22, fontWeight: '700' },
  subtitulo: { fontSize: 14, color: '#666', marginBottom: 20 },
  botao: { backgroundColor: '#0B5FFF', borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secaoTitulo: { fontSize: 16, fontWeight: '700', marginTop: 28, marginBottom: 10 },
  textoVazio: { color: '#777', fontSize: 13 },
  cartaoEquipamento: { backgroundColor: '#F7F7F9', borderRadius: 10, padding: 12, marginBottom: 8 },
  equipamentoTipo: { fontWeight: '700', fontSize: 14 },
  equipamentoDetalhe: { color: '#444', fontSize: 13, marginTop: 2 },
  equipamentoDetalheSecundario: { color: '#888', fontSize: 12, marginTop: 2 },
});
