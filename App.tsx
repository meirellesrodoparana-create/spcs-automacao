import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Pressable, Text, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Session } from '@supabase/supabase-js';
import type { RootStackParamList } from './src/navigation/types';
import type { PapelUsuario } from './src/types/database';
import { supabase, supabaseConfigurado } from './src/lib/supabase';
import MenuLateral from './src/components/MenuLateral';
import BarraLateralFixa, { LARGURA_MINIMA_PARA_BARRA_FIXA } from './src/components/BarraLateralFixa';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import ComissionamentoScreen from './src/screens/ComissionamentoScreen';
import ComissionamentoDetalheScreen from './src/screens/ComissionamentoDetalheScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import PaelScreen from './src/screens/PaelScreen';
import LiberacaoScreen from './src/screens/LiberacaoScreen';
import ConferenciaDnp3Screen from './src/screens/ConferenciaDnp3Screen';
import PainelGestaoScreen from './src/screens/PainelGestaoScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [papel, setPapel] = useState<PapelUsuario>('tecnico');
  const [menuAberto, setMenuAberto] = useState(false);
  const [rotaAtual, setRotaAtual] = useState<string | undefined>(undefined);
  const { width } = useWindowDimensions();
  // Telas largas (web/desktop) ganham a barra lateral fixa; mobile estreito
  // continua com o menu hambúrguer em Modal (ocuparia espaço demais fixo).
  const telaLarga = width >= LARGURA_MINIMA_PARA_BARRA_FIXA;

  useEffect(() => {
    if (!supabaseConfigurado) {
      setCarregandoSessao(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregandoSessao(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  // Papel do usuário logado (técnico/coordenador/admin) decide se o
  // atalho "Painel de Gestão" aparece no menu lateral. Falha
  // silenciosa e segura: sem perfil ainda, trata como técnico comum.
  useEffect(() => {
    if (!sessao || !supabaseConfigurado) {
      setPapel('tecnico');
      return;
    }
    let ativo = true;
    supabase
      .from('perfis')
      .select('papel')
      .eq('id', sessao.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (ativo) setPapel((data?.papel as PapelUsuario) ?? 'tecnico');
      });
    return () => {
      ativo = false;
    };
  }, [sessao]);

  if (carregandoSessao) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!sessao) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer
      onStateChange={(estado) => {
        const rota = estado?.routes[estado.index];
        setRotaAtual(rota?.name);
      }}
    >
      <StatusBar style="auto" />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {telaLarga && <BarraLateralFixa papel={papel} rotaAtual={rotaAtual} />}
        <View style={{ flex: 1 }}>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              // Na barra fixa a navegação já está sempre visível — o
              // hambúrguer só faz sentido (e só aparece) no mobile estreito.
              headerLeft: telaLarga
                ? undefined
                : () => (
                    <Pressable onPress={() => setMenuAberto(true)} hitSlop={10} style={{ paddingHorizontal: 8 }}>
                      <Text style={{ fontSize: 22 }}>☰</Text>
                    </Pressable>
                  ),
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'SPCS - Automação' }} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ title: 'Cadastro de Automação' }} />
            <Stack.Screen name="Comissionamento" component={ComissionamentoScreen} options={{ title: 'Comissionamentos' }} />
            <Stack.Screen
              name="ComissionamentoDetalhe"
              component={ComissionamentoDetalheScreen}
              options={{ title: 'Comissionamento' }}
            />
            <Stack.Screen name="Checklist" component={ChecklistScreen} options={{ title: 'Checklist' }} />
            <Stack.Screen name="Pael" component={PaelScreen} options={{ title: 'PAEL' }} />
            <Stack.Screen name="Liberacao" component={LiberacaoScreen} options={{ title: 'Liberação para Energização' }} />
            <Stack.Screen
              name="ConferenciaDnp3"
              component={ConferenciaDnp3Screen}
              options={{ title: 'Conferência DNP3 (Log x Mapa)' }}
            />
            <Stack.Screen name="PainelGestao" component={PainelGestaoScreen} options={{ title: 'Painel de Gestão' }} />
          </Stack.Navigator>
        </View>
      </View>
      {!telaLarga && <MenuLateral aberto={menuAberto} aoFechar={() => setMenuAberto(false)} papel={papel} />}
    </NavigationContainer>
  );
}
