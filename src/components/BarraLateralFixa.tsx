import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import type { PapelUsuario } from '../types/database';

type Navegacao = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  papel: PapelUsuario;
  rotaAtual: string | undefined;
}

// Barra lateral FIXA (sem Modal, sem sobreposição) para telas largas
// (web/desktop) — fica sempre visível ao lado do conteúdo, em vez de
// abrir/fechar por cima como o MenuLateral (usado só no mobile estreito).
export default function BarraLateralFixa({ papel, rotaAtual }: Props) {
  const navigation = useNavigation<Navegacao>();
  const podeGerenciar = papel === 'coordenador' || papel === 'admin';

  function irPara(tela: 'Home' | 'Comissionamento' | 'PainelGestao') {
    navigation.navigate(tela as never);
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  return (
    <View style={styles.barra}>
      <Text style={styles.titulo}>SPCS - Automação</Text>

      <ItemMenu label="Início" ativo={rotaAtual === 'Home'} onPress={() => irPara('Home')} />
      <ItemMenu
        label="Comissionamentos"
        ativo={rotaAtual === 'Comissionamento' || rotaAtual === 'ComissionamentoDetalhe'}
        onPress={() => irPara('Comissionamento')}
      />
      {podeGerenciar && (
        <ItemMenu label="Painel de Gestão" ativo={rotaAtual === 'PainelGestao'} onPress={() => irPara('PainelGestao')} />
      )}

      <View style={styles.separador} />
      <ItemMenu label="Sair" destrutivo onPress={sair} />
    </View>
  );
}

function ItemMenu({
  label,
  onPress,
  destrutivo,
  ativo,
}: {
  label: string;
  onPress: () => void;
  destrutivo?: boolean;
  ativo?: boolean;
}) {
  return (
    <Pressable style={[styles.item, ativo && styles.itemAtivo]} onPress={onPress}>
      <Text style={[styles.itemTexto, destrutivo && styles.itemTextoDestrutivo, ativo && styles.itemTextoAtivo]}>
        {label}
      </Text>
    </Pressable>
  );
}

export const LARGURA_BARRA_LATERAL = 240;
// Abaixo desta largura de janela, usa o menu em Modal (mobile); a partir
// daqui, a barra fixa (web/desktop) — ver App.tsx.
export const LARGURA_MINIMA_PARA_BARRA_FIXA = 820;

const styles = StyleSheet.create({
  barra: {
    width: LARGURA_BARRA_LATERAL,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    paddingTop: 24,
    paddingHorizontal: 8,
  },
  titulo: { fontSize: 15, fontWeight: '700', color: '#666', paddingHorizontal: 12, marginBottom: 20 },
  item: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8 },
  itemAtivo: { backgroundColor: '#E3EBFF' },
  itemTexto: { fontSize: 15, fontWeight: '600', color: '#111' },
  itemTextoAtivo: { color: '#0B5FFF' },
  itemTextoDestrutivo: { color: '#B00020' },
  separador: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
});
