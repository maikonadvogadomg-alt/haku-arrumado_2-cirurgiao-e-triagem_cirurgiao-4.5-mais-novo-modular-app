'use strict';
function inserirNoA(ai, x) {
  const a = P.arquivos[ai], tB = txt(PB.arquivos[x.i]);
  let t = txt(a), pos = -1;
  if (x.tipo === 'rota') {
    const re = /\b([A-Za-z_$][\w$]*)\.(get|post|put|patch|delete|all)\s*\(\s*(["'`])[^"'`\n]+\3/g; let m;
    while ((m = re.exec(t))) if (OBJ_ROTA.test(m[1])) { const b = blocoRota(t, m.index); if (b && b.fim > pos) { pos = b.fim; re.lastIndex = b.fim; } }
    if (pos < 0) { const m2 = /^[ \t]*(?:const\s+\w+\s*=\s*(?:http\.)?createServer|return\s+\w*[Ss]erver|\w+\.listen\s*\()/m.exec(t); if (m2) pos = m2.index - 1; }
  } else if (x.tipo === 'tela') {
    const re = /<Route\b/g; let m; while ((m = re.exec(t))) { const b = blocoTela(t, m.index); if (b) pos = b.fim; }
  }
  if (pos < 0) pos = t.length;
  const { imports, ajudantes } = faltasDoBloco(tB, x.bloco, t);
  let bloco = x.bloco;
  t = t.substring(0, pos) + (pos > 0 && t[pos - 1] !== '\n' ? '\n' : '') + (x.tipo !== 'tela' ? '\n' : '') + bloco + (t[pos] === '\n' || pos === t.length ? '' : '\n') + t.substring(pos);
  let ins = pos;
  if (imports.length) {
    const ims = importsDe(t); const at = ims.length ? ims[ims.length - 1].fim : 0;
    const add = (at ? '\n' : '') + imports.join('\n') + (at ? '' : '\n');
    t = t.substring(0, at) + add + t.substring(at);
    if (at <= ins) ins += add.length;
  }
  aplicarTexto(ai, t);
  const linha = linhaDe(a, ins + (t[ins] === '\n' ? 1 : 0));
  return { k: x.k, ai, caminho: a.caminho, linha, imports, ajudantes };
}
function verDiff(x, abertos) {
  const aA = P.arquivos[x.ia], aB = PB.arquivos[x.ib];
  const A = linhasDe(txt(aA)), B = linhasDe(txt(aB));
  const ops = diffLinhas(A, B);
  const { mais, menos } = contarDiff(ops);
  abertos = abertos || new Set();
  _diffEstado = { x, ops, A, B, abertos };
  // agrupa em blocos de mesmo tipo
  const grupos = []; for (const o of ops) { const g = grupos[grupos.length - 1]; if (g && g.t === o[0]) g.l.push(o); else grupos.push({ t: o[0], l: [o] }); }
  let h = `<div class="small" style="margin-bottom:6px">🟩 ${fmtN(mais)} linha(s) só no B · 🟥 ${fmtN(menos)} só no A · números: A | B</div><div class="df">`;
  const lin = (o, cls) => `<div class="l ${cls}"><span class="num">${o[1] >= 0 ? o[1] + 1 : ''}</span><span class="num">${o[2] >= 0 ? o[2] + 1 : ''}</span><span class="tx">${esc(o[0] === '+' ? B[o[2]] : A[o[1]]) || ' '}</span></div>`;
  grupos.forEach((g, gi) => {
    if (g.t === '=') {
      if (g.l.length > 8 && !abertos.has(gi)) { const ini = gi === 0 ? [] : g.l.slice(0, 3), fim = gi === grupos.length - 1 ? [] : g.l.slice(-3); h += ini.map((o) => lin(o, '')).join('') + `<button class="peq df-mais" data-g="${gi}">⋯ ${fmtN(g.l.length - ini.length - fim.length)} linhas iguais (mostrar)</button>` + fim.map((o) => lin(o, '')).join(''); }
      else h += g.l.map((o) => lin(o, '')).join('');
    } else if (g.t === '+') {
      const antes = grupos[gi - 1]?.t === '-';
      h += `<div class="df-acao"><button class="peq ok" data-traz="${gi}">💉 Trazer estas ${g.l.length} linha(s) para o A</button>${antes ? `<button class="peq" data-troca="${gi}">🔁 Trocar as ${grupos[gi - 1].l.length} linha(s) 🟥 do A por estas</button>` : ''}</div>` + g.l.map((o) => lin(o, 'add')).join('');
    } else h += g.l.map((o) => lin(o, 'rem')).join('');
  });
  h += '</div>';
  const corpoScroll = $('#modal').hidden ? 0 : $('#mCorpo').scrollTop;
  modal(`🔍 ${x.k}`, h, [['↪ Abrir arquivo do A', () => { fecharModal(); abrirArquivo(x.ia); }]]);
  $('#mCorpo').scrollTop = corpoScroll;
  $('#mCorpo').onclick = async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const st = _diffEstado;
    const gs = []; for (const o of st.ops) { const g = gs[gs.length - 1]; if (g && g.t === o[0]) g.l.push(o); else gs.push({ t: o[0], l: [o] }); }
    if (b.dataset.g) { st.abertos.add(+b.dataset.g); return verDiff(st.x, st.abertos); }
    const gi = +(b.dataset.traz ?? b.dataset.troca); const g = gs[gi]; if (!g) return;
    const novas = g.l.map((o) => st.B[o[2]]);
    let ini, qtd = 0;
    if (b.dataset.troca) { const r = gs[gi - 1]; ini = r.l[0][1]; qtd = r.l.length; }
    else { let k = gi + 1; while (k < gs.length && gs[k].t === '+') k++; const prox = gs.slice(gi + 1).flatMap((q) => q.l).find((o) => o[1] >= 0); ini = prox ? prox[1] : st.A.length; }
    const A2 = st.A.slice(); A2.splice(ini, qtd, ...novas);
    aplicarTexto(st.x.ia, A2.join('\n'));
    feitos.add('dif|' + st.x.k);
    await posEdicao(); renderCmp();
    toast(`💉 ${novas.length} linha(s) trazidas para o A (linha ${ini + 1}).`);
    verDiff(st.x);
  };
}
function pkgsDoProjeto() {
  return P.arquivos.map((a, i) => [a, i]).filter(([a]) => /(^|\/)package\.json$/.test(a.caminho) && !/node_modules\//.test(a.caminho));
}
function coletarDeps() {
  const deps = new Map(), pacotes = [];
  for (const [a, i] of pkgsDoProjeto()) {
    let j; try { j = JSON.parse(txt(a)); } catch (e) { pacotes.push({ arquivo: a.caminho, i, erro: 'package.json com erro de escrita: ' + e.message }); continue; }
    pacotes.push({ arquivo: a.caminho, i, nome: j.name || '(sem nome)', scripts: j.scripts || {}, workspaces: j.workspaces });
    for (const [campo, tipo] of [['dependencies', 'dep'], ['devDependencies', 'dev'], ['peerDependencies', 'peer'], ['optionalDependencies', 'opc']]) {
      for (const [nome, ver] of Object.entries(j[campo] || {})) {
        if (!deps.has(nome)) deps.set(nome, { nome, usos: [] });
        deps.get(nome).usos.push({ arquivo: a.caminho, i, versao: String(ver), tipo });
      }
    }
  }
  return { deps, pacotes };
}
function explicar(nome) {
  if (DIC[nome]) return { tipo: DIC[nome][0], txt: DIC[nome][1], fonte: 'dic' };
  if (DIC_IA[nome]) return { tipo: DIC_IA[nome].tipo || 'app', txt: DIC_IA[nome].txt, fonte: 'ia' };
  if (/^@types\//.test(nome)) return { tipo: 'tipos', txt: 'Tipos para o TypeScript (só para montar — pode ir para devDependencies)', fonte: 'regra' };
  if (/^@workspace\//.test(nome)) return { tipo: 'app', txt: '⚠️ Pacote interno do monorepo da Replit — a pasta dele precisa vir junto', fonte: 'regra' };
  if (/^@replit\//.test(nome)) return { tipo: 'montar', txt: '⚠️ Pacote da Replit — remova fora da Replit', fonte: 'regra' };
  if (/^@radix-ui\//.test(nome)) return { tipo: 'app', txt: 'Peça pronta de tela (Radix: menus, janelas, abas…)', fonte: 'regra' };
  if (/eslint|prettier/.test(nome)) return { tipo: 'montar', txt: 'Verificação/arrumação do código (só para montar)', fonte: 'regra' };
  if (/vite-plugin|^@vitejs\/|rollup-plugin|babel-plugin|^@babel\//.test(nome)) return { tipo: 'montar', txt: 'Plugin de montagem (só para montar)', fonte: 'regra' };
  if (/^@tiptap\//.test(nome)) return { tipo: 'app', txt: 'Editor de texto rico (TipTap)', fonte: 'regra' };
  const n = NPM.get(nome);
  if (n && n.descricao) return { tipo: '?', txt: '🇺🇸 ' + n.descricao, fonte: 'npm' };
  return { tipo: '?', txt: '', fonte: '' };
}
function casaUm(p, v) {
  const m = /^(\^|~|>=|<=|>|<|=)?\s*v?(\d+|x|\*)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?/i.exec(p); if (!m) return true;
  const op = m[1] || '', n = (x) => (x === undefined || x === 'x' || x === 'X' || x === '*') ? null : +x;
  const A = n(m[2]), B = n(m[3]), C = n(m[4]), vv = numV(v), c = cmpV(vv, [A ?? 0, B ?? 0, C ?? 0]);
  if (op === '^') { if (A !== null && vv[0] !== A) return false; if (A === 0 && B !== null && vv[1] !== B) return false; return c >= 0; }
  if (op === '~') { if (A !== null && vv[0] !== A) return false; if (B !== null && vv[1] !== B) return false; return c >= 0; }
  if (op === '>=') return c >= 0; if (op === '>') return c > 0; if (op === '<=') return c <= 0; if (op === '<') return c < 0;
  if (A !== null && vv[0] !== A) return false; if (B !== null && vv[1] !== B) return false; if (C !== null && vv[2] !== C) return false; return true;
}
function versaoExiste(range, versoes) {
  range = String(range || '').trim();
  if (!range || /^(\*|latest|next|x)$/i.test(range)) return true;
  if (/^(file:|link:|workspace:|git|github:|https?:|npm:|catalog:)/.test(range) || /\//.test(range)) return null;
  const est = versoes.filter((v) => !/-/.test(v));
  return range.split('||').some((r) => { const partes = r.trim().replace(/\s+-\s+/, ' ').split(/\s+(?=[<>=^~\d])/).filter(Boolean); return (est.length ? est : versoes).some((v) => partes.every((p) => casaUm(p, v))); });
}
async function npmInfo(nome) {
  if (NPM.has(nome) && NPM.get(nome).estado !== 'erro') return NPM.get(nome);
  const r = { estado: 'ok', versoes: [] };
  try {
    const a = await fetch('https://registry.npmjs.org/' + nomeUrl(nome), { headers: { Accept: 'application/vnd.npm.install-v1+json' } });
    if (a.status === 404) { r.estado = 'naoexiste'; NPM.set(nome, r); return r; }
    if (!a.ok) throw new Error('npm respondeu ' + a.status);
    const j = await a.json();
    r.versoes = Object.keys(j.versions || {});
    r.ultima = (j['dist-tags'] || {}).latest || r.versoes[r.versoes.length - 1];
    const vl = (j.versions || {})[r.ultima] || {};
    if (vl.deprecated) r.depreciado = String(vl.deprecated);
    try { const b = await fetch('https://registry.npmjs.org/' + nomeUrl(nome) + '/latest'); if (b.ok) { const k = await b.json(); r.descricao = k.description || ''; r.licenca = typeof k.license === 'string' ? k.license : ''; r.home = k.homepage || ''; if (k.deprecated) r.depreciado = String(k.deprecated); } } catch {}
  } catch (e) { r.estado = 'erro'; r.erro = e.message; }
  NPM.set(nome, r);
  return r;
}
function usoNoCodigo(nome, pacotes) {
  if (/^@types\//.test(nome)) return true;
  for (const p of pacotes) for (const s of Object.values(p.scripts || {})) if (String(s).includes(nome.split('/').pop())) return true;
  const re = new RegExp('[\'"`]' + nome.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '(?:/[^\'"`]*)?[\'"`]');
  for (const [a] of analisaveis()) {
    if (!/^(js|mjs|cjs|jsx|ts|tsx|vue|svelte|html?|json)$/.test(a.ext) || /(^|\/)package(-lock)?\.json$/.test(a.caminho)) continue;
    if (re.test(txt(a))) return true;
  }
  return false;
}
function avaliar(d, pacotes, temCodigo) {
  const e = explicar(d.nome), n = NPM.get(d.nome), alertas = [];
  if (n && n.estado === 'naoexiste') alertas.push(['alta', 'Não existe no npm — nome errado ou inventado. O npm install vai FALHAR. Tire do package.json (ou corrija o nome).']);
  if (n && n.estado === 'ok') {
    for (const u of d.usos) { const ok = versaoExiste(u.versao, n.versoes); if (ok === false) alertas.push(['alta', `A versão pedida (${u.versao}) não existe — a mais nova é ${n.ultima}. O npm install vai FALHAR. Troque por ^${n.ultima}.`]); }
    if (n.depreciado) alertas.push(['media', 'Abandonada pelo autor: ' + n.depreciado]);
  }
  const vs = [...new Set(d.usos.map((u) => u.versao))];
  if (vs.length > 1) alertas.push(['media', 'Pedida com versões diferentes em package.json diferentes: ' + vs.join(' · ')]);
  if ((e.tipo === 'tipos' || e.tipo === 'montar') && d.usos.some((u) => u.tipo === 'dep')) alertas.push(['info', 'Só serve para montar — pode ir para devDependencies (não pesa no app).']);
  const usada = temCodigo ? usoNoCodigo(d.nome, pacotes) : true;
  if (!usada && e.tipo !== 'montar' && e.tipo !== 'tipos') alertas.push(['media', 'Não achei uso no código (nenhum import/require). Pode ser sobra — talvez dê para tirar.']);
  return { e, n, alertas, usada };
}
