import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { alertar } from '../lib/alerta';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { listarRelesComMapaDnp3, buscarPontosDaAplicacao, type EquipamentoComAplicacaoDnp3 } from '../lib/dnp3';
import { parseLogDeEventos, compararLogComMapa, type ResultadoComparacao } from '../lib/dnp3Matcher';
import { escaparHtml, imprimirOuCompartilharPdf, montarHtmlDocumento } from '../lib/pdf';

type Props = NativeStackScreenProps<RootStackParamList, 'ConferenciaDnp3'>;

export default function ConferenciaDnp3Screen({ route }: Props) {
  const { comissionamentoId } = route.params;
  const [carregando, setCarregando] = useState(true);
  const [reles, setReles] = useState<EquipamentoComAplicacaoDnp3[]>([]);
  const [releId, setReleId] = useState<string | null>(null);
  const [textoLog, setTextoLog] = useState('');
  const [comparando, setComparando] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);
  const [resultado, setResultado] = useState<ResultadoComparacao | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data: com, error: erroCom } = await supabase
        .from('comissionamentos')
        .select('subestacao_id')
        .eq('id', comissionamentoId)
        .single();
      if (erroCom) throw erroCom;
      const lista = await listarRelesComMapaDnp3(com.subestacao_id);
      setReles(lista);
      if (lista.length === 1) setReleId(lista[0].id);
    } catch (err) {
      alertar('Erro ao carregar relés', err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  }, [comissionamentoId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const releSelecionado = useMemo(() => reles.find((r) => r.id === releId) ?? null, [reles, releId]);

  async function comparar() {
    if (!releSelecionado?.aplicacao_dnp3_id) {
      alertar('Selecione um relé', 'O relé selecionado precisa ter uma aplicação DNP3 vinculada no Cadastro de Automação.');
      return;
    }
    if (!textoLog.trim()) {
      alertar('Cole o log de eventos', 'Copie o relatório de eventos (SOE) do relé e cole no campo acima.');
      return;
    }
    setComparando(true);
    try {
      const pontos = await buscarPontosDaAplicacao(releSelecionado.aplicacao_dnp3_id);
      const eventos = parseLogDeEventos(textoLog);
      setResultado(compararLogComMapa(eventos, pontos));
    } catch (err) {
      alertar('Não foi possível comparar', err instanceof Error ? err.message : String(err));
    } finally {
      setComparando(false);
    }
  }

  async function imprimir() {
    if (!resultado) return;
    setImprimindo(true);
    try {
      const secao = (titulo: string, linhas: string) =>
        `<h2>${escaparHtml(titulo)}</h2><table><thead><tr><th>Tag do log</th><th>Wordbit do mapa</th><th>Descrição</th><th>Ocorrências</th></tr></thead><tbody>${linhas}</tbody></table>`;

      const linhasConfirmados = resultado.confirmados
        .map(
          (i) =>
            `<tr><td>${escaparHtml(i.tagLog)}</td><td>${escaparHtml(i.ponto?.wordbit)}</td><td>${escaparHtml(i.ponto?.descricao)}</td><td>${i.ocorrenciasLog}</td></tr>`
        )
        .join('');
      const linhasProvaveis = resultado.provaveis
        .map(
          (i) =>
            `<tr><td>${escaparHtml(i.tagLog)}</td><td>${escaparHtml(i.ponto?.wordbit)}</td><td>${escaparHtml(i.ponto?.descricao)}</td><td>${i.ocorrenciasLog}</td></tr>`
        )
        .join('');
      const linhasSemMatch = resultado.semMatch
        .map((i) => `<tr><td>${escaparHtml(i.tagLog)}</td><td>—</td><td>—</td><td>${i.ocorrenciasLog}</td></tr>`)
        .join('');
      const linhasEsperados = resultado.esperadosNaoVistos
        .map((p) => `<tr><td>—</td><td>${escaparHtml(p.wordbit)}</td><td>${escaparHtml(p.descricao)}</td><td>0</td></tr>`)
        .join('');

      const corpo = `
        ${secao(`Confirmados (${resultado.confirmados.length})`, linhasConfirmados || '<tr><td colspan="4">Nenhum</td></tr>')}
        ${secao(`Prováveis — confirmar manualmente (${resultado.provaveis.length})`, linhasProvaveis || '<tr><td colspan="4">Nenhum</td></tr>')}
        ${secao(`Sem correspondência no mapa (${resultado.semMatch.length})`, linhasSemMatch || '<tr><td colspan="4">Nenhum</td></tr>')}
        ${secao(`Esperados e não vistos no log (${resultado.esperadosNaoVistos.length})`, linhasEsperados || '<tr><td colspan="4">Nenhum</td></tr>')}
      `;
      const html = montarHtmlDocumento(
        'Conferência DNP3 (Log x Mapa)',
        releSelecionado
          ? `${releSelecionado.mapas_dnp3_aplicacoes?.modelo_rele ?? ''} — ${releSelecionado.mapas_dnp3_aplicacoes?.aplicacao ?? ''}`
          : '',
        corpo
      );
      await imprimirOuCompartilharPdf(html, 'Conferência DNP3');
    } catch (err) {
      alertar('Não foi possível gerar o PDF', err instanceof Error ? err.message : String(err));
    } finally {
      setImprimindo(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Relé</Text>
      {reles.length === 0 ? (
        <Text style={styles.aviso}>
          Nenhum relé desta subestação tem uma aplicação DNP3 vinculada ainda. Edite o relé no Cadastro de Automação e
          selecione a aplicação correspondente.
        </Text>
      ) : (
        <View style={styles.chips}>
          {reles.map((rele) => (
            <Pressable
              key={rele.id}
              style={[styles.chip, releId === rele.id && styles.chipSelecionado]}
              onPress={() => {
                setReleId(rele.id);
                setResultado(null);
              }}
            >
              <Text style={[styles.chipTexto, releId === rele.id && styles.chipTextoSelecionado]}>
                {rele.codigo_operacional ?? rele.modelo ?? 'Relé'} — {rele.mapas_dnp3_aplicacoes?.modelo_rele}{' '}
                {rele.mapas_dnp3_aplicacoes?.aplicacao}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.label}>Log de eventos (SOE)</Text>
      <TextInput
        style={styles.textoLog}
        value={textoLog}
        onChangeText={setTextoLog}
        placeholder="Cole aqui o relatório de eventos (SOE) exportado do relé"
        multiline
        textAlignVertical="top"
      />

      <Pressable style={styles.botaoComparar} onPress={comparar} disabled={comparando}>
        <Text style={styles.botaoCompararTexto}>{comparando ? 'Comparando...' : 'Comparar'}</Text>
      </Pressable>

      {resultado && (
        <View style={styles.resultados}>
          <View style={styles.cabecalhoResultado}>
            <Text style={styles.resumoTexto}>
              {resultado.confirmados.length} confirmado(s) · {resultado.provaveis.length} provável(is) ·{' '}
              {resultado.semMatch.length} sem match · {resultado.esperadosNaoVistos.length} esperado(s) não visto(s)
            </Text>
            <Pressable onPress={imprimir} disabled={imprimindo}>
              <Text style={styles.linkImprimir}>{imprimindo ? 'Gerando...' : '🖨️ Imprimir / PDF'}</Text>
            </Pressable>
          </View>

          <Secao titulo="Confirmados" cor="#1E9E57">
            {resultado.confirmados.map((item) => (
              <LinhaItem key={item.tagLog} texto={`${item.tagLog} → ${item.ponto?.wordbit}`} detalhe={item.ponto?.descricao ?? ''} />
            ))}
          </Secao>

          <Secao titulo="Prováveis (confirmar manualmente)" cor="#C8902A">
            {resultado.provaveis.map((item) => (
              <LinhaItem key={item.tagLog} texto={`${item.tagLog} → ${item.ponto?.wordbit}`} detalhe={item.ponto?.descricao ?? ''} />
            ))}
          </Secao>

          <Secao titulo="Sem correspondência no mapa" cor="#D6334C">
            {resultado.semMatch.map((item) => (
              <LinhaItem key={item.tagLog} texto={item.tagLog} detalhe={`${item.ocorrenciasLog} ocorrência(s) no log`} />
            ))}
          </Secao>

          <Secao titulo="Esperados no mapa e não vistos no log" cor="#8A8F98">
            {resultado.esperadosNaoVistos.map((ponto) => (
              <LinhaItem key={ponto.wordbit} texto={ponto.wordbit} detalhe={ponto.descricao ?? ''} />
            ))}
          </Secao>
        </View>
      )}
    </ScrollView>
  );
}

function Secao({ titulo, cor, children }: { titulo: string; cor: string; children: React.ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text style={[styles.secaoTitulo, { color: cor }]}>{titulo}</Text>
      {children}
    </View>
  );
}

function LinhaItem({ texto, detalhe }: { texto: string; detalhe: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemTexto}>{texto}</Text>
      {detalhe ? <Text style={styles.itemDetalhe}>{detalhe}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 6, color: '#333' },
  aviso: { fontSize: 13, color: '#8A8F98', fontStyle: 'italic' },
  chips: { gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  chipSelecionado: { backgroundColor: '#0B5FFF', borderColor: '#0B5FFF' },
  chipTexto: { fontSize: 13, color: '#333' },
  chipTextoSelecionado: { color: '#fff' },
  textoLog: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    minHeight: 160,
    backgroundColor: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  botaoComparar: { backgroundColor: '#0B5FFF', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  botaoCompararTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultados: { marginTop: 24 },
  cabecalhoResultado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resumoTexto: { fontSize: 12, color: '#555', fontWeight: '600', flex: 1, marginRight: 8 },
  linkImprimir: { color: '#0B5FFF', fontWeight: '600', fontSize: 13 },
  secao: { marginBottom: 18 },
  secaoTitulo: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  item: { backgroundColor: '#F7F8FA', borderRadius: 6, padding: 8, marginBottom: 6 },
  itemTexto: { fontSize: 13, fontWeight: '600', color: '#222' },
  itemDetalhe: { fontSize: 12, color: '#666', marginTop: 2 },
});
