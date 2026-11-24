'use strict';
function medir() {
  const el = $('#medidor'); const c = iaCfg();
  const perg = $('#iaPerg').value;
  let ctx = [], erro = '';
  const anexa = !conv.length || false;
  try { if (anexa) ctx = contexto(); } catch (e) { erro = e.message; }
  const chars = ctx.reduce((s, x) => s + x.length, 0) + perg.length + SISTEMA.length + (conv.length ? conv.reduce((s, m) => s + m.content.length, 0) : 0);
  const tin = tokensDe(chars);
  const partes = anexa && ctx.length ? partesEnvio(perg, ctx).length : 1;
  const custoIn = (tin + (partes - 1) * tokensDe(perg.length + SISTEMA.length)) / 1e6 * c.pin;
  const custoOut = (c.maxOut * partes) / 1e6 * c.pout;
  const mes = gastoMes();
  let h = '';
  if (erro) h += `<div class="aviso">${esc(erro)}</div>`;
  h += `Vai enviar: <b>${fmtN(chars)}</b> caracteres ≈ <b>${fmtN(tin)}</b> tokens${conv.length ? ' (inclui a conversa até aqui; o código já foi na 1ª mensagem)' : ''}.<br>`;
  h += `Janela do modelo: ${fmtN(c.janela)} tokens → ${tin + c.maxOut <= c.janela ? '✅ cabe' : `⚠️ não cabe de uma vez — vai em <b>${partes} partes</b> (uma resposta por parte)`}.<br>`;
  h += `Custo estimado: entrada ≈ <b>${usd(custoIn)}</b> + resposta até <b>${usd(custoOut)}</b> = até <b>${usd(custoIn + custoOut)}</b>.<br>`;
  h += `<span class="small">Gasto deste mês: ${usd(mes)}${CFG.gastoLimite ? ' de ' + usd(CFG.gastoLimite) : ''}. Estimativa: 1 token ≈ 3,5 caracteres; o valor real (contado pelo provedor) aparece depois de cada resposta.</span>`;
  el.innerHTML = h;
  el._est = { tin, custo: custoIn + custoOut, partes };
}
function gastoMes() { const m = new Date().toISOString().slice(0, 7); return gasto.filter((g) => g.data.startsWith(m)).reduce((s, g) => s + g.usd, 0); }
async function chamarIA(msgs, maxOut, sinal) {
  const c = iaCfg(), p = PROV[c.prov], chave = $('#iaChave').value.trim();
  if (!chave) throw new Error('Cole sua chave da IA.');
  if (!c.base) throw new Error('Preencha o endereço (base) do provedor.');
  if (!c.modelo) throw new Error('Preencha o nome do modelo.');
  let r, j;
  if (p.tipo === 'gemini') {
    r = await fetch(`${c.base}/models/${encodeURIComponent(c.modelo)}:generateContent`, { method: 'POST', signal: sinal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SISTEMA }] }, contents: msgs.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: maxOut, temperature: 0.3 } }) });
    j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error?.message || 'Erro ' + r.status);
    const cand = j.candidates?.[0];
    const texto = (cand?.content?.parts || []).map((x) => x.text || '').join('');
    if (!texto && cand?.finishReason) throw new Error('A IA não respondeu (motivo: ' + cand.finishReason + ').');
    return { texto, cortado: cand?.finishReason === 'MAX_TOKENS', tin: j.usageMetadata?.promptTokenCount, tout: (j.usageMetadata?.candidatesTokenCount || 0) + (j.usageMetadata?.thoughtsTokenCount || 0) };
  }
  if (p.tipo === 'anthropic') {
    r = await fetch(`${c.base}/messages`, { method: 'POST', signal: sinal, headers: { 'Content-Type': 'application/json', 'x-api-key': chave, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: c.modelo, max_tokens: maxOut, system: SISTEMA, messages: msgs }) });
    j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error?.message || 'Erro ' + r.status);
    return { texto: (j.content || []).filter((x) => x.type === 'text').map((x) => x.text).join(''), cortado: j.stop_reason === 'max_tokens', tin: j.usage?.input_tokens, tout: j.usage?.output_tokens };
  }
  r = await fetch(`${c.base}/chat/completions`, { method: 'POST', signal: sinal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + chave },
    body: JSON.stringify({ model: c.modelo, messages: [{ role: 'system', content: SISTEMA }, ...msgs], max_tokens: maxOut, temperature: 0.3 }) });
  j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || j.message || 'Erro ' + r.status);
  const ch = j.choices?.[0];
  return { texto: ch?.message?.content || '', cortado: ch?.finish_reason === 'length', tin: j.usage?.prompt_tokens, tout: j.usage?.completion_tokens };
}
async function registrarGasto(res, charsIn) {
  const c = iaCfg();
  const tin = res.tin ?? tokensDe(charsIn), tout = res.tout ?? tokensDe(res.texto.length);
  const v = tin / 1e6 * c.pin + tout / 1e6 * c.pout;
  gasto.push({ data: new Date().toISOString(), prov: PROV[c.prov].nome, modelo: c.modelo, tin, tout, usd: v, real: res.tin != null });
  await DB.set('gasto', gasto);
  renderGasto();
  return { tin, tout, usd: v, real: res.tin != null };
}
async function enviar(continuar) {
  const c = iaCfg();
  let perg = continuar ? 'Continue EXATAMENTE de onde parou, sem repetir nada do que já escreveu e sem resumir.' : $('#iaPerg').value.trim();
  if (!perg) return alert('Escreva a pergunta.');
  let ctx = [];
  if (!conv.length && !continuar) { try { ctx = contexto(); } catch (e) { return alert(e.message); } }
  medir();
  const est = $('#medidor')._est || { custo: 0, partes: 1 };
  if (CFG.gastoLimite && gastoMes() + est.custo > CFG.gastoLimite && !confirm(`Este envio pode passar do seu limite do mês (${usd(CFG.gastoLimite)}). Enviar mesmo assim?`)) return;
  if (CFG.gastoAviso && est.custo > CFG.gastoAviso && !confirm(`Este envio pode custar até ${usd(est.custo)}${est.partes > 1 ? ` (${est.partes} partes)` : ''}. Continuar?`)) return;
  guardarIA();
  abortador = new AbortController();
  $('#bEnviar').disabled = true; $('#bParar').hidden = false; $('#bContinuar').hidden = true;
  const partes = ctx.length ? partesEnvio(perg, ctx) : [''];
  try {
    for (let k = 0; k < partes.length; k++) {
      const conteudo = partes[k] ? (partes.length > 1 ? `${perg}\n\n[PARTE ${k + 1} DE ${partes.length} do código. Responda só sobre esta parte.]\n\n${partes[k]}` : `${perg}\n\n${partes[k]}`) : perg;
      const msgs = partes.length > 1 ? [{ role: 'user', content: conteudo }] : [...conv, { role: 'user', content: conteudo }];
      addMsg('u', partes.length > 1 ? `${perg}\n\n📎 parte ${k + 1}/${partes.length} (${fmtN(partes[k].length)} caracteres de código)` : (partes[k] ? `${perg}\n\n📎 + ${fmtN(partes[k].length)} caracteres de código (${$('#iaCtx').selectedOptions[0].text})` : perg));
      const espera = addMsg('a', '⏳ Esperando resposta…');
      const charsIn = msgs.reduce((s, m) => s + m.content.length, 0) + SISTEMA.length;
      const res = await chamarIA(msgs, c.maxOut, abortador.signal);
      const g = await registrarGasto(res, charsIn);
      const meta = `${PROV[c.prov].nome} · ${c.modelo} · entrada ${fmtN(g.tin)} + saída ${fmtN(g.tout)} tokens${g.real ? '' : ' (estimado)'} · ${usd(g.usd)}${res.cortado ? ' · ⚠️ CORTADA pelo limite de tamanho' : ''}`;
      preencherMsg(espera, res.texto, meta);
      if (partes.length === 1) { conv = msgs.concat([{ role: 'assistant', content: res.texto }]); }
      ultimoCortado = res.cortado;
      historico.unshift({ id: Date.now() + k, data: agora(), prov: PROV[c.prov].nome, modelo: c.modelo, arquivo: atual >= 0 ? P.arquivos[atual]?.caminho : '', ctx: $('#iaCtx').selectedOptions[0].text, pergunta: perg + (partes.length > 1 ? ` [parte ${k + 1}/${partes.length}]` : ''), resposta: res.texto, tin: g.tin, tout: g.tout, usd: g.usd });
      await DB.set('historico', historico); renderHist();
    }
    if (!continuar) $('#iaPerg').value = '';
    $('#bContinuar').hidden = !ultimoCortado || partes.length > 1;
  } catch (e) {
    const ult = $('#conversa').lastElementChild;
    const msg = e.name === 'AbortError' ? '⏹ Parado por você.' : '❌ ' + e.message + (/fetch|network/i.test(e.message) ? '\n\n(Sem internet, ou este provedor bloqueia chamadas direto do navegador.)' : '\n\nConfira a chave, o nome do modelo e se há créditos.');
    if (ult && ult.classList.contains('a')) preencherMsg(ult, msg, 'erro'); else addMsg('a', msg);
  } finally {
    $('#bEnviar').disabled = false; $('#bParar').hidden = true; abortador = null;
    $('#convInfo').textContent = conv.length ? `Conversa com ${conv.length / 2} troca(s). As próximas perguntas continuam esta conversa (o código não é reenviado). Toque em 🧹 para começar outra.` : '';
    medir();
  }
}
function addMsg(quem, texto) { const d = document.createElement('div'); d.className = 'msg ' + quem; d.textContent = texto; $('#conversa').appendChild(d); d.scrollIntoView({ block: 'nearest' }); return d; }
function preencherMsg(el, texto, meta) {
  el.innerHTML = `<div class="meta">${esc(meta)}</div>`;
  const re = /```([\w.+-]*)[^\n]*\n([\s\S]*?)(?:```|$)/g; let ult = 0, m, k = 0;
  const add = (t) => { if (t) el.appendChild(document.createTextNode(t)); };
  while ((m = re.exec(texto))) {
    add(texto.substring(ult, m.index));
    const codigo = m[2], lingua = m[1] || 'código';
    const b = document.createElement('div'); b.className = 'bloco';
    b.innerHTML = `<div class="bh"><span>${esc(lingua)} · ${fmtN(codigo.split('\n').length)} linhas</span><button class="peq" data-x="c">📋 Copiar</button><button class="peq" data-x="b">⬇️ Baixar</button>${atual >= 0 && !P.arquivos[atual]?.bin ? '<button class="peq" data-x="s">🩹 Substituir o arquivo aberto</button>' : ''}</div><pre></pre>`;
    b.querySelector('pre').textContent = codigo;
    b.addEventListener('click', async (e) => {
      const x = e.target.dataset.x; if (!x) return;
      if (x === 'c') copiar(codigo);
      if (x === 'b') baixar(codigo, `resposta-${++k}.${lingua.match(/^[a-z]+$/) ? lingua : 'txt'}`);
      if (x === 's') {
        const a = P.arquivos[atual];
        const ratio = codigo.length / Math.max(1, txt(a).length);
        if (!confirm(`Trocar TODO o conteúdo de “${a.caminho}” por este bloco (${fmtN(codigo.split('\n').length)} linhas)?${ratio < 0.7 ? `\n\n⚠️ ATENÇÃO: o bloco tem só ${Math.round(ratio * 100)}% do tamanho do arquivo atual. A IA pode ter CORTADO partes!` : ''}\n\nO original fica guardado (↩ Desfazer).`)) return;
        aplicarTexto(atual, codigo); await posEdicao(); toast('🩹 Arquivo substituído. Use ✅ Sintaxe para conferir.');
      }
    });
    el.appendChild(b);
    ult = re.lastIndex;
  }
  add(texto.substring(ult));
}

function renderGasto() {
  const mes = gastoMes();
  $('#gastoResumo').innerHTML = `Este mês: <b>${usd(mes)}</b> em ${gasto.filter((g) => g.data.startsWith(new Date().toISOString().slice(0, 7))).length} envio(s). Total geral: ${usd(gasto.reduce((s, g) => s + g.usd, 0))}.${CFG.gastoLimite && mes > CFG.gastoLimite ? ' <span style="color:var(--verm)">⚠️ acima do limite</span>' : ''}`;
  $('#gastoLista').innerHTML = gasto.slice().reverse().map((g) => `<div class="small">${new Date(g.data).toLocaleString('pt-BR')} · ${esc(g.prov)} ${esc(g.modelo)} · ${fmtN(g.tin)}+${fmtN(g.tout)} tokens${g.real ? '' : ' (est.)'} · ${usd(g.usd)}</div>`).join('') || '<div class="small">Nenhum envio ainda.</div>';
}

/* ── Notas ──────────────────────────────────────────────────────────── */
function novaNota(caminho, linha, texto) {
  modal('📌 Nota de triagem', `<div class="small">${caminho ? esc(caminho) + (linha ? ' · linha ' + linha : '') : 'Nota geral'}</div><textarea id="notaTxt" rows="10" placeholder="Ex.: linha 234 usa /api/code-assistant da Replit — trocar por chamada direta ao Gemini."></textarea>`, [['💾 Salvar', async () => {
    const t = $('#notaTxt').value.trim(); if (!t) return;
    notas.unshift({ id: Date.now(), caminho, linha, texto: t, data: agora() });
    await DB.set('notas', notas); renderNotas(); fecharModal(); toast('📌 Nota salva.');
  }, 'pri']]);
  $('#notaTxt').value = texto || '';
}
function renderNotas() {
  $('#listaNotas').innerHTML = notas.map((n, i) => `<div class="nota"><div class="t">${esc(n.texto)}</div><div class="meta">${n.caminho ? '📄 ' + esc(n.caminho) + (n.linha ? ' · linha ' + n.linha : '') + ' · ' : ''}${esc(n.data)}</div><div>${n.caminho ? `<button class="peq" data-ir="${i}">↪ Abrir no lugar</button>` : ''}<button class="peq" data-ed="${i}">✏️</button><button class="peq perigo" data-del="${i}">🗑</button></div></div>`).join('') || '<div class="small">Nenhuma nota ainda. No código, toque no número de uma linha → 📌 Nota.</div>';
}

/* ── Histórico ──────────────────────────────────────────────────────── */
function renderHist() {
  const q = $('#histBusca').value.trim().toLowerCase();
  const l = historico.map((h, i) => [h, i]).filter(([h]) => !q || (h.pergunta + ' ' + h.resposta + ' ' + (h.arquivo || '')).toLowerCase().includes(q));
  $('#listaHist').innerHTML = l.map(([h, i]) => `<div class="hist" data-h="${i}" style="cursor:pointer"><div class="t"><b>❓</b> ${esc(h.pergunta.length > 300 ? h.pergunta.substring(0, 300) + '… (toque para ver tudo)' : h.pergunta)}</div><div class="meta">🤖 ${esc(h.prov)} ${esc(h.modelo || '')} · ${esc(h.arquivo || '—')} · ${esc(h.data)}${h.usd != null ? ' · ' + usd(h.usd) : ''} · resposta com ${fmtN(h.resposta.length)} caracteres</div></div>`).join('') || '<div class="small">Nenhuma consulta ainda.</div>';
}

/* ── Projetos guardados / sessão ────────────────────────────────────── */
function pacote() { return { nome: P.nome, data: agora(), arquivos: P.arquivos.map((a) => ({ caminho: a.caminho, dados: a.dados, bin: a.bin, texto: a.editado ? a.texto : null, original: a.original, editado: a.editado, forcar: a.forcar, marcado: a.marcado, erro: a.erro, novo: a.novo })) }; }
function despacotar(p) {
  P = { nome: p.nome, arquivos: p.arquivos.map((x) => ({ caminho: x.caminho, ext: extDe(x.caminho), tam: x.dados.length, dados: x.dados, bin: x.bin, texto: x.texto, original: x.original, editado: x.editado, forcar: x.forcar, marcado: x.marcado, erro: x.erro, novo: x.novo, rep: 0, bug: 0 })) };
  atual = -1; R = null; $('#cardRes').hidden = true;
}
