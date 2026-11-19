export type RootStackParamList = {
  Home: undefined;
  Cadastro: { equipamentoId?: string } | undefined;
  Comissionamento: undefined;
  ComissionamentoDetalhe: { comissionamentoId: string };
  Checklist: { comissionamentoId: string };
  Pael: { comissionamentoId: string };
  Liberacao: { comissionamentoId: string };
};
