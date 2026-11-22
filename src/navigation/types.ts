export type RootStackParamList = {
  Home: undefined;
  Cadastro: { comissionamentoId: string; equipamentoId?: string };
  Comissionamento: undefined;
  ComissionamentoDetalhe: { comissionamentoId: string };
  Checklist: { comissionamentoId: string };
  Pael: { comissionamentoId: string };
  Liberacao: { comissionamentoId: string };
  ConferenciaDnp3: { comissionamentoId: string };
  PainelGestao: undefined;
};
