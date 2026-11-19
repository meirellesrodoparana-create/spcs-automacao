import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import type { PapelUsuario } from '../types/database';

type Navegacao = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  papel: PapelUsuario;
}

// Menu lateral simples (Modal + overlay), sem depender de
// @react-navigation/drawer — evita puxar react-native-gesture-handler/
// reanimated só por causa de um menu de navegação por toque.
export default function MenuLateral({ aberto, aoFechar, papel }: Props) {
  const navigation = useNavigation<Navegacao>();
  const podeGerenciar = papel === 'coordenador' || papel === 'admin';

  function irPara(tela: 'Home' | 'Comissionamento' | 'PainelGestao') {
    aoFechar();
    navigation.navigate(tela as never);
  }

  async function sair() {
    aoFechar();
    await supabase.auth.signOut();
  }

  return (
    <Modal visible={aberto} transparent animationType="fade" onRequestClose={aoFechar}>
      <Pressable style={styles.sobreposicao} onPress={aoFechar}>
        <Pressable style={styles.painel} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.titulo}>SPCS - Automação</Text>

          <ItemMenu label="Início" onPress={() => irPara('Home')} />
          <ItemMenu label="Comissionamentos" onPress={() => irPara('Comissionamento')} />
          {podeGerenciar && (
            <ItemMenu label="Painel de Gestão" onPress={() => irPara('PainelGestao')} />
          )}

          <View style={styles.separador} />
          <ItemMenu label="Sair" destrutivo onPress={sair} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ItemMenu({ label, onPress, destrutivo }: { label: string; onPress: () => void; destrutivo?: boolean }) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Text style={[styles.itemTexto, destrutivo && styles.itemTextoDestrutivo]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sobreposicao: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', flexDirection: 'row' },
  painel: { width: 260, maxWidth: '80%', backgroundColor: '#fff', paddingTop: 56, paddingHorizontal: 8 },
  titulo: { fontSize: 15, fontWeight: '700', color: '#666', paddingHorizontal: 12, marginBottom: 16 },
  item: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 8 },
  itemTexto: { fontSize: 16, fontWeight: '600', color: '#111' },
  itemTextoDestrutivo: { color: '#B00020' },
  separador: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
});
