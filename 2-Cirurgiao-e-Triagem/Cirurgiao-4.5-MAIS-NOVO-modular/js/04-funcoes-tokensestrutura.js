'use strict';
/* ── Scanner de código (pula textos e comentários) ───────────────────── */
// Devolve posições de ( [ { ) ] } fora de strings/comentários. Heurística, serve p/ JS/TS/JSX/CSS.
function* tokensEstrutura(t, css) {
  let i = 0, prev = '';
  const n = t.length;
  const podeRegex = (p) => !p || '(,=:[!&|?{};+-*%~^'.includes(p);
  while (i < n) {
    const c = t[i];
    if (c === '/' && t[i + 1] === '*') { const f = t.indexOf('*/', i + 2); i = f === -1 ? n : f + 2; continue; }
    if (!css && c === '/' && t[i + 1] === '/') { const f = t.indexOf('\n', i); i = f === -1 ? n : f; continue; }
    if (c === '"' || c === "'") {
      if (!css && /[\w$]/.test(t[i - 1] || '')) { prev = c; i++; continue; } // apóstrofo dentro de texto JSX (ex.: don't)
      i++; while (i < n && t[i] !== c && t[i] !== '\n') { if (t[i] === '\\') i++; i++; } i++; prev = 'a'; continue;
    }
    if (c === '`' && !css) {
      i++; let prof = 0;
      while (i < n) { const d = t[i]; if (d === '\\') { i += 2; continue; } if (prof === 0 && d === '`') break; if (d === '$' && t[i + 1] === '{') { prof++; i += 2; continue; } if (prof > 0 && d === '}') prof--; i++; }
      i++; prev = 'a'; continue;
    }
    if (c === '/' && !css && podeRegex(prev)) {
      let j = i + 1, classe = false, ok = false;
      while (j < n && t[j] !== '\n') { const d = t[j]; if (d === '\\') { j += 2; continue; } if (d === '[') classe = true; else if (d === ']') classe = false; else if (d === '/' && !classe) { ok = true; break; } j++; }
      if (ok) { i = j + 1; while (/[a-z]/i.test(t[i] || '')) i++; prev = 'a'; continue; }
    }
    if ('([{)]}'.includes(c)) yield [c, i];
    if (!/\s/.test(c)) prev = c;
    i++;
  }
}
function extrairBloco(t, desde) {
  const abre = t.indexOf('{', desde);
  if (abre === -1) return null;
  let prof = 0;
  for (const [c, i] of tokensEstrutura(t.substring(abre))) {
    if (c === '{') prof++;
    else if (c === '}') { prof--; if (prof === 0) return { ini: abre, fim: abre + i }; }
  }
  return null;
}
function balanco(a, ai, itens) {
  const t = txt(a), css = /^(css|scss|less)$/.test(a.ext);
  const pilha = [];
  const par = { ')': '(', ']': '[', '}': '{' };
  const nome = { '(': 'parêntese', '[': 'colchete', '{': 'chave' };
  for (const [c, i] of tokensEstrutura(t, css)) {
    if ('([{'.includes(c)) pilha.push([c, i]);
    else {
      const topo = pilha[pilha.length - 1];
      if (topo && topo[0] === par[c]) pilha.pop();
      else {
        const n = linhaDe(a, i);
        itens.push({ a: ai, n, col: i - inicios(a)[n - 1], len: 1, sev: 'alta', tipo: `🔴 “${c}” fechando sem abrir`, sol: topo ? `Esperava fechar ${nome[topo[0]]} “${topo[0]}” aberto na linha ${linhaDe(a, topo[1])}. Pode faltar fechar algo antes ou sobrar este “${c}”.` : `Sobra um “${c}” aqui (nada aberto para ele fechar).`, heur: true });
        if (topo && pilha.some((p) => p[0] === par[c])) { while (pilha.length && pilha[pilha.length - 1][0] !== par[c]) pilha.pop(); pilha.pop(); }
      }
    }
  }
  for (const [c, i] of pilha) { const n = linhaDe(a, i); itens.push({ a: ai, n, col: i - inicios(a)[n - 1], len: 1, sev: 'alta', tipo: `🔴 ${nome[c]} “${c}” aberto e nunca fechado`, sol: `Abriu na linha ${n} e chegou ao fim do arquivo sem fechar.`, heur: true }); }
}
function exameReplit(a, ai, itens, rapido) {
  if (ARQ_REPLIT.test(a.caminho)) itens.push({ a: ai, n: 1, col: 0, len: 0, sev: rapido ? 'alta' : 'alta', tipo: '⚙️ Arquivo de configuração da Replit', sol: 'Este arquivo só serve dentro da Replit. Pode apagar (não vai para o zip se você remover).' });
  varrer(a, ai, rapido ? R_REPLIT.filter((r) => r.sev !== 'info') : R_REPLIT, itens);
}
function varrer(a, ai, regras, itens) {
  const t = txt(a), ls = inicios(a);
  for (const r of regras) {
    if (r.ext && !r.ext.test(a.ext)) continue;
    if (r.sev === 'estilo' && !CFG.estilo) continue;
    const re = new RegExp(r.re.source, r.re.flags.includes('g') ? r.re.flags : r.re.flags + 'g');
    const vistos = new Set();
    let m;
    while ((m = re.exec(t))) {
      if (m[0] === '') { re.lastIndex++; continue; }
      const n = linhaDe(a, m.index);
      if (vistos.has(n)) continue;
      vistos.add(n);
      itens.push({ a: ai, n, col: m.index - ls[n - 1], len: m[0].length, sev: r.sev || 'alta', tipo: r.tipo, sol: r.sol || '', achado: m[0] });
    }
  }
}
function conflitoMerge(a, ai, itens) { varrer(a, ai, [R_BUGS[0]], itens); }

/* ── Exames ─────────────────────────────────────────────────────────── */
async function porArquivo(lista, fn) {
  const itens = []; let t0 = performance.now(), k = 0;
  for (const [a, i] of lista) {
    await fn(a, i, itens);
    if (performance.now() - t0 > 50) { status(`⏳ Analisando ${fmtN(++k)} de ${fmtN(lista.length)}…`); await pausa(); t0 = performance.now(); } else k++;
  }
  status('');
  return itens;
}
function idsDuplicados(a, ai, itens) {
  if (!/^html?$/.test(a.ext)) return;
  const t = txt(a), vistos = new Map(), re = /\sid\s*=\s*["']([^"'{}$]+)["']/g; let m;
  while ((m = re.exec(t))) {
    const id = m[1];
    if (vistos.has(id)) { const n = linhaDe(a, m.index); itens.push({ a: ai, n, col: m.index - inicios(a)[n - 1], len: m[0].length, sev: 'media', tipo: '⚠️ id repetido no HTML', sol: `O id="${id}" já apareceu na linha ${vistos.get(id)}. getElementById pega só o primeiro — o segundo fica “morto”.` }); }
    else vistos.set(id, linhaDe(a, m.index));
  }
}
function declDuplicadas(a, ai, itens) {
  if (!/^(js|mjs|cjs|jsx|ts|tsx)$/.test(a.ext)) return;
  const t = txt(a), vistos = new Map(), re = /^(?:export\s+)?(?:const|let|class|function)\s+([\w$]+)/gm; let m;
  while ((m = re.exec(t))) {
    const nome = m[1];
    if (vistos.has(nome)) { const n = linhaDe(a, m.index); itens.push({ a: ai, n, col: 0, len: m[0].length, sev: 'alta', tipo: '🔴 Nome declarado duas vezes', sol: `“${nome}” já foi declarado na linha ${vistos.get(nome)} (no começo da linha, mesmo nível). Isso dá SyntaxError e o arquivo inteiro para.` }); }
    else vistos.set(nome, linhaDe(a, m.index));
  }
}
function carregarScript(src) { return new Promise((ok, erro) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = erro; document.head.appendChild(s); }); }
async function acornPronto() {
  if (window.acorn) return window.acorn;
  if (_acorn === false) return null;
  for (const u of ['https://cdn.jsdelivr.net/npm/acorn@8.14.0/dist/acorn.js', 'https://unpkg.com/acorn@8.14.0/dist/acorn.js']) {
    try { await carregarScript(u); if (window.acorn) return window.acorn; } catch {}
  }
  _acorn = false; return null;
}
function parseJS(ac, codigo) {
  const base = { ecmaVersion: 'latest', allowHashBang: true, allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true, allowImportExportEverywhere: true, locations: true };
  const ehModulo = /^\s*(import|export)\b/m.test(codigo);
  try { ac.parse(codigo, { ...base, sourceType: ehModulo ? 'module' : 'script' }); return null; }
  catch (e1) {
    try { ac.parse(codigo, { ...base, sourceType: ehModulo ? 'script' : 'module' }); return null; } catch { return e1; }
  }
}
function traduzErro(m) {
  const t = [[/Unexpected token/i, 'Símbolo inesperado — costuma ser vírgula, parêntese ou chave a mais/faltando logo antes'], [/Unterminated string/i, 'Texto (aspas) aberto e não fechado'], [/Unterminated template/i, 'Crase ` aberta e não fechada'], [/Unterminated regular expression/i, 'Expressão / … / não fechada'], [/Identifier '(.+)' has already been declared/i, 'O nome “$1” foi declarado duas vezes'], [/Unexpected character/i, 'Caractere estranho (às vezes aspas “curvas” coladas do Word/WhatsApp)'], [/'return' outside of function/i, 'return fora de função'], [/Unexpected keyword/i, 'Palavra reservada em lugar errado'], [/Assigning to rvalue/i, 'Atribuição inválida (talvez = no lugar de ===)']];
  for (const [re, pt] of t) if (re.test(m)) return pt.replace('$1', (re.exec(m) || [])[1] || '') + '. (Original: ' + m + ')';
  return m;
}
function mostrarResultado(r) {
  R = { ...r, filtroSev: '', limite: 300 };
  addMarcas(r.itens.filter((x) => x.sev !== 'info' || /Replit|Variável/.test(x.tipo)));
  // contadores de badge (o exame completo atualiza também)
  const porArq = new Map();
  r.itens.forEach((x) => { if (x.sev === 'alta' || x.sev === 'media') porArq.set(x.a, (porArq.get(x.a) || 0) + 1); });
  if (/Replit/.test(r.titulo)) P.arquivos.forEach((a, i) => { a.rep = r.itens.filter((x) => x.a === i && x.sev !== 'info').length; });
  else if (!/Funções|localStorage|API|JSON/.test(r.titulo)) porArq.forEach((n, i) => { P.arquivos[i].bug = Math.max(P.arquivos[i].bug, n); });
  $('#resFiltro').value = '';
  renderTudo();
  renderRes();
  ir('det');
  $('#cardRes').scrollIntoView({ block: 'start' });
  if (atual >= 0 && !$('#vis').hidden) renderCodigo();
}
function itensFiltrados() {
  const q = $('#resFiltro').value.trim().toLowerCase();
  return R.itens.filter((x) => (!R.filtroSev || x.sev === R.filtroSev) && (!q || (x.tipo + ' ' + x.sol + ' ' + P.arquivos[x.a].caminho + ' ' + textoLinha(P.arquivos[x.a], x.n)).toLowerCase().includes(q)));
}
