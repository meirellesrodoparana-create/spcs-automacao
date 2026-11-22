// SPCS - Automação
// Motor de comparação: Log de Eventos (SOE) do relé x Mapa de Pontos DNP3
// cadastrado para aquele modelo/aplicação (tabelas mapas_dnp3_aplicacoes /
// mapas_dnp3_pontos, geradas a partir de "Padrões AT - Mapas DNP3.xlsx").
//
// Uso típico: ao abrir um comissionamento, o Cadastro de Automação já
// define modelo_rele + aplicacao do IED. Quando o técnico cola/importa o
// log de ensaios (SOE) daquele relé, chama-se:
//
//   const pontosDoMapa = await buscarPontosDaAplicacao(supabase, aplicacaoId);
//   const resultado = compararLogComMapa(parseLogDeEventos(textoDoLog), pontosDoMapa);
//
// e o "resultado" alimenta a tela de conferência (confirmados / prováveis /
// sem correspondência / esperados e nunca vistos).

export interface PontoMapa {
  tipo: string | null;
  posicao: number | null;
  wordbit: string;
  descricao: string | null;
  valor_0: string | null;
  valor_1: string | null;
  comissionado: boolean | null;
}

export interface EventoLog {
  tag: string;
  estados: Set<string>; // todos os valores distintos observados para essa tag no log
  ocorrencias: number;
}

const LINHA_LOG =
  /^\s*\d+\s+\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\.\d{3}\s+(.+?)\s{2,}(\S.*?)\s*$/;

/** Lê o texto bruto do relatório SOE (SEL ou similar) e extrai as tags vistas. */
export function parseLogDeEventos(textoLog: string): Map<string, EventoLog> {
  const porTag = new Map<string, EventoLog>();
  for (const linha of textoLog.split(/\r?\n/)) {
    const m = LINHA_LOG.exec(linha);
    if (!m) continue;
    const tag = m[1].trim();
    const estado = m[2].trim();
    if (tag === 'Relay Settings Changed') continue; // linha de evento do próprio relé, não é ponto
    const atual = porTag.get(tag) ?? { tag, estados: new Set<string>(), ocorrencias: 0 };
    atual.estados.add(estado);
    atual.ocorrencias += 1;
    porTag.set(tag, atual);
  }
  return porTag;
}

const PARES_GENERICOS = new Set(['ASSERTED|DEASSERTED']);

function normPar(estados: Set<string>): string {
  return [...estados]
    .map((e) => e.toUpperCase())
    .filter((e) => e !== 'AUTO-REMOVED' && e !== 'AUTO-REINSTATED')
    .sort()
    .join('|');
}

export type StatusPonto = 'confirmado' | 'provavel' | 'sem_match';

export interface ItemComparacao {
  status: StatusPonto;
  tagLog: string;
  ocorrenciasLog: number;
  ponto?: PontoMapa; // presente quando status = confirmado | provavel
  candidatosAmbiguos?: PontoMapa[]; // quando sem_match e houve mais de 1 candidato por valor
}

export interface ResultadoComparacao {
  confirmados: ItemComparacao[];
  provaveis: ItemComparacao[]; // casados só pelo par de valores (ex.: MOLA -> SV04T) — exigem confirmação manual
  semMatch: ItemComparacao[]; // tag do log não encontrada no mapa dessa aplicação
  esperadosNaoVistos: PontoMapa[]; // comissionado=true no mapa, mas nunca apareceu no log
}

/**
 * Escolhe, entre vários mapas candidatos (aplicações do mesmo modelo de
 * relé), aquele com mais Wordbits batendo exatamente com as tags do log —
 * útil quando o Cadastro de Automação ainda não tem a aplicação exata
 * decidida, ou para alertar que nenhuma aplicação cadastrada é boa o
 * bastante (score baixo mesmo na melhor opção).
 */
export function escolherMelhorAplicacao(
  tagsDoLog: Map<string, EventoLog>,
  mapasCandidatos: Array<{ aplicacaoId: string; pontos: PontoMapa[] }>
): { aplicacaoId: string; pontos: PontoMapa[]; matchesExatos: number } | null {
  let melhor: { aplicacaoId: string; pontos: PontoMapa[]; matchesExatos: number } | null = null;
  for (const candidato of mapasCandidatos) {
    const wordbits = new Set(candidato.pontos.map((p) => p.wordbit.trim().toUpperCase()));
    let matches = 0;
    for (const tag of tagsDoLog.keys()) {
      if (wordbits.has(tag.toUpperCase())) matches += 1;
    }
    if (!melhor || matches > melhor.matchesExatos) {
      melhor = { aplicacaoId: candidato.aplicacaoId, pontos: candidato.pontos, matchesExatos: matches };
    }
  }
  return melhor;
}

/** Compara as tags vistas no log contra o mapa de pontos de UMA aplicação já escolhida. */
export function compararLogComMapa(
  tagsDoLog: Map<string, EventoLog>,
  pontosMapa: PontoMapa[]
): ResultadoComparacao {
  const porWordbit = new Map(pontosMapa.map((p) => [p.wordbit.trim().toUpperCase(), p]));
  const confirmados: ItemComparacao[] = [];
  const provaveis: ItemComparacao[] = [];
  const semMatch: ItemComparacao[] = [];

  for (const evento of tagsDoLog.values()) {
    const direto = porWordbit.get(evento.tag.toUpperCase());
    if (direto) {
      confirmados.push({ status: 'confirmado', tagLog: evento.tag, ocorrenciasLog: evento.ocorrencias, ponto: direto });
      continue;
    }

    const par = normPar(evento.estados);
    let candidatos: PontoMapa[] = [];
    if (par && !PARES_GENERICOS.has(par)) {
      candidatos = pontosMapa.filter((p) => {
        const v0 = (p.valor_0 ?? '').toUpperCase();
        const v1 = (p.valor_1 ?? '').toUpperCase();
        const parPonto = [v0, v1].sort().join('|');
        return parPonto === par;
      });
    }

    if (candidatos.length === 1) {
      provaveis.push({ status: 'provavel', tagLog: evento.tag, ocorrenciasLog: evento.ocorrencias, ponto: candidatos[0] });
    } else {
      semMatch.push({
        status: 'sem_match',
        tagLog: evento.tag,
        ocorrenciasLog: evento.ocorrencias,
        candidatosAmbiguos: candidatos.length > 1 ? candidatos : undefined,
      });
    }
  }

  const vistos = new Set([...tagsDoLog.keys()].map((t) => t.toUpperCase()));
  const esperadosNaoVistos = pontosMapa.filter(
    (p) => p.comissionado === true && !vistos.has(p.wordbit.trim().toUpperCase())
  );

  confirmados.sort((a, b) => a.tagLog.localeCompare(b.tagLog));
  provaveis.sort((a, b) => a.tagLog.localeCompare(b.tagLog));
  semMatch.sort((a, b) => a.tagLog.localeCompare(b.tagLog));

  return { confirmados, provaveis, semMatch, esperadosNaoVistos };
}
