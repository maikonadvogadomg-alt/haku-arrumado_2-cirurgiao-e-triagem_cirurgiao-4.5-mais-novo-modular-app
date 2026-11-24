'use strict';
function decode(u8) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^﻿/, ''); }
  catch { return new TextDecoder('windows-1252').decode(u8); }
}
function pareceBinario(u8) { const n = Math.min(u8.length, 8000); for (let i = 0; i < n; i++) if (u8[i] === 0) return true; return false; }
async function inflate(u8) {
  if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador não abre .zip compactado. Atualize o navegador (Chrome 80+).');
  const ds = new DecompressionStream('deflate-raw');
  return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer());
}
async function lerZip(u8, aoProgresso) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('.zip inválido ou corrompido');
  let n = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true);
  if (off === 0xffffffff || n === 0xffff) { const loc = eocd - 20; if (loc >= 0 && dv.getUint32(loc, true) === 0x07064b50) { const z = Number(dv.getBigUint64(loc + 8, true)); n = Number(dv.getBigUint64(z + 32, true)); off = Number(dv.getBigUint64(z + 48, true)); } }
  const out = [], utf = new TextDecoder('utf-8'), lat = new TextDecoder('windows-1252');
  let p = off;
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const flags = dv.getUint16(p + 8, true), metodo = dv.getUint16(p + 10, true);
    let csize = dv.getUint32(p + 20, true);
    const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
    let lo = dv.getUint32(p + 42, true);
    const nomeB = u8.subarray(p + 46, p + 46 + nl);
    const nome = (flags & 0x800) ? utf.decode(nomeB) : (() => { try { return new TextDecoder('utf-8', { fatal: true }).decode(nomeB); } catch { return lat.decode(nomeB); } })();
    if (csize === 0xffffffff || lo === 0xffffffff) { let e = p + 46 + nl; const fim = e + el; while (e < fim) { const id = dv.getUint16(e, true), sz = dv.getUint16(e + 2, true); if (id === 1) { let q = e + 4; if (dv.getUint32(p + 24, true) === 0xffffffff) q += 8; if (csize === 0xffffffff) { csize = Number(dv.getBigUint64(q, true)); q += 8; } if (lo === 0xffffffff) lo = Number(dv.getBigUint64(q, true)); } e += 4 + sz; } }
    p += 46 + nl + el + cl;
    if (nome.endsWith('/')) continue;
    const ini = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
    const raw = u8.subarray(ini, ini + csize);
    try {
      if (metodo === 0) out.push({ nome, dados: raw.slice() });
      else if (metodo === 8) out.push({ nome, dados: await inflate(raw) });
      else out.push({ nome, erro: 'compactação não suportada (' + metodo + ')' });
    } catch (e) { out.push({ nome, erro: e.message }); }
    if (aoProgresso && k % 40 === 0) { aoProgresso(k / n); await pausa(); }
  }
  return out;
}
function escreverZip(files) {
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  for (const f of files) {
    const nome = enc.encode(f.nome), dados = f.dados, crc = crc32(dados);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true);
    h.setUint32(14, crc, true); h.setUint32(18, dados.length, true); h.setUint32(22, dados.length, true); h.setUint16(26, nome.length, true);
    partes.push(new Uint8Array(h.buffer), nome, dados);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x800, true);
    c.setUint32(16, crc, true); c.setUint32(20, dados.length, true); c.setUint32(24, dados.length, true); c.setUint16(28, nome.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), nome);
    off += 30 + nome.length + dados.length;
  }
  const csize = central.reduce((a, b) => a + b.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  return new Blob(partes.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
}
function baixar(conteudo, nome, tipo = 'text/plain;charset=utf-8') {
  const blob = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function copiar(t) {
  try { await navigator.clipboard.writeText(t); toast('✅ Copiado (' + fmtN(t.length) + ' caracteres)'); }
  catch { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('✅ Copiado'); }
}
function status(t) { $('#status').innerHTML = t || ''; }
function toast(t) { status(t); clearTimeout(_toastT); _toastT = setTimeout(() => status(''), 4000); }

/* ── Texto e linhas de cada arquivo ─────────────────────────────────── */
function txt(a) { if (a.texto == null && !a.bin) a.texto = decode(a.dados); return a.texto ?? ''; }
function inicios(a) {
  if (!a._ls) { const t = txt(a), ls = [0]; for (let i = t.indexOf('\n'); i !== -1; i = t.indexOf('\n', i + 1)) ls.push(i + 1); a._ls = ls; }
  return a._ls;
}
function linhaDe(a, pos) { const ls = inicios(a); let lo = 0, hi = ls.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (ls[m] <= pos) lo = m; else hi = m - 1; } return lo + 1; }
function textoLinha(a, n) { const ls = inicios(a), t = txt(a); const s = ls[n - 1] ?? 0, e = n < ls.length ? ls[n] - 1 : t.length; return t.substring(s, e).replace(/\r$/, ''); }
function nLinhas(a) { return a.bin ? 0 : inicios(a).length; }
function ignoradoPor(a) {
  if (a.bin) return 'binário';
  if (a.forcar) return '';
  if (CFG.ignorarPastas) {
    const ps = CFG.pastas.split(',').map((s) => s.trim()).filter(Boolean);
    const seg = a.caminho.split('/');
    if (seg.slice(0, -1).some((s) => ps.includes(s))) return 'pasta';
  }
  if (CFG.limiteKB > 0 && a.tam > CFG.limiteKB * 1024) return 'tamanho';
  return '';
}
function escopo() {
  const e = $('input[name=escopo]:checked').value;
  if (e === 'atual') { if (atual < 0 || P.arquivos[atual].bin) { alert('Abra um arquivo de texto primeiro (aba 📄 Código).'); return null; } return [[P.arquivos[atual], atual]]; }
  if (!P.arquivos.length) { alert('Abra um projeto primeiro.'); return null; }
  return analisaveis();
}

/* ── Carregar arquivos ──────────────────────────────────────────────── */
function novoArquivo(caminho, dados) {
  const ext = extDe(caminho);
  const bin = BIN.test(ext) || pareceBinario(dados);
  return { caminho, ext, tam: dados.length, dados, bin, texto: null, original: null, editado: false, forcar: false, marcado: false, rep: 0, bug: 0 };
}
async function gunzip(u8) {
  if (typeof DecompressionStream === 'undefined') throw new Error('navegador sem suporte a .gz');
  return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
}
function lerTar(u8) {
  const out = [], dec = new TextDecoder();
  const campo = (o, n) => dec.decode(u8.subarray(o, o + n)).replace(/\0[\s\S]*$/, '');
  let p = 0, nomeLongo = null, paxNome = null;
  while (p + 512 <= u8.length) {
    if (u8.subarray(p, p + 512).every((b) => b === 0)) break;
    let nome = campo(p, 100);
    const tam = parseInt(campo(p + 124, 12).trim() || '0', 8) || 0;
    const tipo = String.fromCharCode(u8[p + 156] || 48);
    const prefixo = campo(p + 345, 155);
    if (prefixo) nome = prefixo + '/' + nome;
    const ini = p + 512, dados = u8.subarray(ini, ini + tam);
    if (tipo === 'L') nomeLongo = dec.decode(dados).replace(/\0[\s\S]*$/, '');
    else if (tipo === 'x') { const m = /\d+ path=([^\n]*)\n/.exec(dec.decode(dados)); paxNome = m ? m[1] : null; }
    else if (tipo === '0' || tipo === '\0' || tipo === '7') {
      const n = (paxNome || nomeLongo || nome).replace(/^\.\//, '');
      if (n && !n.endsWith('/')) out.push({ nome: n, dados: dados.slice() });
      nomeLongo = null; paxNome = null;
    } else { nomeLongo = null; paxNome = null; }
    p = ini + Math.ceil(tam / 512) * 512;
  }
  return out;
}
