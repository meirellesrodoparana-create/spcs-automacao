const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('spcsDesktop', {
  verificarAtualizacao: () => ipcRenderer.invoke('verificar-atualizacao'),
  instalarAtualizacao: () => ipcRenderer.invoke('instalar-atualizacao'),
  onStatus: (callback) => ipcRenderer.on('status-atualizacao', (_evento, msg) => callback(msg)),
  onAtualizacaoDisponivel: (callback) =>
    ipcRenderer.on('atualizacao-disponivel', (_evento, versao) => callback(versao)),
});

// Injeta um botão flutuante de atualização sobre o app web (que não sabe
// que está rodando dentro do Electron) — sem precisar tocar no código
// React Native/Expo compartilhado com mobile/web.
window.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;bottom:12px;right:12px;z-index:999999;display:flex;align-items:center;gap:8px;' +
    'font-family:system-ui,sans-serif;';

  const status = document.createElement('span');
  status.style.cssText = 'font-size:12px;color:#555;background:#fff;padding:4px 8px;border-radius:6px;' +
    'box-shadow:0 1px 4px rgba(0,0,0,0.15);display:none;';

  const botao = document.createElement('button');
  botao.textContent = '🔄 Verificar atualização';
  botao.style.cssText =
    'background:#0B5FFF;color:#fff;border:none;border-radius:20px;padding:8px 14px;font-size:13px;' +
    'font-weight:600;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.2);';

  let temAtualizacaoPendente = false;

  botao.addEventListener('click', () => {
    if (temAtualizacaoPendente) {
      window.spcsDesktop.instalarAtualizacao();
    } else {
      window.spcsDesktop.verificarAtualizacao();
    }
  });

  window.spcsDesktop.onStatus((mensagem) => {
    status.textContent = mensagem;
    status.style.display = 'inline-block';
  });

  window.spcsDesktop.onAtualizacaoDisponivel((versao) => {
    temAtualizacaoPendente = true;
    botao.textContent = `⬇️ Instalar versão ${versao}`;
  });

  container.appendChild(status);
  container.appendChild(botao);
  document.body.appendChild(container);
});
