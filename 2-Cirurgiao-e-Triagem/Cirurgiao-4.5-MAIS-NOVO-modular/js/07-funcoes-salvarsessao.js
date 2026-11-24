'use strict';
function salvarSessao() {
  if (!CFG.sessao) return;
  clearTimeout(_sessT);
  _sessT = setTimeout(async () => { try { if (P.arquivos.length) await DB.set('sessao', pacote()); } catch (e) { toast('⚠️ Não consegui guardar a sessão (memória do navegador cheia?): ' + esc(e.message)); } }, 1200);
}
async function renderMem() {
  const l = await DB.get('projetos', []);
  $('#listaMem').innerHTML = l.map((m, i) => `<div class="mem"><b>${esc(m.nome)}</b><div class="meta">${fmtN(m.n)} arquivo(s) · ${fmtB(m.tam)} · ${m.edit ? m.edit + ' editado(s) · ' : ''}${esc(m.data)}</div><button class="peq ok" data-ab="${i}">📂 Abrir</button><button class="peq" data-zip="${i}">⬇️ .zip</button><button class="peq perigo" data-rm="${i}">🗑</button></div>`).join('') || '<div class="small">Nada guardado. Abra um projeto e toque em 💾 Guardar na memória.</div>';
}
async function verSessao() {
  const s = await DB.get('sessao', null);
  const box = $('#sessaoBox');
  if (!s || P.arquivos.length) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `↺ Último projeto: <b>${esc(s.nome)}</b> (${fmtN(s.arquivos.length)} arquivos, ${esc(s.data)}${s.arquivos.some((a) => a.editado) ? ', com edições' : ''}) <button class="peq ok" id="bReabrir">Reabrir</button> <button class="peq" id="bEsquecer">Esquecer</button>`;
  $('#bReabrir').onclick = async () => { despacotar(s); box.hidden = true; await posCarga(true); };
  $('#bEsquecer').onclick = async () => { await DB.del('sessao'); box.hidden = true; };
}

/* ── Ajustes ────────────────────────────────────────────────────────── */
function salvarCfg() { DB.set('cfg', CFG).catch(() => {}); }
function preencherCfg() {
  $('#cfLimite').value = String(CFG.limiteKB);
  if ($('#cfLimite').value !== String(CFG.limiteKB)) { const o = document.createElement('option'); o.value = CFG.limiteKB; o.textContent = fmtB(CFG.limiteKB * 1024); $('#cfLimite').appendChild(o); $('#cfLimite').value = String(CFG.limiteKB); }
  $('#cfPastas').checked = CFG.ignorarPastas; $('#cfPastasTxt').value = CFG.pastas;
  $('#cfEstilo').checked = CFG.estilo; $('#cfSessao').checked = CFG.sessao;
  $('#gastoLimite').value = CFG.gastoLimite || ''; $('#gastoAviso').value = CFG.gastoAviso || '';
}
function raizDe(lista) {
  const ps = lista.map((a) => a.caminho);
  if (!ps.length || !ps.every((p) => p.includes('/'))) return '';
  const r = ps[0].split('/')[0] + '/';
  return ps.every((p) => p.startsWith(r)) ? r : '';
}
function infoCmp() {
  $('#cmpInfo').innerHTML = `🅰️ Recebe: <b>${P.arquivos.length ? esc(P.nome) + ' · ' + fmtN(P.arquivos.length) + ' arquivos' : 'nenhum — abra na aba 📂 Arquivos'}</b><br>🅱️ Doadora: <b>${PB ? esc(PB.nome) + ' · ' + fmtN(PB.arquivos.length) + ' arquivos' : 'nenhuma ainda'}</b>`;
  $('#bComparar').hidden = !(PB && P.arquivos.length);
  $('#bTrocarAB').hidden = !(PB && P.arquivos.length);
}
function blocoAte(t, ab, abre, fecha) {
  let prof = 0;
  for (const [c, i] of tokensEstrutura(t.substring(ab))) { if (c === abre) prof++; else if (c === fecha) { prof--; if (!prof) return ab + i; } }
  return -1;
}
function blocoRota(t, pos) {
  const ab = t.indexOf('(', pos); if (ab < 0) return null;
  const f = blocoAte(t, ab, '(', ')'); if (f < 0) return null;
  let e = f + 1; if (t[e] === ';') e++;
  const ini = inicioLinha(t, pos);
  return { ini, fim: e, texto: t.substring(ini, e) };
}
function blocoTela(t, pos) {
  const ini = inicioLinha(t, pos);
  const a = t.indexOf('/>', pos), b = t.indexOf('</Route>', pos);
  let f = a < 0 ? b : b < 0 ? a : Math.min(a, b); if (f < 0) return null;
  f += f === b ? 8 : 2;
  return { ini, fim: f, texto: t.substring(ini, f) };
}
function blocoFuncao(t, pos, seta) {
  const ini = inicioLinha(t, pos);
  let corpo;
  if (seta) {
    const s = t.indexOf('=>', pos); if (s < 0) return null;
    let k = s + 2; while (/\s/.test(t[k] || '')) k++;
    if (t[k] !== '{') { const nl = t.indexOf('\n', k); const f = nl < 0 ? t.length : nl; return { ini, fim: f, texto: t.substring(ini, f) }; }
    corpo = k;
  } else {
    const ab = t.indexOf('(', pos); if (ab < 0) return null;
    const fp = blocoAte(t, ab, '(', ')'); if (fp < 0) return null;
    corpo = t.indexOf('{', fp); if (corpo < 0) return null;
  }
  const f = blocoAte(t, corpo, '{', '}'); if (f < 0) return null;
  let e = f + 1; if (t[e] === ';') e++;
  return { ini, fim: e, texto: t.substring(ini, e) };
}
function rotasDe(proj) {
  const raiz = raizDe(proj.arquivos), m = new Map();
  proj.arquivos.forEach((a, i) => {
    if (a.bin || ignoradoPor(a) || !/^(js|mjs|cjs|ts|tsx|jsx)$/.test(a.ext)) return;
    const t = txt(a); let x;
    const re = /\b([A-Za-z_$][\w$]*)\.(get|post|put|patch|delete|all)\s*\(\s*(["'`])([^"'`\n]+)\3/g;
    while ((x = re.exec(t))) { if (!OBJ_ROTA.test(x[1])) continue; const k = x[2].toUpperCase() + ' ' + x[4]; if (!m.has(k)) m.set(k, { k, tipo: 'rota', i, pos: x.index, chave: chaveDe(a, raiz) }); }
    const rt = /<Route\b[^>]*?\bpath\s*=\s*\{?\s*["'`]([^"'`]+)["'`]/g;
    while ((x = rt.exec(t))) { const k = 'TELA ' + x[1]; if (!m.has(k)) m.set(k, { k, tipo: 'tela', i, pos: x.index, chave: chaveDe(a, raiz) }); }
  });
  return m;
}
function funcoesDe(proj) {
  const raiz = raizDe(proj.arquivos), m = new Map();
  proj.arquivos.forEach((a, i) => {
    if (a.bin || ignoradoPor(a) || !ARQ_CODIGO.test(a.ext)) return;
    const t = txt(a); let x;
    const r1 = /(?:^|[^\w$.])(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([\w$]+)\s*\(/gm;
    while ((x = r1.exec(t))) if (!m.has(x[1])) m.set(x[1], { k: x[1], tipo: 'funcao', i, pos: x.index + (x[0].length - x[0].trimStart().length), seta: false, chave: chaveDe(a, raiz) });
    const r2 = /^[ \t]*(?:export\s+)?(?:const|let|var)\s+([\w$]+)\s*(?::[^=\n]+)?=\s*(?:async\s*)?(?:function\b|\([^)\n]*\)\s*(?::[^=\n]+)?=>|[\w$]+\s*=>)/gm;
    while ((x = r2.exec(t))) if (!m.has(x[1])) m.set(x[1], { k: x[1], tipo: 'funcao', i, pos: x.index, seta: /=>/.test(x[0]), chave: chaveDe(a, raiz) });
  });
  return m;
}
function importsDe(t) {
  const out = []; const re = /^import\s+(?:type\s+)?([\s\S]*?)\s+from\s+(["'])([^"'\n]+)\2;?/gm; let x;
  while ((x = re.exec(t))) {
    const spec = x[1].trim(), mod = x[3], nomes = [];
    const d = /^([\w$]+)\s*(?:,|$)/.exec(spec); if (d) nomes.push({ local: d[1], tipo: 'def' });
    const ns = /\*\s+as\s+([\w$]+)/.exec(spec); if (ns) nomes.push({ local: ns[1], tipo: 'ns' });
    const nm = /\{([\s\S]*?)\}/.exec(spec);
    if (nm) nm[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => { const p = s.replace(/^type\s+/, '').split(/\s+as\s+/); nomes.push({ local: (p[1] || p[0]).trim(), tipo: 'nom', txt: s }); });
    out.push({ mod, nomes, ini: x.index, fim: x.index + x[0].length });
  }
  return out;
}
function faltasDoBloco(tB, bloco, tA) {
  const usados = new Set(bloco.match(/[A-Za-z_$][\w$]*/g) || []);
  const temNoA = (n) => new RegExp('(^|[^\\w$])' + n.replace(/\$/g, '\\$') + '([^\\w$]|$)').test(tA);
  const porMod = new Map();
  for (const im of importsDe(tB)) for (const n of im.nomes) {
    if (!usados.has(n.local) || temNoA(n.local)) continue;
    if (!porMod.has(im.mod)) porMod.set(im.mod, { def: null, ns: null, nom: [] });
    const g = porMod.get(im.mod);
    if (n.tipo === 'def') g.def = n.local; else if (n.tipo === 'ns') g.ns = n.local; else g.nom.push(n.txt);
  }
  const linhas = [];
  for (const [mod, g] of porMod) {
    if (g.ns) linhas.push(`import * as ${g.ns} from "${mod}";`);
    if (g.def || g.nom.length) linhas.push(`import ${[g.def, g.nom.length ? '{ ' + g.nom.join(', ') + ' }' : ''].filter(Boolean).join(', ')} from "${mod}";`);
  }
  const decl = new Set(); const rd = /^(?:export\s+)?(?:async\s+)?(?:function\s*\*?\s*|const\s+|let\s+|class\s+)([\w$]+)/gm; let x;
  while ((x = rd.exec(tB))) decl.add(x[1]);
  const ajudantes = [...usados].filter((n) => decl.has(n) && !temNoA(n) && !bloco.match(new RegExp('^(?:export\\s+)?(?:async\\s+)?(?:function\\s*\\*?\\s*|const\\s+|let\\s+|class\\s+)' + n.replace(/\$/g, '\\$') + '\\b', 'm')));
  return { imports: linhas, ajudantes };
}
