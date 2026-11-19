-- Corrige políticas de RLS que só permitiam leitura (select) em tabelas
-- que o app precisa gravar:
--
-- 1. perfis: só tinha "usuario ve o proprio perfil" (select). O cadastro
--    de usuário (LoginScreen) faz upsert do próprio perfil logo após o
--    signUp e falhava com 403 (42501) em todo cadastro novo.
-- 2. distribuidoras / subestacoes: só tinham "autenticados podem ler
--    tudo" (select). O find-or-create de buscarOuCriarDistribuidora /
--    buscarOuCriarSubestacao (src/lib/comissionamento.ts) cria a linha
--    quando ela não existe e falhava com 403 ao tentar abrir qualquer
--    comissionamento novo.

create policy "usuario cria/atualiza o proprio perfil" on perfis
  for insert with check (auth.uid() = id);
create policy "usuario atualiza o proprio perfil" on perfis
  for update using (auth.uid() = id);

create policy "autenticados podem criar distribuidoras" on distribuidoras
  for insert with check (auth.role() = 'authenticated');
create policy "autenticados podem criar subestacoes" on subestacoes
  for insert with check (auth.role() = 'authenticated');
