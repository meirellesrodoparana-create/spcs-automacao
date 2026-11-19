import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Projeto Supabase NOVO e separado do prolux-field-dashboard — não
// reutilizar as variáveis de ambiente/URL daquele projeto aqui.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigurado) {
  // Não lança erro aqui: isso travaria o app inteiro ao abrir, antes de
  // qualquer tela aparecer. Em vez disso, telas que dependem do Supabase
  // devem checar `supabaseConfigurado` e avisar o usuário, permitindo
  // navegar/testar a UI sem um projeto Supabase já criado.
  console.warn(
    'EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY não definidos em .env — ' +
      'funcionalidades que leem/gravam dados vão falhar até o projeto Supabase existir.'
  );
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
