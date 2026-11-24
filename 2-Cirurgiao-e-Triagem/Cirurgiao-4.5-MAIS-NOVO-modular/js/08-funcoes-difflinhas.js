'use strict';
/* diferença linha a linha (prefixo/sufixo + âncoras únicas + LCS) */
function diffLinhas(A, B) {
  const ids = new Map(), id = (s) => { let v = ids.get(s); if (v === undefined) { v = ids.size; ids.set(s, v); } return v; };
  const a = A.map(id), b = B.map(id), ops = [];
  function lcs(a0, a1, b0, b1) {
    const n = a1 - a0, m = b1 - b0, L = new Uint32Array((n + 1) * (m + 1)), W = m + 1;
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i * W + j] = a[a0 + i] === b[b0 + j] ? L[(i + 1) * W + j + 1] + 1 : Math.max(L[(i + 1) * W + j], L[i * W + j + 1]);
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[a0 + i] === b[b0 + j]) { ops.push(['=', a0 + i, b0 + j]); i++; j++; }
      else if (L[(i + 1) * W + j] >= L[i * W + j + 1]) { ops.push(['-', a0 + i, -1]); i++; }
      else { ops.push(['+', -1, b0 + j]); j++; }
    }
    for (; i < n; i++) ops.push(['-', a0 + i, -1]);
    for (; j < m; j++) ops.push(['+', -1, b0 + j]);
  }
  function rec(a0, a1, b0, b1) {
    while (a0 < a1 && b0 < b1 && a[a0] === b[b0]) { ops.push(['=', a0, b0]); a0++; b0++; }
    let s = 0; while (a1 - s > a0 && b1 - s > b0 && a[a1 - 1 - s] === b[b1 - 1 - s]) s++;
    const fim = []; for (let k = s; k > 0; k--) fim.push(['=', a1 - k, b1 - k]);
    a1 -= s; b1 -= s;
    if (a0 === a1) for (let j = b0; j < b1; j++) ops.push(['+', -1, j]);
    else if (b0 === b1) for (let i = a0; i < a1; i++) ops.push(['-', i, -1]);
    else if ((a1 - a0) * (b1 - b0) <= 3e6) lcs(a0, a1, b0, b1);
    else {
      const cA = new Map(), cB = new Map(), pB = new Map();
      for (let i = a0; i < a1; i++) cA.set(a[i], (cA.get(a[i]) || 0) + 1);
      for (let j = b0; j < b1; j++) { cB.set(b[j], (cB.get(b[j]) || 0) + 1); pB.set(b[j], j); }
      const pares = [];
      for (let i = a0; i < a1; i++) if (cA.get(a[i]) === 1 && cB.get(a[i]) === 1) pares.push([i, pB.get(a[i])]);
      // maior subsequência crescente pelos índices de B
      const pil = [], ant = new Array(pares.length);
      pares.forEach((p, k) => { let lo = 0, hi = pil.length; while (lo < hi) { const md = (lo + hi) >> 1; if (pares[pil[md]][1] < p[1]) lo = md + 1; else hi = md; } ant[k] = lo ? pil[lo - 1] : -1; pil[lo] = k; });
      const anc = []; for (let k = pil.length ? pil[pil.length - 1] : -1; k >= 0; k = ant[k]) anc.unshift(pares[k]);
      if (!anc.length) { for (let i = a0; i < a1; i++) ops.push(['-', i, -1]); for (let j = b0; j < b1; j++) ops.push(['+', -1, j]); }
      else { let pa = a0, pb = b0; for (const [i, j] of anc) { rec(pa, i, pb, j); ops.push(['=', i, j]); pa = i + 1; pb = j + 1; } rec(pa, a1, pb, b1); }
    }
    ops.push(...fim);
  }
  rec(0, a.length, 0, b.length);
  return ops;
}
function contarDiff(ops) { let mais = 0, menos = 0; for (const o of ops) { if (o[0] === '+') mais++; else if (o[0] === '-') menos++; } return { mais, menos }; }
async function comparar() {
  if (!PB || !P.arquivos.length) return;
  const b = $('#bComparar'); b.disabled = true; b.innerHTML = '<span class="spin"></span> Comparando…';
  try {
    await pausa();
    const rA = rotasDe(P), rB = rotasDe(PB), fA = funcoesDe(P), fB = funcoesDe(PB);
    const raizA = raizDe(P.arquivos), raizB = raizDe(PB.arquivos);
    const mA = new Map(P.arquivos.map((a, i) => [chaveDe(a, raizA), i])), mB = new Map(PB.arquivos.map((a, i) => [chaveDe(a, raizB), i]));
    const rotas = [...rB.values()].filter((r) => !rA.has(r.k)).map((r) => { const t = txt(PB.arquivos[r.i]); const bl = r.tipo === 'rota' ? blocoRota(t, r.pos) : blocoTela(t, r.pos); return { ...r, bloco: bl?.texto || textoLinha(PB.arquivos[r.i], linhaDe(PB.arquivos[r.i], r.pos)), n: linhaDe(PB.arquivos[r.i], r.pos) }; });
    const funcs = [...fB.values()].filter((f) => !fA.has(f.k)).map((f) => { const t = txt(PB.arquivos[f.i]); const bl = blocoFuncao(t, f.pos, f.seta); return { ...f, bloco: bl?.texto || textoLinha(PB.arquivos[f.i], linhaDe(PB.arquivos[f.i], f.pos)), n: linhaDe(PB.arquivos[f.i], f.pos) }; });
    const soB = [], soA = [], dif = []; let iguais = 0, ignB = 0;
    for (const [k, ib] of mB) {
      const aB = PB.arquivos[ib];
      if (!mA.has(k)) { if (ignoradoPor(aB) === 'pasta') ignB++; else soB.push({ k, ib }); continue; }
      const aA = P.arquivos[mA.get(k)];
      if (aA.bin || aB.bin) { if (aA.tam !== aB.tam || crc32(dadosAtuais(aA)) !== crc32(aB.dados)) dif.push({ k, ia: mA.get(k), ib, bin: true }); else iguais++; continue; }
      if (ignoradoPor(aA) === 'pasta') continue;
      if (txt(aA).replace(/\r\n/g, '\n') === txt(aB).replace(/\r\n/g, '\n')) { iguais++; continue; }
      dif.push({ k, ia: mA.get(k), ib });
    }
    for (const [k, ia] of mA) if (!mB.has(k) && ignoradoPor(P.arquivos[ia]) !== 'pasta') soA.push({ k, ia });
    // dois arquivos soltos com nomes diferentes: compara um com o outro
    const txA = P.arquivos.filter((a) => !a.bin), txB = PB.arquivos.filter((a) => !a.bin);
    if (txA.length === 1 && txB.length === 1 && !dif.length && soB.length === 1 && soA.length === 1) { dif.push({ k: soA[0].k + ' ⇄ ' + soB[0].k, ia: soA[0].ia, ib: soB[0].ib }); soA.length = 0; soB.length = 0; }
    let t0 = performance.now();
    for (const d of dif) { if (d.bin) continue; Object.assign(d, contarDiff(diffLinhas(linhasDe(txt(P.arquivos[d.ia])), linhasDe(txt(PB.arquivos[d.ib]))))); if (performance.now() - t0 > 60) { await pausa(); t0 = performance.now(); } }
    CMP = { rotas, funcs, soB, soA, dif, iguais, ignB, nRotasA: rA.size, nRotasB: rB.size };
    feitos.clear();
    if (!rotas.length && (funcs.length || dif.length || soB.length)) cmpAba = funcs.length ? 'funcs' : dif.length ? 'dif' : 'soB'; else cmpAba = 'rotas';
    renderCmp();
  } catch (e) { alert('Erro ao comparar: ' + e.message); console.error(e); }
  finally { b.disabled = false; b.innerHTML = '🔀 Comparar A × B'; }
}
function renderCmp() {
  if (!CMP) return;
  $('#cmpRes').hidden = false;
  $('#cmpTit').textContent = `🔀 A × B — rotas: A tem ${fmtN(CMP.nRotasA)}, B tem ${fmtN(CMP.nRotasB)}`;
  $('#cmpChips').innerHTML = ABAS_CMP.map(([k, n]) => `<button class="chip ${cmpAba === k ? 'on' : ''}" data-c="${k}">${n} (${fmtN(CMP[k].length)})</button>`).join('');
  const q = $('#cmpFiltro').value.trim().toLowerCase();
  const l = CMP[cmpAba].map((x, idx) => [x, idx]).filter(([x]) => !q || (x.k + ' ' + (x.chave || '') + ' ' + (x.bloco || '')).toLowerCase().includes(q));
  const pend = (x) => !feitos.has(cmpAba + '|' + x.k);
  let dica = '', h = '';
  if (cmpAba === 'rotas' || cmpAba === 'funcs') {
    dica = cmpAba === 'rotas' ? 'Rotas do servidor (app.get/post…) e telas (<Route path>) que existem no B e não no A. 💉 Transplantar coloca o bloco no MESMO arquivo do A (logo depois da última rota dele) e traz junto os import que faltarem.' : 'Funções do B cujo nome não existe em nenhum lugar do A. Algumas podem só ter sido renomeadas — confira antes.';
    const pendentes = l.filter(([x]) => pend(x)).length;
    if (pendentes > 1) h += `<button class="pri" id="bTransTodas">💉 Transplantar todas as ${fmtN(pendentes)}${q ? ' (filtradas)' : ''}</button>`;
    h += l.map(([x, idx]) => {
      const ok = !pend(x), alvo = alvoNoA(x.chave);
      return `<div class="ri ${ok ? 's-info' : 's-alta'}" data-idx="${idx}"><div class="rh"><b>${esc(x.k)}</b> · no B: ${esc(x.chave)}, linha ${fmtN(x.n)}</div><div class="small">${ok ? '✅ já transplantado' : alvo >= 0 ? '➡️ vai para o mesmo arquivo no A: ' + esc(P.arquivos[alvo].caminho) : '⚠️ esse arquivo não existe no A — você escolhe onde colocar'}</div><details onclick="event.stopPropagation()"><summary class="small">ver código (${fmtN(x.bloco.split('\n').length)} linhas)</summary><pre>${esc(x.bloco)}</pre></details><button class="peq" data-ac="verB">👁 Abrir no B</button>${ok ? '' : '<button class="peq ok" data-ac="trans">💉 Transplantar</button>'}</div>`;
    }).join('');
  } else if (cmpAba === 'soB') {
    dica = 'Arquivos que existem no B e não no A (pode ser justamente o que sumiu).' + (CMP.ignB ? ` ${fmtN(CMP.ignB)} arquivo(s) em node_modules/.git não entram na conta.` : '');
    const pendentes = l.filter(([x]) => pend(x)).length;
    if (pendentes > 1) h += `<button class="pri" id="bCopiarTodos">➕ Copiar todos os ${fmtN(pendentes)} para o A</button>`;
    h += l.map(([x, idx]) => { const aB = PB.arquivos[x.ib], ok = !pend(x); return `<div class="ri ${ok ? 's-info' : 's-media'}" data-idx="${idx}"><div class="rh"><b>${esc(x.k)}</b> · ${fmtB(aB.tam)}${aB.bin ? ' · binário' : ' · ' + fmtN(nLinhas(aB)) + ' linhas'}</div>${ok ? '<div class="small">✅ copiado para o A</div>' : ''}${aB.bin ? '' : '<button class="peq" data-ac="verArqB">👁 Ver</button>'}${ok ? '' : '<button class="peq ok" data-ac="copiar">➕ Copiar para o A</button>'}</div>`; }).join('');
  } else if (cmpAba === 'dif') {
    dica = `Mesmo caminho nos dois, conteúdo diferente. Toque para ver linha a linha: 🟩 = só no B, 🟥 = só no A. Iguais: ${fmtN(CMP.iguais)} arquivo(s).`;
    h += l.map(([x, idx]) => `<div class="ri s-media" data-idx="${idx}" data-ac="diff"><div class="rh"><b>${esc(x.k)}</b></div><div class="small">${x.bin ? 'binário diferente' : `🟩 ${fmtN(x.mais)} linha(s) só no B · 🟥 ${fmtN(x.menos)} só no A`}${feitos.has('dif|' + x.k) ? ' · ✅ mexido' : ''}</div>${x.bin ? '' : '<button class="peq" data-ac="diff">🔍 Ver diferenças</button>'}<button class="peq" data-ac="usarB">⬅ Usar o arquivo do B inteiro</button></div>`).join('');
  } else {
    dica = 'Arquivos que só o A tem (novos na versão A, ou que o B não tinha). Só para conferência.';
    h += l.map(([x]) => `<div class="ri s-info" data-a="${x.ia}"><div class="rh"><b>${esc(x.k)}</b></div></div>`).join('');
  }
  $('#cmpDica').textContent = dica;
  $('#cmpLista').innerHTML = h || '<div class="bom">Nada aqui. 👍</div>';
  $('#bTransTodas')?.addEventListener('click', () => transplantarVarios(l.map(([x]) => x).filter(pend)));
  $('#bCopiarTodos')?.addEventListener('click', async () => { const xs = l.map(([x]) => x).filter(pend); if (!confirm(`Copiar ${xs.length} arquivo(s) do B para o A?`)) return; for (const x of xs) copiarDoB(x); await posEdicao(); renderCmp(); toast(`➕ ${xs.length} arquivo(s) copiados.`); });
}
function alvoNoA(chave) { const r = raizDe(P.arquivos); return P.arquivos.findIndex((a) => chaveDe(a, r) === chave); }
function copiarDoB(x) {
  const aB = PB.arquivos[x.ib];
  const nv = novoArquivo(raizDe(P.arquivos) + x.k, aB.dados);
  nv.novo = true; nv.editado = true; nv.original = ''; if (!nv.bin) nv.texto = txt(aB);
  P.arquivos.push(nv); P.arquivos.sort((p, q) => p.caminho.localeCompare(q.caminho));
  feitos.add('soB|' + x.k);
}
function escolherAlvo(x) {
  return new Promise((ok) => {
    const opcoes = P.arquivos.map((a, i) => [a, i]).filter(([a]) => !a.bin && ARQ_CODIGO.test(a.ext) && !ignoradoPor(a));
    modal('Onde colocar ' + x.k + '?', `<div class="small">No B ele está em <b>${esc(x.chave)}</b>, que não existe no A.</div><label>Colocar dentro de:</label><select id="alvoSel"><option value="novo">➕ Criar ${esc(raizDe(P.arquivos) + x.chave)} no A</option>${opcoes.map(([a, i]) => `<option value="${i}">${esc(a.caminho)}</option>`).join('')}</select>`, [['OK', () => { const v = $('#alvoSel').value; _aoFechar = null; fecharModal(); ok(v); }, 'pri']]);
    _aoFechar = () => ok('pular');
  });
}
async function transplantarVarios(xs) {
  if (!xs.length) return;
  if (xs.length > 1 && !confirm(`Transplantar ${xs.length} bloco(s) do B para o A?\n\nCada arquivo do A que mudar guarda o original (↩ Desfazer). Depois rode ✅ Sintaxe.`)) return;
  const relato = [];
  for (const x of xs) {
    let ai = alvoNoA(x.chave);
    if (ai < 0) {
      const v = await escolherAlvo(x);
      if (v === 'pular') continue;
      if (v === 'novo') { const nv = novoArquivo(raizDe(P.arquivos) + x.chave, new Uint8Array()); nv.novo = true; nv.editado = true; nv.original = ''; nv.texto = ''; P.arquivos.push(nv); P.arquivos.sort((p, q) => p.caminho.localeCompare(q.caminho)); ai = P.arquivos.indexOf(nv); }
      else ai = +v;
    }
    relato.push(inserirNoA(ai, x));
    feitos.add(cmpAba + '|' + x.k);
  }
  if (!relato.length) return;
  await posEdicao();
  renderCmp();
  const texto = relato.map((r) => `✅ ${r.k}\n   entrou em ${r.caminho}, linha ${r.linha}${r.imports.length ? '\n   import adicionados:\n     ' + r.imports.join('\n     ') : ''}${r.ajudantes.length ? '\n   ⚠️ usa também (não existe no A — transplante junto): ' + r.ajudantes.join(', ') : ''}`).join('\n\n');
  modalTexto(`💉 ${relato.length} transplante(s) feito(s)`, texto + '\n\nPróximo passo: 🔎 Detectar → ✅ Sintaxe e 📎 Referências, depois ⬇️ .zip.', relato.length === 1 ? [['↪ Abrir no lugar', () => { fecharModal(); abrirArquivo(relato[0].ai, relato[0].linha); }]] : []);
}
