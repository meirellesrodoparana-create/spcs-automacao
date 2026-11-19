import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase, supabaseConfigurado } from '../lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro'>;

// Cadastro de Automação = biblioteca de equipamentos da subestação.
// Campos comuns a todos os tipos de IED (relé, medidor, retificador...).
// A foto da placa de identificação (fase 1 do OCR) ainda não está
// integrada aqui — próximo passo: componente de câmera +
// chamada à Edge Function de OCR para pré-preencher estes campos.
interface FormEquipamento {
  fabricante: string;
  modelo: string;
  tensao: string;
  partNumber: string;
  numeroSerie: string;
  anoFabricacao: string;
}

const FORM_VAZIO: FormEquipamento = {
  fabricante: '',
  modelo: '',
  tensao: '',
  partNumber: '',
  numeroSerie: '',
  anoFabricacao: '',
};

export default function CadastroScreen(_props: Props) {
  const [form, setForm] = useState<FormEquipamento>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  function atualizar<K extends keyof FormEquipamento>(campo: K, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvar() {
    if (!supabaseConfigurado) {
      Alert.alert(
        'Supabase ainda não configurado',
        'Preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env (ver .env.example) ' +
          'depois que o projeto Supabase existir. Por enquanto só é possível navegar pelas telas.'
      );
      return;
    }
    setSalvando(true);
    try {
      // TODO: trocar subestacao_id/tipo_equipamento_id fixos por seleção
      // real assim que as telas de escolha de SE/tipo existirem.
      const { error } = await supabase.from('equipamentos').insert({
        subestacao_id: null,
        tipo_equipamento_id: null,
        fabricante: form.fabricante || null,
        modelo: form.modelo || null,
        tensao: form.tensao || null,
        part_number: form.partNumber || null,
        numero_serie: form.numeroSerie || null,
        ano_fabricacao: form.anoFabricacao ? Number(form.anoFabricacao) : null,
      });
      if (error) throw error;
      Alert.alert('Salvo', 'Equipamento cadastrado.');
      setForm(FORM_VAZIO);
    } catch (err) {
      // TODO: ao integrar a fila offline, cair aqui só quando o erro
      // não for de conectividade — erro de rede deve ir para a fila.
      Alert.alert('Erro ao salvar', err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Cadastro de Automação</Text>

      <Campo label="Fabricante" valor={form.fabricante} onChange={(v) => atualizar('fabricante', v)} />
      <Campo label="Modelo" valor={form.modelo} onChange={(v) => atualizar('modelo', v)} />
      <Campo label="Tensão" valor={form.tensao} onChange={(v) => atualizar('tensao', v)} />
      <Campo label="Part Number" valor={form.partNumber} onChange={(v) => atualizar('partNumber', v)} />
      <Campo label="Nº de Série" valor={form.numeroSerie} onChange={(v) => atualizar('numeroSerie', v)} />
      <Campo
        label="Ano de Fabricação"
        valor={form.anoFabricacao}
        onChange={(v) => atualizar('anoFabricacao', v)}
        teclado="numeric"
      />

      <Pressable style={styles.botao} onPress={salvar} disabled={salvando}>
        <Text style={styles.botaoTexto}>{salvando ? 'Salvando...' : 'Salvar equipamento'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Campo({
  label,
  valor,
  onChange,
  teclado = 'default',
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  teclado?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={valor}
        onChangeText={onChange}
        keyboardType={teclado}
        autoCapitalize="characters"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 4 },
  titulo: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  campo: { marginBottom: 12 },
  label: { fontSize: 13, color: '#444', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  botao: { backgroundColor: '#0B5FFF', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  botaoTexto: { color: '#fff', fontWeight: '600' },
});
