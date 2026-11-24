'use strict';
function renderListaArq() {
  const q = $('#filtroArq').value.trim().toLowerCase();
  let lista = P.arquivos.map((a, i) => [a, i]);
  if (q) lista = lista.filter(([a]) => a.caminho.toLowerCase().includes(q));
  const f = filtroArq;
  if (f === 'replit') lista = lista.filter(([a]) => a.rep || /(^|\/)(\.replit|replit\.nix)$/.test(a.caminho));
  if (f === 'bug') lista = lista.filter(([a]) => a.bug);
  if (f === 'edit') lista = lista.filter(([a]) => a.editado);
  if (f === 'marc') lista = lista.filter(([a]) => a.marcado);
  if (f === 'ign') lista = lista.filter(([a]) => ['pasta', 'tamanho'].includes(ignoradoPor(a)));
  if (f === 'bin') lista = lista.filter(([a]) => a.bin);
  const o = $('#ordemArq').value;
  if (o === 'tam') lista.sort((x, y) => y[0].tam - x[0].tam);
  if (o === 'alerta') lista.sort((x, y) => (y[0].rep + y[0].bug) - (x[0].rep + x[0].bug));
  $('#contArq').textContent = fmtN(lista.length) + ' de ' + fmtN(P.arquivos.length) + ' arquivo(s)';
  const box = $('#listaArq');
  box.dataset.total = lista.length;
  const LOTE = 400;
  const pinta = (ate) => {
    box.innerHTML = lista.slice(0, ate).map(([a, i]) => {
      const ig = ignoradoPor(a);
      const ic = a.bin ? '🔒' : ig ? '⏸' : '📄';
      let bd = '';
      if (a.rep) bd += `<span class="bd bd-r">🚨 ${a.rep}</span>`;
      if (a.bug) bd += `<span class="bd bd-b">🐛 ${a.bug}</span>`;
      if (a.editado) bd += '<span class="bd bd-e">✏️</span>';
      if (ig === 'pasta' || ig === 'tamanho') bd += `<span class="bd bd-i">⏸ ${ig}</span>`;
      if (a.erro) bd += '<span class="bd bd-r">erro</span>';
      return `<div class="arq" data-i="${i}">${a.bin ? '' : `<input type="checkbox" data-m="${i}" ${a.marcado ? 'checked' : ''} title="Marcar para mandar à IA">`}<span>${ic}</span><span class="cam">${esc(a.caminho)}</span>${bd}<span class="tam">${fmtB(a.tam)}</span></div>`;
    }).join('') + (lista.length > ate ? `<div style="padding:8px;text-align:center"><button class="peq" id="bMaisArq">Mostrar mais ${fmtN(Math.min(LOTE, lista.length - ate))}</button> <button class="peq" id="bTodosArq">Mostrar todos (${fmtN(lista.length)})</button></div>` : '');
    $('#bMaisArq')?.addEventListener('click', () => pinta(ate + LOTE));
    $('#bTodosArq')?.addEventListener('click', () => pinta(lista.length));
  };
  pinta(LOTE);
}

/* ── Visualizador de código ─────────────────────────────────────────── */
function renderSelArq() {
  const s = $('#selArq');
  s.innerHTML = '<option value="-1">— escolha um arquivo —</option>' + P.arquivos.map((a, i) => `<option value="${i}">${a.rep ? '🚨 ' : a.bug ? '🐛 ' : a.editado ? '✏️ ' : ''}${esc(a.caminho)}</option>`).join('');
  s.value = String(atual);
}
function abrirArquivo(i, linha) {
  if (!P.arquivos[i]) return;
  if (!$('#editBox').hidden && atual !== i && !confirm('Há uma edição não salva. Descartar?')) return;
  $('#editBox').hidden = true;
  const mudou = atual !== i || !$('#vis').childElementCount;
  atual = i; selLinha = 0;
  $('#selArq').value = String(i);
  ir('cod');
  if (mudou) renderCodigo();
  if (linha) irParaLinha(linha);
}
function renderCodigo() {
  const a = P.arquivos[atual];
  $('#codVazio').hidden = !!a;
  $('#barraSel').hidden = true;
  if (!a) { $('#vis').hidden = true; $('#binBox').hidden = true; return; }
  const ig = ignoradoPor(a);
  $('#codInfo').innerHTML = `<b>${esc(a.caminho)}</b><br>${fmtB(a.tam)}${a.bin ? '' : ' · ' + fmtN(nLinhas(a)) + ' linhas'}${a.editado ? ' · <span style="color:#c7d2fe">✏️ editado</span>' : ''}${ig === 'pasta' || ig === 'tamanho' ? ` · ⏸ não analisado (${ig}) <button class="peq" id="bForcar">Analisar este</button>` : ''}`;
  $('#bForcar')?.addEventListener('click', async () => { a.forcar = true; await posCarga(true); abrirArquivo(atual); });
  $('#bDesfazer').hidden = !a.editado;
  $('#bDesfazer').textContent = a.novo ? '🗑 Tirar (veio do B)' : '↩ Desfazer edições';
  $('#bMarcarIA').textContent = a.marcado ? '☑️ Marcado p/ IA' : '☐ Marcar p/ IA';
  $$('#bEditar,#bOrganizar,#bCopiarArq,#bIr,#bQuebra,#bMarcarIA').forEach((b) => (b.disabled = a.bin));
  if (a.bin) {
    $('#vis').hidden = true; $('#marcas').innerHTML = '';
    const ehZip = EXT_ZIP.test(a.ext) && a.tam;
    $('#binBox').hidden = false;
    $('#binBox').innerHTML = `<div class="info">🔒 Arquivo binário (.${esc(a.ext || '?')}, ${fmtB(a.tam)}) — não é texto, então não dá para ler aqui.${a.erro ? '<br>Erro: ' + esc(a.erro) : ''}</div>${ehZip ? '<button class="pri" id="bExpandir">📦 Abrir este .zip/.apk dentro do projeto</button>' : ''}<button id="bForcarTexto">Tentar ler como texto mesmo assim</button>`;
    $('#bExpandir')?.addEventListener('click', () => expandirZip(atual));
    $('#bForcarTexto').addEventListener('click', () => { a.bin = false; a.texto = null; a._ls = null; renderTudo(); abrirArquivo(atual); });
    return;
  }
  $('#binBox').hidden = true;
  const vis = $('#vis'); vis.hidden = false;
  vis.classList.toggle('quebra', CFG.quebra);
  const m = marcas.get(atual) || new Map();
  const t = txt(a);
  const partes = [];
  let n = 1, ini = 0;
  while (true) {
    const fim = t.indexOf('\n', ini);
    const l = (fim === -1 ? t.substring(ini) : t.substring(ini, fim)).replace(/\r$/, '');
    const mk = m.get(n);
    const cls = mk ? ' m-' + pior(mk.map((x) => x.sev)) : '';
    partes.push(`<div class="ln${cls}" id="L${n}"><i>${n}</i><span>${esc(l) || ' '}</span></div>`);
    if (fim === -1) break;
    ini = fim + 1; n++;
  }
  vis.innerHTML = partes.join('');
  vis.scrollTop = 0;
  renderMarcas();
}
function renderMarcas() {
  const m = marcas.get(atual);
  if (!m || !m.size) { $('#marcas').innerHTML = ''; return; }
  const ls = [...m.keys()].sort((x, y) => x - y);
  $('#marcas').innerHTML = `<span class="small" style="align-self:center;white-space:nowrap">${ls.length} marca(s):</span>` + ls.map((n) => { const it = m.get(n); return `<button class="chip c-${pior(it.map((x) => x.sev))}" data-n="${n}" title="${esc(it.map((x) => x.tipo).join(' · '))}">L${n} ${esc(it[0].tipo.split(' ')[0])}</button>`; }).join('');
}
function irParaLinha(n) {
  const a = P.arquivos[atual]; if (!a || a.bin) return;
  n = Math.max(1, Math.min(n, nLinhas(a)));
  if (!$('#editBox').hidden) { const ed = $('#editor'); const ls = inicios(a); ed.focus(); ed.setSelectionRange(ls[n - 1] || 0, (ls[n] ?? ed.value.length + 1) - 1); return; }
  const el = document.getElementById('L' + n); if (!el) return;
  const vis = $('#vis');
  const rolar = () => { vis.scrollTop = el.offsetTop - vis.clientHeight / 3; };
  rolar(); requestAnimationFrame(() => { rolar(); requestAnimationFrame(rolar); });
  vis.scrollIntoView({ block: 'start' });
  el.classList.remove('pisca'); void el.offsetWidth; el.classList.add('pisca');
  selecionarLinha(n);
}
function selecionarLinha(n) {
  $$('#vis .ln.sel').forEach((x) => x.classList.remove('sel'));
  selLinha = n;
  const el = document.getElementById('L' + n); if (el) el.classList.add('sel');
  const m = marcas.get(atual)?.get(n);
  $('#selInfo').textContent = 'Linha ' + n + (m ? ' · ' + m.map((x) => x.tipo).join(' · ') : '');
  $('#barraSel').hidden = false;
}
function aplicarTexto(i, novo) {
  const a = P.arquivos[i];
  if (novo === txt(a)) return false;
  if (a.original == null) a.original = txt(a);
  a.texto = novo; a._ls = null; a.editado = a.texto !== a.original;
  if (!a.editado) a.original = null;
  return true;
}
async function posEdicao() { await varreduraRapida(); renderTudo(); renderCodigo(); salvarSessao(); }
function dadosAtuais(a) { return a.editado && !a.bin ? new TextEncoder().encode(a.texto) : a.dados; }
function organizar(c) {
  // Reindenta sem mexer no que está dentro de textos/strings.
  let out = '', nivel = 0, i = 0, str = null, linhaNova = true;
  const ind = () => '  '.repeat(Math.max(0, nivel));
  while (i < c.length) {
    const ch = c[i];
    if (str) { out += ch; if (ch === '\\') { out += c[i + 1] ?? ''; i += 2; continue; } if (ch === str) str = null; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { if (linhaNova) { out += ind(); linhaNova = false; } str = ch; out += ch; i++; continue; }
    if (ch === '/' && c[i + 1] === '/') { const f = c.indexOf('\n', i); const s = f === -1 ? c.substring(i) : c.substring(i, f); if (linhaNova) { out += ind(); linhaNova = false; } out += s; i += s.length; continue; }
    if (ch === '/' && c[i + 1] === '*') { const f = c.indexOf('*/', i + 2); const s = f === -1 ? c.substring(i) : c.substring(i, f + 2); if (linhaNova) { out += ind(); linhaNova = false; } out += s; i += s.length; continue; }
    if (ch === '\n' || ch === '\r') { if (!linhaNova) out += '\n'; linhaNova = true; i++; continue; }
    if (linhaNova && (ch === ' ' || ch === '\t')) { i++; continue; }
    if (ch === '}' || ch === ']') { nivel--; if (!linhaNova) out += '\n'; out += ind() + ch; linhaNova = false; i++; continue; }
    if (linhaNova) { out += ind(); linhaNova = false; }
    out += ch;
    if (ch === '{' || ch === '[') { nivel++; out += '\n'; linhaNova = true; }
    else if (ch === ';' && c[i + 1] !== '\n') { out += '\n'; linhaNova = true; }
    i++;
  }
  return out.replace(/\n{3,}/g, '\n\n');
}
async function expandirZip(i) {
  const a = P.arquivos[i];
  try {
    const ents = await lerZip(a.dados);
    const pref = a.caminho.replace(/\.[^.]+$/, '') + '/';
    for (const e of ents) P.arquivos.push(e.erro ? Object.assign(novoArquivo(pref + e.nome, new Uint8Array()), { bin: true, erro: e.erro }) : novoArquivo(pref + e.nome, e.dados));
    P.arquivos.sort((x, y) => x.caminho.localeCompare(y.caminho));
    atual = P.arquivos.indexOf(a);
    await posCarga();
    toast('📦 ' + fmtN(ents.length) + ' arquivo(s) adicionados de dentro de ' + esc(a.caminho));
  } catch (e) { alert('Não consegui abrir: ' + e.message); }
}
