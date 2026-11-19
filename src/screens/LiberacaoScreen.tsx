import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Liberacao'>;

// TODO: formulário da LPE — nº LPE, tipo (total/parcial), disciplinas
// liberadas (proteção/medição/comunicação), tabela de equipamentos
// cobertos (liberacao_equipamentos), não conformidades, e assinatura
// (ponto em aberto: assinatura digital no app ou só nome/matrícula/data?).
export default function LiberacaoScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Liberação para Energização</Text>
      <Text style={styles.texto}>
        Em construção — formulário da LPE, reunindo os dados do comissionamento para aprovação
        final (Coordenação + visto da Gerência).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  texto: { color: '#555', lineHeight: 20 },
});
