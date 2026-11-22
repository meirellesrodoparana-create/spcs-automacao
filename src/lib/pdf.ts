import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Utilitário único de impressão/PDF para todas as telas (Checklist, PAEL,
// Liberação, lista de equipamentos). No navegador/Electron, printAsync abre
// o diálogo de impressão do sistema (o técnico escolhe "Salvar como PDF").
// No app nativo (Android/iOS), gera o arquivo e abre a tela de
// compartilhar (Arquivos, e-mail, WhatsApp...), já que não existe
// "diálogo de impressão do sistema" lá.
export async function imprimirOuCompartilharPdf(html: string, tituloCompartilhamento: string) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: tituloCompartilhamento });
  }
}

export function escaparHtml(texto: string | null | undefined): string {
  if (!texto) return '';
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const ESTILO_BASE = `
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 24px; font-size: 12px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 13px; margin: 18px 0 6px; color: #0B5FFF; }
    .subtitulo { color: #555; margin: 0 0 16px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f2f2f2; font-weight: 700; }
    .status-OK { color: #1E9E57; font-weight: 700; }
    .status-NOK { color: #D6334C; font-weight: 700; }
    .status-NA, .status-N\\/A { color: #8A8F98; font-weight: 700; }
    .rodape { margin-top: 28px; font-size: 10px; color: #888; }
  </style>
`;

/** Monta um documento HTML padrão (cabeçalho + corpo já pronto) para imprimir/exportar. */
export function montarHtmlDocumento(titulo: string, subtitulo: string, corpoHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />${ESTILO_BASE}</head><body>
    <h1>${escaparHtml(titulo)}</h1>
    <p class="subtitulo">${escaparHtml(subtitulo)}</p>
    ${corpoHtml}
    <p class="rodape">Gerado pelo SPCS - Automação em ${new Date().toLocaleString('pt-BR')}</p>
  </body></html>`;
}
