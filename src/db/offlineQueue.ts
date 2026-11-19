// Fila de sincronização offline — rascunho.
//
// Objetivo: toda escrita feita sem sinal (comum em subestação) vai para
// uma tabela local (SQLite, via expo-sqlite) em vez de falhar, e é
// reenviada ao Supabase quando a conexão voltar.
//
// Ainda não implementado. Decisão pendente: SQLite "cru" com uma tabela
// de fila genérica (mutação + payload JSON + status) versus WatermelonDB
// (sincronização embutida, mais pesado para configurar). Como o volume de
// escrita por comissionamento é baixo (formulários, não eventos em massa),
// a fila genérica em SQLite deve bastar — revisar se aparecer necessidade
// de merge/conflito mais sofisticado.

export interface MutacaoPendente {
  id: string;
  tabela: string;
  operacao: 'insert' | 'update';
  payload: Record<string, unknown>;
  criada_em: string;
  tentativas: number;
}

export async function enfileirar(_mutacao: Omit<MutacaoPendente, 'id' | 'criada_em' | 'tentativas'>): Promise<void> {
  throw new Error('Fila offline ainda não implementada — ver src/db/offlineQueue.ts');
}

export async function sincronizarPendentes(): Promise<void> {
  throw new Error('Fila offline ainda não implementada — ver src/db/offlineQueue.ts');
}
