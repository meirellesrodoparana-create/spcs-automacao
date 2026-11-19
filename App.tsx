import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Session } from '@supabase/supabase-js';
import type { RootStackParamList } from './src/navigation/types';
import { supabase, supabaseConfigurado } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import ComissionamentoScreen from './src/screens/ComissionamentoScreen';
import ComissionamentoDetalheScreen from './src/screens/ComissionamentoDetalheScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import PaelScreen from './src/screens/PaelScreen';
import LiberacaoScreen from './src/screens/LiberacaoScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

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
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Home">
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
