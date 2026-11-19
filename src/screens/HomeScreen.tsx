import { StyleSheet, Text, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Ponto de entrada: escolher a subestação/equipamento em andamento e
// navegar para um dos 4 documentos. Por enquanto só os atalhos —
// a seleção de comissionamento vem depois que o Cadastro existir.
const ITENS: { label: string; screen: keyof RootStackParamList }[] = [
  { label: 'Cadastro de Automação', screen: 'Cadastro' },
  { label: 'Checklist', screen: 'Checklist' },
  { label: 'PAEL (Painel)', screen: 'Pael' },
  { label: 'Liberação para Energização', screen: 'Liberacao' },
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>SPCS - Automação</Text>
      <Text style={styles.subtitulo}>Comissionamento de campo</Text>

      {ITENS.map((item) => (
        <Pressable
          key={item.screen}
          style={styles.botao}
          onPress={() => navigation.navigate(item.screen as never)}
        >
          <Text style={styles.botaoTexto}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center', gap: 12 },
  titulo: { fontSize: 24, fontWeight: '700', marginBottom: 2 },
  subtitulo: { fontSize: 14, color: '#666', marginBottom: 24 },
  botao: { backgroundColor: '#0B5FFF', borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
