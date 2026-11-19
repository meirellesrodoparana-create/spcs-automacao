import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import PaelScreen from './src/screens/PaelScreen';
import LiberacaoScreen from './src/screens/LiberacaoScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'SPCS - Automação' }} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ title: 'Cadastro de Automação' }} />
        <Stack.Screen name="Checklist" component={ChecklistScreen} options={{ title: 'Checklist' }} />
        <Stack.Screen name="Pael" component={PaelScreen} options={{ title: 'PAEL' }} />
        <Stack.Screen name="Liberacao" component={LiberacaoScreen} options={{ title: 'Liberação para Energização' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
