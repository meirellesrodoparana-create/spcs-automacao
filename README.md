# SPCS - Automação

App móvel de comissionamento de campo da Prolux. Cobre os 4 documentos de
comissionamento hoje preenchidos manualmente:

1. **Cadastro de Automação** — biblioteca de equipamentos da subestação (o que existe)
2. **Checklist** — conformidade por sistema (OK/NOK/N-A)
3. **PAEL (Painel)** — execução passo a passo por disciplina
4. **Liberação para Energização (LPE)** — aprovação final

Os 4 documentos compartilham um núcleo (subestação, equipamento, relé/medidor),
preenchido uma única vez. Decisões e modelo de dados completos em
`claude/arquitetura-spcs-automacao.md` e `claude/mapeamento-documentos-origem.md`
no projeto do Claude.

Projeto independente do dashboard de gestão (`prolux-field-dashboard`) — banco
Supabase separado.

## Stack

- **Mobile:** Expo (React Native) + TypeScript, navegação com React Navigation
- **Backend:** Supabase (Postgres + Auth + Storage) — projeto novo, não compartilhado
- **Offline:** fila de sincronização local (a implementar — ver `src/db`), essencial
  porque subestações costumam ter conexão ruim
- **OCR de placa (fase 1):** Edge Function de visão para ler a placa de identificação
  do equipamento (fabricante/modelo/nº série/part number), com confirmação manual do técnico

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencher com as chaves do projeto Supabase
npm start
```

## Banco de dados

Migrations em `supabase/migrations/`. Para aplicar em um projeto Supabase novo:

```bash
supabase link --project-ref <ref-do-projeto>
supabase db push
```

## Estrutura

```
App.tsx                  navegação raiz (Home + 4 telas)
src/screens/              uma tela por documento
src/navigation/types.ts   tipos de rotas
src/lib/supabase.ts        cliente Supabase
src/types/database.ts      tipos espelhando o schema SQL
src/db/                    fila offline (em construção)
supabase/migrations/       schema SQL
```

## Pontos em aberto

- Aba "TESTES SINALIZAÇÃO" do retificador (20 pontos ponto a ponto) — não modelada.
- Papéis de usuário além de técnico/coordenador/admin.
- Fluxo de assinatura na Liberação: assinatura digital no app ou só
  nome/matrícula/data?

Os itens de checklist e as etapas de PAEL já foram detalhados linha a linha
a partir dos documentos reais — ver `supabase/migrations/0003_checklist_pael_reais.sql`
e a seção "Atualização (19/11/2026)" em `claude/mapeamento-documentos-origem.md`
no projeto do Claude.
