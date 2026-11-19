import { StyleSheet, Text, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Ponto de entrada: Cadastro de Automação é independente; Checklist, PAEL e
// Liberação exigem um comissionamento aberto, então passam pela tela de
// seleção/criação de comissionamento antes de chegar lá.
const ITENS: { label: string; screen: 'Cadastro' | 'Comissionamento' }[] = [
  { label: 'Cadastro de Automação', screen: 'Cadastro' },
  { label: 'Comissionamentos (Checklist / PAEL / Liberação)', screen: 'Comissionamento' },
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
