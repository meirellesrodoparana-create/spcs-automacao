import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checklist'>;

// TODO: carregar checklist_itens_template filtrados pelo tipo do
// equipamento do comissionamento (join com aplica_a_tipos), agrupados
// por checklist_grupos.ordem, e permitir marcar OK/NOK/N-A + observação
// em checklist_itens_execucao. Depende de confirmar com o Tarick os
// itens específicos do Banco de Capacitor (ponto em aberto).
export default function ChecklistScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Checklist</Text>
      <Text style={styles.texto}>
        Em construção — itens virão de checklist_itens_template, agrupados por sistema
        (Transformadores de Instrumento, Painel de Proteção, Medição, Trafo, Retificador...).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  texto: { color: '#555', lineHeight: 20 },
});
