export type RootStackParamList = {
  Home: undefined;
  Cadastro: { equipamentoId?: string } | undefined;
  Checklist: { comissionamentoId?: string } | undefined;
  Pael: { comissionamentoId?: string } | undefined;
  Liberacao: { comissionamentoId?: string } | undefined;
};
