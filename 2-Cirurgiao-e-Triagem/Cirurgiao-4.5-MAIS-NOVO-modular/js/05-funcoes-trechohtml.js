'use strict';
function trechoHTML(it) {
  const a = P.arquivos[it.a];
  if (a.bin || !it.len && it.n === 1 && it.col === 0 && !txt(a)) return '';
  let l = textoLinha(a, it.n);
  let col = it.col, len = it.len, pre = '';
  if (it.oculto) { const ac = l.substr(col, len); l = l.substring(0, col) + ac.slice(0, 6) + '•'.repeat(Math.max(4, Math.min(20, ac.length - 6))) + l.substring(col + len); len = Math.min(len, 6 + Math.max(4, Math.min(20, len - 6))); }
  if (l.length > 600) {
    const ini = Math.max(0, col - 250), fim = Math.min(l.length, col + len + 250);
    pre = `<span class="small">linha com ${fmtN(l.length)} caracteres (código compactado) — mostrando o pedaço em volta do achado; toque para abrir a linha inteira</span>\n`;
    l = (ini > 0 ? '…' : '') + l.substring(ini, fim) + (fim < l.length ? '…' : '');
    col = col - ini + (ini > 0 ? 1 : 0);
  }
  const h = len > 0 && col >= 0 ? esc(l.substring(0, col)) + '<mark>' + esc(l.substr(col, len)) + '</mark>' + esc(l.substring(col + len)) : esc(l);
  return `<code>${pre}${h || ' '}</code>`;
}
function renderRes() {
  if (!R) return;
  $('#cardRes').hidden = false;
  const lista = itensFiltrados();
  const arqs = new Set(R.itens.map((x) => x.a));
  $('#resTit').textContent = `${R.titulo} — ${fmtN(R.itens.length)} achado(s)`;
  $('#resSub').innerHTML = (R.itens.length ? `Em ${fmtN(arqs.size)} arquivo(s). ` : '') + esc(R.dica || '').replace(/\n/g, '<br>');
  const cont = {}; R.itens.forEach((x) => (cont[x.sev] = (cont[x.sev] || 0) + 1));
  $('#chipsSev').innerHTML = `<button class="chip ${R.filtroSev ? '' : 'on'}" data-s="">Todos (${fmtN(R.itens.length)})</button>` + Object.keys(SEV_NOME).filter((s) => cont[s]).map((s) => `<button class="chip ${R.filtroSev === s ? 'on' : ''}" data-s="${s}">${SEV_NOME[s]} (${fmtN(cont[s])})</button>`).join('');
  if (!R.itens.length) { $('#resLista').innerHTML = `<div class="bom">${esc(R.vazio)}</div>`; $('#resMais').innerHTML = ''; return; }
  let html = '', ult = -1, k = 0;
  const mostrados = lista.slice(0, R.limite);
  const porArq = new Map(); lista.forEach((x) => porArq.set(x.a, (porArq.get(x.a) || 0) + 1));
  for (const it of mostrados) {
    if (it.a !== ult) { if (ult !== -1) html += '</div>'; html += `<div class="grp"><div class="gh" data-a="${it.a}"><b>📄 ${esc(P.arquivos[it.a].caminho)}</b><span class="bd bd-i">${fmtN(porArq.get(it.a))}</span></div>`; ult = it.a; }
    html += `<div class="ri s-${it.sev}" data-k="${k++}"><div class="rh"><b>Linha ${fmtN(it.n)}</b> · ${esc(it.tipo)}</div>${trechoHTML(it)}${it.sol ? `<div class="rs">💡 ${esc(it.sol)}</div>` : ''}${it.bloco ? `<details onclick="event.stopPropagation()"><summary class="small">ver bloco (${fmtN(it.bloco.length)} caracteres)</summary><pre>${esc(it.bloco)}</pre></details>` : ''}${it.fn != null ? '<button class="peq" data-bloco="1">📎 Função inteira</button>' : ''}</div>`;
  }
  if (ult !== -1) html += '</div>';
  $('#resLista').innerHTML = html;
  $('#resLista')._itens = mostrados;
  $('#resMais').innerHTML = lista.length > R.limite ? `<div style="text-align:center"><div class="small">Mostrando ${fmtN(R.limite)} de ${fmtN(lista.length)} — nada foi descartado:</div><button class="peq" id="bResMais">Mostrar mais 300</button><button class="peq" id="bResTodos">Mostrar todos (${fmtN(lista.length)})</button></div>` : (lista.length ? `<div class="small" style="text-align:center">Mostrando todos os ${fmtN(lista.length)}.</div>` : '<div class="small">Nada com esse filtro.</div>');
  $('#bResMais')?.addEventListener('click', () => { R.limite += 300; renderRes(); });
  $('#bResTodos')?.addEventListener('click', () => { R.limite = Infinity; renderRes(); });
}
function relatorio(itens) {
  let s = `${R.titulo}\nProjeto: ${P.nome}\nData: ${agora()}\nTotal: ${itens.length} achado(s)\n${R.dica ? R.dica + '\n' : ''}${'═'.repeat(60)}\n`;
  let ult = -1;
  for (const it of itens) {
    const a = P.arquivos[it.a];
    if (it.a !== ult) { s += `\n■ ${a.caminho}\n`; ult = it.a; }
    let l = textoLinha(a, it.n);
    if (it.oculto) l = l.substring(0, it.col) + l.substr(it.col, 6) + '••••' + l.substring(it.col + it.len);
    s += `  [${SEV_NOME[it.sev]}] linha ${it.n}: ${it.tipo}\n    ${l.trim()}\n${it.sol ? '    💡 ' + it.sol + '\n' : ''}${it.bloco ? it.bloco.replace(/^/gm, '    ') + '\n' : ''}`;
  }
  return s;
}

/* ── Busca e substituição ───────────────────────────────────────────── */
function montarBusca() {
  const q = $('#busca').value; if (!q.trim()) return null;
  const fl = 'g' + ($('#bCaixa').checked ? '' : 'i');
  const ws = $('#bPalavra').checked;
  try {
    if ($('#bRegex').checked) return [new RegExp(q, fl + 'm')];
    return q.split(',').map((s) => s.trim()).filter(Boolean).map((s) => new RegExp((ws ? '\\b' : '') + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (ws ? '\\b' : ''), fl));
  } catch (e) { alert('Expressão inválida: ' + e.message); return null; }
}
async function buscar() {
  const res = montarBusca(); const lista = escopo(); if (!res || !lista) return;
  const itens = await porArquivo(lista, (a, ai, it) => {
    const t = txt(a), ls = inicios(a), porLinha = new Map();
    res.forEach((re, k) => { re.lastIndex = 0; let m; while ((m = re.exec(t))) { if (!m[0]) { re.lastIndex++; continue; } const n = linhaDe(a, m.index); if (!porLinha.has(n)) porLinha.set(n, { col: m.index - ls[n - 1], len: m[0].length, termos: new Set() }); porLinha.get(n).termos.add(m[0]); } });
    [...porLinha].sort((x, y) => x[0] - y[0]).forEach(([n, v]) => it.push({ a: ai, n, col: v.col, len: v.len, sev: 'info', tipo: 'achou: ' + [...v.termos].join(', '), sol: '' }));
  });
  mostrarResultado({ titulo: '🔍 Busca: ' + $('#busca').value, itens, vazio: 'Nada encontrado.', dica: '' });
}

/* ── Exportar ───────────────────────────────────────────────────────── */
function exportarZip(soEditados) {
  const fs = P.arquivos.filter((a) => !soEditados || a.editado).map((a) => ({ nome: a.caminho, dados: dadosAtuais(a) }));
  if (!fs.length) return alert(soEditados ? 'Nenhum arquivo editado ainda.' : 'Projeto vazio.');
  const nome = (P.nome.replace(/\.(zip|apk|jar|aab)$/i, '') || 'projeto') + (soEditados ? '-editados' : '-corrigido') + '.zip';
  baixar(escreverZip(fs), nome);
  toast('⬇️ ' + fmtN(fs.length) + ' arquivo(s) no zip.');
}

/* ── Modal ──────────────────────────────────────────────────────────── */
function modal(titulo, html, acoes = []) {
  $('#mTit').textContent = titulo; $('#mCorpo').innerHTML = html; $('#mCorpo').onclick = null;
  $('#mPe').innerHTML = '';
  for (const [rot, fn, cls] of acoes) { const b = document.createElement('button'); b.textContent = rot; if (cls) b.className = cls; b.onclick = fn; $('#mPe').appendChild(b); }
  const f = document.createElement('button'); f.textContent = 'Fechar'; f.onclick = fecharModal; $('#mPe').appendChild(f);
  $('#modal').hidden = false;
}
function modalTexto(titulo, texto, extras = []) {
  modal(titulo, `<div class="small">${fmtN(texto.length)} caracteres · ${fmtN(texto.split('\n').length)} linhas</div><pre></pre>`, [['📋 Copiar', () => copiar(texto)], ['⬇️ Baixar', () => baixar(texto, (titulo.replace(/[^\wÀ-ú-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'texto') + '.txt')], ...extras]);
  $('#mCorpo pre').textContent = texto;
}
function fecharModal() { $('#modal').hidden = true; $('#mCorpo').innerHTML = ''; const f = _aoFechar; _aoFechar = null; if (f) f(); }
function detectarProv(chave) {
  const k = chave.trim();
  for (const id of ['anthropic', 'openrouter', 'groq', 'gemini', 'xai', 'perplexity', 'openai']) if (PROV[id].prefixo && [].concat(PROV[id].prefixo).some((x) => k.startsWith(x))) return id;
  return null;
}
function iaCfg() { return { prov: $('#iaProv').value, modelo: $('#iaModelo').value.trim(), base: $('#iaBase').value.trim().replace(/\/+$/, ''), janela: +$('#iaJanela').value || 32000, pin: +$('#iaPIn').value || 0, pout: +$('#iaPOut').value || 0, maxOut: +$('#iaMaxOut').value, ctx: $('#iaCtx').value, numerar: $('#iaNumerar').checked, lembrar: $('#iaLembrar').checked }; }
function preencherProv(id, manter) {
  const p = PROV[id], s = (CFG.ia.porProv || {})[id] || {};
  $('#iaProv').value = id;
  $('#iaModelo').value = manter && s.modelo ? s.modelo : (s.modelo || p.modelo);
  $('#iaBase').value = s.base || p.base;
  $('#iaJanela').value = s.janela || p.janela;
  $('#iaPIn').value = s.pin ?? p.pin;
  $('#iaPOut').value = s.pout ?? p.pout;
  medir();
}
function guardarIA() {
  const c = iaCfg();
  CFG.ia.prov = c.prov; CFG.ia.maxOut = c.maxOut; CFG.ia.numerar = c.numerar; CFG.ia.lembrar = c.lembrar;
  CFG.ia.porProv = CFG.ia.porProv || {};
  CFG.ia.porProv[c.prov] = { modelo: c.modelo, base: c.base, janela: c.janela, pin: c.pin, pout: c.pout };
  salvarCfg();
  if (c.lembrar && $('#iaChave').value.trim()) DB.set('chave:' + c.prov, $('#iaChave').value.trim());
}

function numerar(t, de = 1) { const ls = t.split('\n'); const w = String(de + ls.length).length; return ls.map((l, i) => String(de + i).padStart(w) + '| ' + l).join('\n'); }
function blocoArquivo(a, de, ate) {
  const c = iaCfg();
  let t = txt(a);
  let cab = `=== ARQUIVO: ${a.caminho} (${fmtN(nLinhas(a))} linhas) ===`;
  if (de) { const ls = t.split('\n'); t = ls.slice(de - 1, ate).join('\n'); cab = `=== ARQUIVO: ${a.caminho} — linhas ${de} a ${Math.min(ate, ls.length)} de ${ls.length} ===`; }
  return cab + '\n' + (c.numerar ? numerar(t, de || 1) : t) + '\n=== FIM: ' + a.caminho + ' ===';
}
function contexto() {
  const c = iaCfg();
  const precisaArq = () => { if (atual < 0 || P.arquivos[atual].bin) throw new Error('Abra um arquivo de texto na aba 📄 Código primeiro.'); return P.arquivos[atual]; };
  switch (c.ctx) {
    case 'nada': return [];
    case 'res': if (!R) throw new Error('Faça uma detecção primeiro (aba 🔎 Detectar).'); return [relatorio(itensFiltrados())];
    case 'arq': return [blocoArquivo(precisaArq())];
    case 'trecho': { const a = precisaArq(); const de = Math.max(1, +$('#iaDe').value || 1), ate = Math.max(de, +$('#iaAte').value || de); return [blocoArquivo(a, de, ate)]; }
    case 'marc': { const l = P.arquivos.filter((a) => a.marcado && !a.bin); if (!l.length) throw new Error('Nenhum arquivo marcado ☑️. Marque na lista da aba 📂 Arquivos.'); return l.map((a) => blocoArquivo(a)); }
    case 'proj': { const l = analisaveis().map(([a]) => a); if (!l.length) throw new Error('Nenhum arquivo analisável.'); return l.map((a) => blocoArquivo(a)); }
  }
  return [];
}
function partesEnvio(perg, ctx) {
  const c = iaCfg();
  const cabe = Math.floor((c.janela - c.maxOut - tokensDe(SISTEMA.length + perg.length) - 500) * 3.5);
  const total = ctx.reduce((s, x) => s + x.length + 2, 0);
  if (total <= cabe || cabe <= 2000) return [ctx.join('\n\n')];
  const partes = []; let cur = '';
  for (const bloco of ctx) {
    if (bloco.length > cabe) { if (cur) { partes.push(cur); cur = ''; } for (let i = 0; i < bloco.length; i += cabe) { let fim = Math.min(bloco.length, i + cabe); const nl = bloco.lastIndexOf('\n', fim); if (nl > i + cabe / 2 && fim < bloco.length) fim = nl; partes.push(bloco.substring(i, fim)); i = fim - cabe; } continue; }
    if (cur.length + bloco.length + 2 > cabe) { partes.push(cur); cur = ''; }
    cur += (cur ? '\n\n' : '') + bloco;
  }
  if (cur) partes.push(cur);
  return partes;
}
