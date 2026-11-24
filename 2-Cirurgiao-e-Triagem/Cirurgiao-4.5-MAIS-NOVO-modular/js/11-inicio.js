'use strict';
/* ════════════════════════════════════════════════════════════════════
   Cirurgião de Código 4.0 — um arquivo só, funciona offline.
   Regra da casa: NADA é cortado. Listas mostram tudo (em páginas),
   relatórios saem completos, a IA recebe exatamente o que você escolher.
   ════════════════════════════════════════════════════════════════════ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtB = (n) => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1).replace('.', ',') + ' KB' : (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
const fmtN = (n) => Number(n || 0).toLocaleString('pt-BR');
const usd = (v) => 'US$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const agora = () => new Date().toLocaleString('pt-BR');
const pausa = () => new Promise((r) => setTimeout(r, 0));
const tokensDe = (chars) => Math.ceil(chars / 3.5);

/* ── Banco do navegador (IndexedDB) ─────────────────────────────────── */
const DB = {
  _p: null,
  abrir() {
    if (!this._p) this._p = new Promise((ok, erro) => {
      const r = indexedDB.open('cirurgiao4', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    });
    return this._p;
  },
  async get(k, padrao) {
    try {
      const db = await this.abrir();
      return await new Promise((ok, erro) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => ok(q.result === undefined ? padrao : q.result); q.onerror = () => erro(q.error); });
    } catch { return padrao; }
  },
  async set(k, v) {
    const db = await this.abrir();
    return new Promise((ok, erro) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => ok(); t.onerror = () => erro(t.error); t.onabort = () => erro(t.error); });
  },
  async del(k) {
    const db = await this.abrir();
    return new Promise((ok) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = () => ok(); t.onerror = () => ok(); });
  },
  async limpar() {
    const db = await this.abrir();
    return new Promise((ok) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').clear(); t.oncomplete = () => ok(); });
  },
};

/* ── Estado ─────────────────────────────────────────────────────────── */
const CFG_PADRAO = { limiteKB: 0, ignorarPastas: true, pastas: 'node_modules, .git, .cache, .local, .upm, .pythonlibs, dist, build, .next, .expo, .gradle', estilo: false, sessao: true, quebra: true, gastoLimite: 0, gastoAviso: 0.05, ia: {} };
let CFG = structuredClone(CFG_PADRAO);
let P = { nome: '', arquivos: [] };   // projeto aberto
let atual = -1;                        // índice do arquivo aberto
let filtroArq = 'todos';
let R = null;                          // último resultado de detecção
let marcas = new Map();                // índice do arquivo → Map(linha → [{tipo, sev}])
let notas = [], historico = [], gasto = [];
let selLinha = 0;
let conv = [];                         // conversa com a IA
let abortador = null;
let ultimoCortado = false;

/* ── Utilidades de arquivo / ZIP (sem biblioteca) ───────────────────── */
const BIN = /^(png|jpe?g|gif|webp|ico|bmp|tiff?|pdf|zip|apk|aab|jar|dex|arsc|keystore|jks|p12|pfx|mp3|mp4|m4a|wav|ogg|webm|woff2?|ttf|otf|eot|exe|dll|so|a|o|class|bin|7z|rar|gz|tgz|bz2|xz|mov|avi|psd|xlsx?|docx?|pptx?|sqlite|db|wasm|node|pyc)$/;
const EXT_ZIP = /^(zip|apk|aab|jar)$/;
const extDe = (p) => { const b = p.split('/').pop().toLowerCase(); const i = b.lastIndexOf('.'); return i > 0 ? b.slice(i + 1) : (b.startsWith('.') ? b.slice(1) : ''); };
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
let _toastT;
const analisaveis = () => P.arquivos.map((a, i) => [a, i]).filter(([a]) => !ignoradoPor(a));
const ehTar = (u8) => u8.length > 262 && String.fromCharCode(...u8.subarray(257, 262)) === 'ustar';
$('#abas').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) ir(b.dataset.t); });
$('#filtroArq').addEventListener('input', renderListaArq);
$('#ordemArq').addEventListener('change', renderListaArq);
$('#chipsArq').addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (!c) return; filtroArq = c.dataset.f; $$('#chipsArq .chip').forEach((x) => x.classList.toggle('on', x === c)); renderListaArq(); });
$('#listaArq').addEventListener('click', (e) => {
  const m = e.target.closest('input[data-m]');
  if (m) { P.arquivos[+m.dataset.m].marcado = m.checked; salvarSessao(); return; }
  const d = e.target.closest('.arq'); if (d) abrirArquivo(+d.dataset.i);
});
$('#selArq').addEventListener('change', (e) => { const i = +e.target.value; if (i >= 0) abrirArquivo(i); });
const ORDEM_SEV = { alta: 0, media: 1, info: 2, estilo: 3 };
const pior = (l) => l.slice().sort((x, y) => ORDEM_SEV[x] - ORDEM_SEV[y])[0];
$('#marcas').addEventListener('click', (e) => { const c = e.target.closest('[data-n]'); if (c) irParaLinha(+c.dataset.n); });
$('#vis').addEventListener('click', (e) => { const i = e.target.closest('.ln>i'); if (i) selecionarLinha(+i.textContent); });
$('#sFechar').addEventListener('click', () => { $$('#vis .ln.sel').forEach((x) => x.classList.remove('sel')); selLinha = 0; $('#barraSel').hidden = true; });
$('#sCopiar').addEventListener('click', () => copiar(textoLinha(P.arquivos[atual], selLinha)));
$('#sNota').addEventListener('click', () => novaNota(P.arquivos[atual].caminho, selLinha, ''));
$('#sIA').addEventListener('click', () => { $('#iaCtx').value = 'trecho'; $('#iaDe').value = Math.max(1, selLinha - 40); $('#iaAte').value = selLinha + 40; $('#trechoBox').hidden = false; $('#iaPerg').value = `Explique o que acontece na linha ${selLinha} deste trecho, se tem erro e como corrigir.`; ir('ia'); });
$('#sBloco').addEventListener('click', () => {
  const a = P.arquivos[atual]; const t = txt(a); const ls = inicios(a);
  const b = extrairBloco(t, ls[selLinha - 1]);
  if (!b) return alert('Não encontrei um bloco { … } começando nesta linha.');
  const nl = linhaDe(a, b.fim);
  modalTexto(`📎 Bloco: linhas ${selLinha}–${nl}`, t.substring(ls[selLinha - 1], b.fim + 1), [['🤖 Mandar à IA', (x) => { $('#iaCtx').value = 'trecho'; $('#iaDe').value = selLinha; $('#iaAte').value = nl; $('#trechoBox').hidden = false; fecharModal(); ir('ia'); }]]);
});
$('#bIr').addEventListener('click', () => { const n = +$('#irLinha').value; if (n) irParaLinha(n); });
$('#irLinha').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#bIr').click(); });
$('#bQuebra').addEventListener('click', () => { CFG.quebra = !CFG.quebra; salvarCfg(); $('#vis').classList.toggle('quebra', CFG.quebra); });
$('#bBaixarArq').addEventListener('click', () => { const a = P.arquivos[atual]; if (a) baixar(new Blob([dadosAtuais(a)]), a.caminho.split('/').pop()); });
$('#bCopiarArq').addEventListener('click', () => { const a = P.arquivos[atual]; if (a) copiar(txt(a)); });
$('#bMarcarIA').addEventListener('click', () => { const a = P.arquivos[atual]; if (!a) return; a.marcado = !a.marcado; renderCodigo(); renderListaArq(); salvarSessao(); });
$('#bEditar').addEventListener('click', () => {
  const a = P.arquivos[atual]; if (!a) return;
  $('#editor').value = txt(a); $('#editBox').hidden = false; $('#vis').hidden = true; $('#barraSel').hidden = true;
  $('#edInfo').textContent = fmtN(nLinhas(a)) + ' linhas';
  if (selLinha) irParaLinha(selLinha);
});
$('#bCancelarEd').addEventListener('click', () => { $('#editBox').hidden = true; renderCodigo(); });
$('#bSalvarEd').addEventListener('click', async () => { aplicarTexto(atual, $('#editor').value); $('#editBox').hidden = true; await posEdicao(); toast('💾 Alteração salva. Para levar o arquivo, use ⬇️ Baixar ou ⬇️ .zip.'); });
$('#bDesfazer').addEventListener('click', async () => {
  const a = P.arquivos[atual]; if (!a) return;
  if (a.novo) { if (!confirm('Este arquivo foi trazido da versão B. Tirar ele do projeto A?')) return; P.arquivos.splice(atual, 1); atual = -1; await posEdicao(); renderSelArq(); return; }
  if (a.original == null) return;
  if (!confirm('Voltar este arquivo para como ele veio (desfaz TODAS as edições dele)?')) return;
  a.texto = a.original; a.original = null; a.editado = false; a._ls = null;
  await posEdicao();
});
$('#bOrganizar').addEventListener('click', () => {
  const a = P.arquivos[atual]; if (!a) return;
  const org = organizar(txt(a));
  modalTexto('✨ Código organizado (proposta) — confira antes de usar', org, [['✅ Usar como novo conteúdo', async () => { aplicarTexto(atual, org); fecharModal(); await posEdicao(); }]]);
});
