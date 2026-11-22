const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

const TIPOS_MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.wasm': 'application/wasm',
};

// O build web do Expo usa caminhos absolutos (ex: "/_expo/static/..."),
// que não funcionam abrindo o arquivo direto do disco (file://). Por
// isso servimos a pasta "web" num servidor HTTP local (só acessível
// nesta máquina) e carregamos a página a partir dele.
function iniciarServidorLocal(pastaWeb) {
  return new Promise((resolve, reject) => {
    const servidor = http.createServer((req, res) => {
      const urlLimpa = decodeURIComponent((req.url || '/').split('?')[0]);
      let caminhoArquivo = path.join(pastaWeb, urlLimpa);

      if (!caminhoArquivo.startsWith(pastaWeb)) {
        res.writeHead(403);
        return res.end();
      }

      fs.stat(caminhoArquivo, (erro, info) => {
        if (!erro && info.isDirectory()) {
          caminhoArquivo = path.join(caminhoArquivo, 'index.html');
        }
        fs.readFile(caminhoArquivo, (erroLeitura, conteudo) => {
          if (erroLeitura) {
            // Rota desconhecida (navegação client-side) → devolve o
            // index.html, igual um servidor de SPA faria.
            return fs.readFile(path.join(pastaWeb, 'index.html'), (erro2, indexConteudo) => {
              if (erro2) {
                res.writeHead(404);
                return res.end();
              }
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(indexConteudo);
            });
          }
          const ext = path.extname(caminhoArquivo).toLowerCase();
          res.writeHead(200, { 'Content-Type': TIPOS_MIME[ext] || 'application/octet-stream' });
          res.end(conteudo);
        });
      });
    });

    servidor.listen(0, '127.0.0.1', () => {
      resolve(servidor.address().port);
    });
    servidor.on('error', reject);
  });
}

autoUpdater.logger = log;
log.transports.file.level = 'info';
autoUpdater.autoDownload = false; // só baixa quando o usuário clicar em "Instalar agora"

let janelaPrincipal = null;

function enviarStatus(mensagem) {
  log.info('[update]', mensagem);
  if (janelaPrincipal) janelaPrincipal.webContents.send('status-atualizacao', mensagem);
}

async function criarJanela() {
  janelaPrincipal = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'SPCS - Automação',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const porta = await iniciarServidorLocal(path.join(__dirname, 'web'));
  janelaPrincipal.loadURL(`http://127.0.0.1:${porta}/`);
  janelaPrincipal.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  criarJanela();
  // Checagem silenciosa na abertura, sem baixar nada automaticamente —
  // só avisa que tem versão nova, o botão "Verificar atualização" é
  // quem decide se baixa e instala.
  autoUpdater.checkForUpdates().catch((err) => enviarStatus(`Erro ao verificar: ${err.message}`));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('verificar-atualizacao', async () => {
  enviarStatus('Verificando...');
  try {
    const resultado = await autoUpdater.checkForUpdates();
    if (!resultado?.updateInfo || resultado.updateInfo.version === app.getVersion()) {
      enviarStatus('Você já está na versão mais recente.');
    }
  } catch (err) {
    enviarStatus(`Erro ao verificar atualização: ${err.message}`);
  }
});

ipcMain.handle('instalar-atualizacao', async () => {
  enviarStatus('Baixando atualização...');
  try {
    await autoUpdater.downloadUpdate();
  } catch (err) {
    enviarStatus(`Erro ao baixar atualização: ${err.message}`);
  }
});

autoUpdater.on('update-available', (info) => {
  enviarStatus(`Nova versão disponível: ${info.version}`);
  if (janelaPrincipal) janelaPrincipal.webContents.send('atualizacao-disponivel', info.version);
});
autoUpdater.on('update-not-available', () => enviarStatus('Você já está na versão mais recente.'));
autoUpdater.on('download-progress', (p) => enviarStatus(`Baixando... ${Math.round(p.percent)}%`));
autoUpdater.on('update-downloaded', () => {
  enviarStatus('Atualização baixada. Reiniciando para instalar...');
  setTimeout(() => autoUpdater.quitAndInstall(), 1500);
});
autoUpdater.on('error', (err) => enviarStatus(`Erro de atualização: ${err.message}`));
