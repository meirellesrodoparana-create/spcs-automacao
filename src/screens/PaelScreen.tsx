import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Pael'>;

// TODO: carregar pael_etapas_template por disciplina (Medição,
// Proteção Bay, Sistema de Alimentação CC, Proteção Transformador,
// Regulação e Controle de Temperatura, Automatismos), marcar
// SIM/NÃO/N-A + observação em pael_etapas_execucao, e permitir
// anexar evidências fotográficas por subsistema (pael_evidencias:
// QDCA, Retificador, Relé, T.I. — aba "TESTE CA" do doc original).
export default function PaelScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>PAEL (Painel)</Text>
      <Text style={styles.texto}>
        Em construção — lista de etapas de execução por disciplina, com evidências fotográficas
        por subsistema.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  texto: { color: '#555', lineHeight: 20 },
});
