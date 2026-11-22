import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { alertar } from '../lib/alerta';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase, supabaseConfigurado } from '../lib/supabase';
import { listarAplicacoesDnp3, type AplicacaoDnp3 } from '../lib/dnp3';
import type { TipoEquipamento } from '../types/database';

type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro'>;

// Cadastro de Automação = biblioteca de equipamentos da subestação.
// Cada equipamento pertence à subestação do comissionamento aberto (por
// isso esta tela exige comissionamentoId) e a um tipo (relé, medidor,
// retificador...) escolhido na lista abaixo. Quando `equipamentoId` vem
// na rota, a tela entra em modo edição (carrega e faz update em vez de
// insert) — usada pela lista de equipamentos do comissionamento.
// A foto da placa de identificação (fase 1 do OCR) ainda não está
// integrada aqui — próximo passo: componente de câmera + chamada à
// Edge Function de OCR para pré-preencher estes campos.
interface FormEquipamento {
  codigoOperacional: string;
  fabricante: string;
  modelo: string;
  tensao: string;
  partNumber: string;
  numeroSerie: string;
  anoFabricacao: string;
}

const FORM_VAZIO: FormEquipamento = {
  codigoOperacional: '',
  fabricante: '',
  modelo: '',
  tensao: '',
  partNumber: '',
  numeroSerie: '',
  anoFabricacao: '',
};

export default function CadastroScreen({ route, navigation }: Props) {
  const comissionamentoId = route.params?.comissionamentoId;
  const equipamentoId = route.params?.equipamentoId;
  const emEdicao = Boolean(equipamentoId);

  const [form, setForm] = useState<FormEquipamento>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [tipos, setTipos] = useState<TipoEquipamento[]>([]);
  const [tipoSelecionadoId, setTipoSelecionadoId] = useState<string | null>(null);
  const [subestacaoId, setSubestacaoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [aplicacoesDnp3, setAplicacoesDnp3] = useState<AplicacaoDnp3[]>([]);
  const [aplicacaoDnp3Id, setAplicacaoDnp3Id] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!supabaseConfigurado || !comissionamentoId) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const [{ data: tiposData, error: erroTipos }, { data: comData, error: erroCom }, aplicacoes] = await Promise.all([
        supabase.from('tipos_equipamento').select('*').order('descricao'),
        supabase.from('comissionamentos').select('subestacao_id').eq('id', comissionamentoId).single(),
        listarAplicacoesDnp3(),
      ]);
      if (erroTipos) throw erroTipos;
      if (erroCom) throw erroCom;
      setTipos((tiposData ?? []) as TipoEquipamento[]);
      setSubestacaoId(comData?.subestacao_id ?? null);
      setAplicacoesDnp3(aplicacoes);

      if (equipamentoId) {
        const { data: eq, error: erroEq } = await supabase
          .from('equipamentos')
          .select('*')
          .eq('id', equipamentoId)
          .single();
        if (erroEq) throw erroEq;
        setForm({
          codigoOperacional: eq.codigo_operacional ?? '',
          fabricante: eq.fabricante ?? '',
          modelo: eq.modelo ?? '',
          tensao: eq.tensao ?? '',
          partNumber: eq.part_number ?? '',
          numeroSerie: eq.numero_serie ?? '',
          anoFabricacao: eq.ano_fabricacao != null ? String(eq.ano_fabricacao) : '',
        });
        setTipoSelecionadoId(eq.tipo_equipamento_id);
        setAplicacaoDnp3Id(eq.aplicacao_dnp3_id ?? null);
      } else {
        setForm(FORM_VAZIO);
        setTipoSelecionadoId(null);
        setAplicacaoDnp3Id(null);
      }
    } catch (err) {
      alertar('Erro ao carregar', err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  }, [comissionamentoId, equipamentoId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  function atualizar<K extends keyof FormEquipamento>(campo: K, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  const tipoSelecionado = tipos.find((t) => t.id === tipoSelecionadoId);
  const ehRele = tipoSelecionado?.codigo === 'RELE';

  // Com 27 aplicações cadastradas, filtra pelo que o técnico já digitou em
  // "Modelo" pra não precisar rolar uma lista enorme — digita "751" e já
  // aparecem só as variantes do SEL-751.
  const aplicacoesFiltradas = useMemo(() => {
    const termo = form.modelo.trim().toLowerCase();
    if (!termo) return [];
    return aplicacoesDnp3.filter(
      (a) => a.modelo_rele.toLowerCase().includes(termo) || a.nome_aba_origem.toLowerCase().includes(termo)
    );
  }, [aplicacoesDnp3, form.modelo]);

  async function salvar() {
    if (!supabaseConfigurado) {
      alertar(
        'Supabase ainda não configurado',
        'Preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env antes de salvar.'
      );
      return;
    }
    if (!comissionamentoId || !subestacaoId) {
      alertar('Abra um comissionamento primeiro', 'O equipamento precisa estar vinculado a uma subestação.');
      return;
    }
    if (!tipoSelecionadoId) {
      alertar('Selecione o tipo de equipamento');
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        subestacao_id: subestacaoId,
        tipo_equipamento_id: tipoSelecionadoId,
        codigo_operacional: form.codigoOperacional || null,
        fabricante: form.fabricante || null,
        modelo: form.modelo || null,
        tensao: form.tensao || null,
        part_number: form.partNumber || null,
        numero_serie: form.numeroSerie || null,
        ano_fabricacao: form.anoFabricacao ? Number(form.anoFabricacao) : null,
        aplicacao_dnp3_id: ehRele ? aplicacaoDnp3Id : null,
      };

      if (emEdicao && equipamentoId) {
        const { error } = await supabase.from('equipamentos').update(payload).eq('id', equipamentoId);
        if (error) throw error;
        alertar('Salvo', 'Equipamento atualizado.');
      } else {
        const { error } = await supabase.from('equipamentos').insert(payload);
        if (error) throw error;
        alertar('Salvo', 'Equipamento cadastrado.');
        setForm(FORM_VAZIO);
        setTipoSelecionadoId(null);
        setAplicacaoDnp3Id(null);
      }
      navigation.goBack();
    } catch (err) {
      // TODO: ao integrar a fila offline, cair aqui só quando o erro
      // não for de conectividade — erro de rede deve ir para a fila.
      alertar('Erro ao salvar', err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!comissionamentoId) {
    return (
      <View style={styles.container}>
        <Text style={styles.aviso}>
          Abra um comissionamento (tela "Comissionamentos") antes de cadastrar um equipamento — o
          cadastro fica vinculado à subestação daquele comissionamento.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>{emEdicao ? 'Editar equipamento' : 'Cadastro de Automação'}</Text>

      <Text style={styles.label}>Tipo de equipamento</Text>
      <View style={styles.chips}>
        {tipos.map((tipo) => (
          <Pressable
            key={tipo.id}
            style={[styles.chip, tipoSelecionadoId === tipo.id && styles.chipSelecionado]}
            onPress={() => setTipoSelecionadoId(tipo.id)}
          >
            <Text style={[styles.chipTexto, tipoSelecionadoId === tipo.id && styles.chipTextoSelecionado]}>
              {tipo.descricao}
            </Text>
          </Pressable>
        ))}
      </View>

      <Campo label="Código Operacional (ex.: 751, DJ L52-1)" valor={form.codigoOperacional} onChange={(v) => atualizar('codigoOperacional', v)} />
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

      {ehRele && (
        <View style={styles.blocoDnp3}>
          <Text style={styles.label}>
            Aplicação DNP3 (mapa de pontos para a Conferência DNP3)
          </Text>
          {aplicacaoDnp3Id && !form.modelo.trim() && (
            <Text style={styles.aplicacaoSelecionadaTexto}>
              Selecionada: {aplicacoesDnp3.find((a) => a.id === aplicacaoDnp3Id)?.nome_aba_origem ?? aplicacaoDnp3Id}
            </Text>
          )}
          {!form.modelo.trim() && <Text style={styles.ajudaTexto}>Digite o Modelo acima para filtrar as aplicações.</Text>}
          {form.modelo.trim() !== '' && aplicacoesFiltradas.length === 0 && (
            <Text style={styles.ajudaTexto}>Nenhuma aplicação da planilha corresponde a "{form.modelo}".</Text>
          )}
          <View style={styles.chips}>
            {aplicacoesFiltradas.map((a) => (
              <Pressable
                key={a.id}
                style={[styles.chip, aplicacaoDnp3Id === a.id && styles.chipSelecionado]}
                onPress={() => setAplicacaoDnp3Id(aplicacaoDnp3Id === a.id ? null : a.id)}
              >
                <Text style={[styles.chipTexto, aplicacaoDnp3Id === a.id && styles.chipTextoSelecionado]}>
                  {a.nome_aba_origem}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable style={styles.botao} onPress={salvar} disabled={salvando}>
        <Text style={styles.botaoTexto}>{salvando ? 'Salvando...' : emEdicao ? 'Salvar alterações' : 'Salvar equipamento'}</Text>
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, gap: 4 },
  titulo: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  aviso: { fontSize: 14, color: '#555', lineHeight: 20 },
  campo: { marginBottom: 12 },
  label: { fontSize: 13, color: '#444', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipSelecionado: { backgroundColor: '#0B5FFF', borderColor: '#0B5FFF' },
  chipTexto: { fontSize: 13, color: '#333' },
  chipTextoSelecionado: { color: '#fff', fontWeight: '600' },
  blocoDnp3: { marginTop: 8, marginBottom: 8, backgroundColor: '#F7F8FA', borderRadius: 10, padding: 12 },
  aplicacaoSelecionadaTexto: { fontSize: 13, color: '#0B5FFF', fontWeight: '600', marginBottom: 8 },
  ajudaTexto: { fontSize: 12, color: '#888', marginBottom: 8 },
  botao: { backgroundColor: '#0B5FFF', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  botaoTexto: { color: '#fff', fontWeight: '600' },
});
