import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { alertar } from '../lib/alerta';
import { supabase, supabaseConfigurado } from '../lib/supabase';

// Tela única de entrada: login para quem já tem conta, cadastro para quem
// está entrando por LPE/matrícula e esquecer a senha. Sem telas de
// administração de usuários ainda — qualquer um com acesso ao Supabase
// cria a própria conta aqui.
export default function LoginScreen() {
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha) {
      alertar('Preencha e-mail e senha');
      return;
    }
    setCarregando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      if (error) throw error;
    } catch (err) {
      alertar('Não foi possível entrar', err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  }

  async function cadastrar() {
    if (!email.trim() || !senha || !nome.trim()) {
      alertar('Preencha nome, e-mail e senha');
      return;
    }
    if (senha.length < 6) {
      alertar('A senha precisa ter pelo menos 6 caracteres');
      return;
    }
    setCarregando(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
      });
      if (error) throw error;

      if (data.user) {
        const { error: erroPerfil } = await supabase
          .from('perfis')
          .upsert({ id: data.user.id, nome: nome.trim(), papel: 'tecnico' }, { onConflict: 'id' });
        if (erroPerfil) throw erroPerfil;
      }

      if (!data.session) {
        alertar(
          'Conta criada',
          'Verifique seu e-mail para confirmar o cadastro antes de entrar (dependendo da configuração do projeto).'
        );
        setModo('entrar');
      }
    } catch (err) {
      alertar('Não foi possível cadastrar', err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  }

  if (!supabaseConfigurado) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>SPCS - Automação</Text>
        <Text style={styles.aviso}>
          O app ainda não está configurado com um projeto Supabase (.env). Configure
          EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY antes de entrar.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>SPCS - Automação</Text>
      <Text style={styles.subtitulo}>
        {modo === 'entrar' ? 'Entre com sua conta' : 'Crie sua conta'}
      </Text>

      {modo === 'cadastrar' && (
        <TextInput style={styles.input} placeholder="Nome completo" value={nome} onChangeText={setNome} />
      )}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <Pressable
        style={styles.botaoPrimario}
        onPress={modo === 'entrar' ? entrar : cadastrar}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botaoPrimarioTexto}>{modo === 'entrar' ? 'Entrar' : 'Cadastrar'}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setModo(modo === 'entrar' ? 'cadastrar' : 'entrar')}>
        <Text style={styles.link}>
          {modo === 'entrar' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center', gap: 12 },
  titulo: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  aviso: { fontSize: 14, color: '#B00020', textAlign: 'center', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
  botaoPrimario: { backgroundColor: '#0B5FFF', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  botaoPrimarioTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: '#0B5FFF', textAlign: 'center', marginTop: 16, fontSize: 14 },
});
