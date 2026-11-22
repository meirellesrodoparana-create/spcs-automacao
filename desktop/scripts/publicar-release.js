// Publica os artefatos gerados pelo `npm run build:win` (o instalador
// .exe + latest.yml) no bucket público "releases" do Supabase Storage.
// É esse bucket que o electron-updater (configurado em package.json
// "build.publish") consulta pra saber se tem versão nova.
//
// Usa uma conta dedicada (não a conta pessoal de ninguém) só pra ter
// uma sessão autenticada — a política de escrita do bucket exige
// auth.role() = 'authenticated', mas o bucket de leitura é público.
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qpalyufeldkqculnixrn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwYWx5dWZlbGRrcWN1bG5peHJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMDU3MTQsImV4cCI6MjExMDY4MTcxNH0.4CcSt4zl-eNTHhv98Pe5HnSfCErlwco20q_5Yecs4sI';
const CI_EMAIL = 'ci-releases@spcs-automacao.internal';
const CI_SENHA = 'Spcs-Automacao-Releases-2026!';

const PASTA_RELEASE = path.join(__dirname, '..', 'release');

async function garantirSessao(supabase) {
  const { error: erroLogin } = await supabase.auth.signInWithPassword({ email: CI_EMAIL, password: CI_SENHA });
  if (!erroLogin) return;
  const { error: erroCadastro } = await supabase.auth.signUp({ email: CI_EMAIL, password: CI_SENHA });
  if (erroCadastro) throw erroCadastro;
  const { error: erroLogin2 } = await supabase.auth.signInWithPassword({ email: CI_EMAIL, password: CI_SENHA });
  if (erroLogin2) throw erroLogin2;
}

async function enviar(supabase, nomeArquivo, contentType) {
  const caminho = path.join(PASTA_RELEASE, nomeArquivo);
  const dados = fs.readFileSync(caminho);
  const { error } = await supabase.storage
    .from('releases')
    .upload(nomeArquivo, dados, { upsert: true, contentType });
  if (error) throw error;
  console.log(`Enviado: ${nomeArquivo} (${(dados.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function main() {
  if (!fs.existsSync(PASTA_RELEASE)) {
    console.error('Pasta "release" não encontrada — rode "npm run build:win" antes.');
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await garantirSessao(supabase);

  const arquivos = fs.readdirSync(PASTA_RELEASE).filter((f) => f.endsWith('.exe') || f.endsWith('.yml'));
  if (arquivos.length === 0) {
    console.error('Nenhum .exe/.yml encontrado em "release" — rode "npm run build:win" antes.');
    process.exit(1);
  }
  for (const arquivo of arquivos) {
    const tipo = arquivo.endsWith('.yml') ? 'text/yaml' : 'application/octet-stream';
    await enviar(supabase, arquivo, tipo);
  }
  console.log('Publicação concluída.');
}

main().catch((err) => {
  console.error('Falhou:', err.message || err);
  process.exit(1);
});
