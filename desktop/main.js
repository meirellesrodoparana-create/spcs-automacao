const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = log;
log.transports.file.level = 'info';
autoUpdater.autoDownload = false; // só baixa quando o usuário clicar em "Instalar agora"

let janelaPrincipal = null;

function enviarStatus(mensagem) {
  log.info('[update]', mensagem);
  if (janelaPrincipal) janelaPrincipal.webContents.send('status-atualizacao', mensagem);
}

function criarJanela() {
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

  janelaPrincipal.loadFile(path.join(__dirname, 'web', 'index.html'));
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
