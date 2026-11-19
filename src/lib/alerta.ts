import { Alert, Platform } from 'react-native';

// Alert.alert do React Native não mostra nada na versão web — fica mudo,
// sem erro algum, o que faz parecer que "nada funciona" quando na verdade
// uma chamada falhou e ninguém viu a mensagem. Esta função cai para
// window.alert/confirm no navegador e mantém o Alert nativo no app.
export function alertar(titulo: string, mensagem?: string) {
  if (Platform.OS === 'web') {
    window.alert(mensagem ? `${titulo}\n\n${mensagem}` : titulo);
    return;
  }
  Alert.alert(titulo, mensagem);
}

export function confirmar(titulo: string, mensagem: string, aoConfirmar: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) aoConfirmar();
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Confirmar', onPress: aoConfirmar },
  ]);
}
