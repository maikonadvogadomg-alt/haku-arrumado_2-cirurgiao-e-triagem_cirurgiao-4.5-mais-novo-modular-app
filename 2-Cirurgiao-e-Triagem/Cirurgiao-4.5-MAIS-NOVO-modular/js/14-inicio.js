'use strict';
/* ── Abrir / colar / arrastar ───────────────────────────────────────── */
$('#bEscolher').addEventListener('click', () => $('#arquivo').click());
$('#bAbrirTopo').addEventListener('click', () => { ir('arq'); $('#arquivo').click(); });
$('#arquivo').addEventListener('change', (e) => carregarFiles(e.target.files));
$('#bPasta').addEventListener('click', () => $('#pasta').click());
$('#pasta').addEventListener('change', async (e) => { const fs = [...e.target.files]; if (!fs.length) return; const raiz = (fs[0].webkitRelativePath || '').split('/')[0]; await carregarFiles(fs); if (raiz) { P.nome = raiz; renderTudo(); } e.target.value = ''; });
const drop = $('#drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('sobre'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('sobre'); }));
drop.addEventListener('drop', (e) => carregarFiles(e.dataTransfer.files));
drop.addEventListener('click', () => $('#arquivo').click());
$('#bColar').addEventListener('click', () => {
  modal('📋 Colar código', `<label>Nome do arquivo (a extensão ajuda nos exames)</label><input id="colNome" value="codigo-colado.html"><textarea id="colTxt" rows="14" placeholder="Cole aqui — qualquer tamanho"></textarea><div class="small" id="colCont">0 caracteres</div>`, [['✅ Usar', async () => {
    const t = $('#colTxt').value; if (!t.trim()) return alert('Cole algum código.');
    const nome = $('#colNome').value.trim() || 'codigo-colado.txt';
    fecharModal();
    const f = new File([t], nome);
    await carregarFiles([f]);
    abrirArquivo(P.arquivos.findIndex((a) => a.caminho === nome || a.caminho.endsWith('/' + nome)));
  }]]);
  $('#colTxt').addEventListener('input', (e) => ($('#colCont').textContent = fmtN(e.target.value.length) + ' caracteres'));
});
let _aoFechar = null;
$('#mX').addEventListener('click', fecharModal);
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') fecharModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

/* ── IA ─────────────────────────────────────────────────────────────── */
const PROV = {
  groq: { nome: 'Groq', tipo: 'openai', base: 'https://api.groq.com/openai/v1', modelo: 'llama-3.3-70b-versatile', janela: 131072, pin: 0.59, pout: 0.79, prefixo: 'gsk_' },
  gemini: { nome: 'Google Gemini', tipo: 'gemini', base: 'https://generativelanguage.googleapis.com/v1beta', modelo: 'gemini-2.5-flash', janela: 1048576, pin: 0.30, pout: 2.50, prefixo: ['AIza', 'AQ.'] },
  openai: { nome: 'OpenAI', tipo: 'openai', base: 'https://api.openai.com/v1', modelo: 'gpt-4o-mini', janela: 128000, pin: 0.15, pout: 0.60, prefixo: 'sk-' },
  anthropic: { nome: 'Anthropic (Claude)', tipo: 'anthropic', base: 'https://api.anthropic.com/v1', modelo: 'claude-haiku-4-5', janela: 200000, pin: 1, pout: 5, prefixo: 'sk-ant-' },
  openrouter: { nome: 'OpenRouter', tipo: 'openai', base: 'https://openrouter.ai/api/v1', modelo: 'openai/gpt-4o-mini', janela: 128000, pin: 0.15, pout: 0.60, prefixo: 'sk-or-' },
  monica: { nome: 'Monica', tipo: 'openai', base: 'https://openapi.monica.im/v1', modelo: 'gpt-4o-mini', janela: 128000, pin: 0.15, pout: 0.60, prefixo: '' },
  deepseek: { nome: 'DeepSeek', tipo: 'openai', base: 'https://api.deepseek.com/v1', modelo: 'deepseek-chat', janela: 64000, pin: 0.27, pout: 1.10, prefixo: '' },
  xai: { nome: 'xAI (Grok)', tipo: 'openai', base: 'https://api.x.ai/v1', modelo: 'grok-3-mini', janela: 131072, pin: 0.30, pout: 0.50, prefixo: 'xai-' },
  perplexity: { nome: 'Perplexity', tipo: 'openai', base: 'https://api.perplexity.ai', modelo: 'sonar', janela: 127000, pin: 1, pout: 1, prefixo: 'pplx-' },
  outro: { nome: 'Outro (compatível OpenAI)', tipo: 'openai', base: '', modelo: '', janela: 32000, pin: 0, pout: 0, prefixo: '' },
};
$('#iaProv').innerHTML = Object.entries(PROV).map(([k, p]) => `<option value="${k}">${p.nome}</option>`).join('');
$('#iaProv').addEventListener('change', async () => { preencherProv($('#iaProv').value); const k = await DB.get('chave:' + $('#iaProv').value, ''); $('#iaChave').value = k || ''; guardarIA(); });
$('#iaChave').addEventListener('input', () => { const id = detectarProv($('#iaChave').value); if (id && id !== $('#iaProv').value && !(id === 'openai' && ['monica', 'deepseek', 'outro'].includes($('#iaProv').value))) preencherProv(id); });
$('#iaChave').addEventListener('change', guardarIA);
$('#iaLembrar').addEventListener('change', async () => { guardarIA(); if (!$('#iaLembrar').checked) { for (const id of Object.keys(PROV)) await DB.del('chave:' + id); toast('🔒 Chaves apagadas deste aparelho.'); } });
$('#bVerChave').addEventListener('click', () => { const i = $('#iaChave'); i.type = i.type === 'password' ? 'text' : 'password'; });
['#iaModelo', '#iaBase', '#iaJanela', '#iaPIn', '#iaPOut', '#iaMaxOut', '#iaNumerar'].forEach((s) => $(s).addEventListener('change', () => { guardarIA(); medir(); }));
['#iaPerg', '#iaDe', '#iaAte'].forEach((s) => $(s).addEventListener('input', medir));
$('#iaCtx').addEventListener('change', () => { $('#trechoBox').hidden = $('#iaCtx').value !== 'trecho'; if ($('#iaCtx').value === 'trecho' && atual >= 0) $('#iaAte').value = Math.min(+$('#iaAte').value || 200, nLinhas(P.arquivos[atual])); medir(); });
const SISTEMA = 'Você é um especialista em consertar código, ajudando um advogado brasileiro que não é programador e usa principalmente o celular. Responda SEMPRE em português do Brasil, direto e prático. Ao apontar um problema, diga o ARQUIVO e o NÚMERO DA LINHA. Quando entregar código corrigido: entregue o arquivo ou a função COMPLETA, do começo ao fim, sem cortar, sem “...”, sem “resto igual”, sem “// código existente”. Se não couber, diga claramente onde parou para eu pedir a continuação. Não invente funções ou arquivos que não estão no código enviado.';
const PERG = {
  replit: 'Liste TODOS os pontos que dependem da Replit (endereços, rotas /api/, variáveis REPL_/REPLIT_, pacotes @replit/, login, banco, armazenamento). Para cada um diga arquivo e linha e mostre como trocar por alternativa grátis e independente. Depois entregue os trechos/arquivos COMPLETOS já corrigidos.',
  bugs: 'Encontre todos os erros deste código. Para cada um: arquivo, linha, o que causa (em linguagem simples) e a correção. No final entregue o código COMPLETO corrigido, sem cortar nada.',
  explicar: 'Explique o que este código faz, parte por parte, em linguagem simples para quem não é programador. Diga quais partes são as mais importantes e quais parecem quebradas.',
  jur: 'Este é um projeto jurídico. Diga: 1) quais funções jurídicas estão implementadas (processos, prazos, clientes, cálculos…); 2) o que está quebrado ou incompleto; 3) o que depende da Replit ou de serviço pago; 4) como deixar independente, com arquivo e linha de cada mudança.',
};
$$('[data-p]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.p === 'notas') { if (!notas.length) return alert('Nenhuma nota ainda.'); $('#iaCtx').value = 'nada'; $('#iaPerg').value = 'Analise estas notas de triagem do meu código e diga: 1) o problema mais crítico; 2) a ordem de correção; 3) o que dá para corrigir sem a Replit; 4) o que precisa ser refeito do zero.\n\nNOTAS:\n' + notas.map((n, i) => `Nota ${i + 1}${n.caminho ? ` (${n.caminho}${n.linha ? ', linha ' + n.linha : ''})` : ''}:\n${n.texto}`).join('\n\n'); }
  else $('#iaPerg').value = PERG[b.dataset.p];
  medir();
}));
$('#bEnviar').addEventListener('click', () => enviar(false));
$('#bContinuar').addEventListener('click', () => enviar(true));
$('#bParar').addEventListener('click', () => abortador?.abort());
$('#bNovaConv').addEventListener('click', () => { conv = []; ultimoCortado = false; $('#conversa').innerHTML = ''; $('#bContinuar').hidden = true; $('#convInfo').textContent = ''; medir(); });
$('#gastoLimite').addEventListener('change', (e) => { CFG.gastoLimite = +e.target.value || 0; salvarCfg(); renderGasto(); medir(); });
$('#gastoAviso').addEventListener('change', (e) => { CFG.gastoAviso = +e.target.value || 0; salvarCfg(); });
$('#listaNotas').addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.ir) { const n = notas[+b.dataset.ir]; const i = P.arquivos.findIndex((a) => a.caminho === n.caminho); if (i < 0) return alert('Esse arquivo não está no projeto aberto. Abra o projeto dele primeiro.'); abrirArquivo(i, n.linha || 1); }
  if (b.dataset.ed) { const n = notas[+b.dataset.ed]; notas.splice(+b.dataset.ed, 1); novaNota(n.caminho, n.linha, n.texto); }
  if (b.dataset.del && confirm('Apagar esta nota?')) { notas.splice(+b.dataset.del, 1); await DB.set('notas', notas); renderNotas(); }
});
$('#bNovaNota').addEventListener('click', () => novaNota(atual >= 0 ? P.arquivos[atual].caminho : '', selLinha, ''));
$('#bNotasBaixar').addEventListener('click', () => { if (!notas.length) return alert('Nenhuma nota.'); baixar(`=== NOTAS — CIRURGIÃO 4.0 ===\n${agora()}\n\n` + notas.map((n, i) => `${'─'.repeat(50)}\nNota ${i + 1} · ${n.caminho || 'geral'}${n.linha ? ' · linha ' + n.linha : ''} · ${n.data}\n${n.texto}`).join('\n\n'), 'notas-' + Date.now() + '.txt'); });
$('#bNotasIA').addEventListener('click', () => { $('[data-p=notas]').click(); ir('ia'); });
$('#bNotasLimpar').addEventListener('click', async () => { if (!confirm('Apagar TODAS as notas?')) return; notas = []; await DB.set('notas', notas); renderNotas(); });
$('#histBusca').addEventListener('input', renderHist);
$('#listaHist').addEventListener('click', (e) => {
  const d = e.target.closest('[data-h]'); if (!d) return; const h = historico[+d.dataset.h];
  modalTexto(`📜 ${h.data} — ${h.prov}`, `PROVEDOR: ${h.prov} ${h.modelo || ''}\nARQUIVO: ${h.arquivo || '—'}\nCONTEXTO: ${h.ctx || '—'}\nTOKENS: ${fmtN(h.tin)} entrada + ${fmtN(h.tout)} saída · ${usd(h.usd)}\n\nPERGUNTA:\n${h.pergunta}\n\n${'═'.repeat(50)}\n\nRESPOSTA:\n${h.resposta}`, [['🗑 Apagar', async () => { historico.splice(+d.dataset.h, 1); await DB.set('historico', historico); renderHist(); fecharModal(); }, 'perigo']]);
});
$('#bHistBaixar').addEventListener('click', () => { if (!historico.length) return alert('Histórico vazio.'); baixar(`=== HISTÓRICO IA — CIRURGIÃO 4.0 ===\n${agora()}\n\n` + historico.map((h, i) => `${'═'.repeat(60)}\nConsulta ${i + 1} · ${h.prov} ${h.modelo || ''} · ${h.data}\nArquivo: ${h.arquivo || '—'} · ${usd(h.usd)}\n\nPERGUNTA:\n${h.pergunta}\n\nRESPOSTA:\n${h.resposta}`).join('\n\n'), 'historico-ia-' + Date.now() + '.txt'); });
$('#bHistLimpar').addEventListener('click', async () => { if (!confirm('Apagar TODO o histórico da IA?')) return; historico = []; await DB.set('historico', historico); renderHist(); });
let _sessT;
$('#bGuardar').addEventListener('click', async () => {
  if (!P.arquivos.length) return;
  const nome = prompt('Nome para guardar:', P.nome); if (!nome) return;
  const id = 'p' + Date.now();
  try {
    await DB.set('proj:' + id, { ...pacote(), nome });
    const l = await DB.get('projetos', []);
    l.unshift({ id, nome, data: agora(), n: P.arquivos.length, tam: P.arquivos.reduce((s, a) => s + a.tam, 0), edit: P.arquivos.filter((a) => a.editado).length });
    await DB.set('projetos', l); renderMem(); toast('💾 Guardado: ' + esc(nome));
  } catch (e) { alert('Não coube na memória do navegador: ' + e.message + '\nDica: baixe o .zip.'); }
});
$('#listaMem').addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const l = await DB.get('projetos', []);
  const k = +(b.dataset.ab ?? b.dataset.zip ?? b.dataset.rm); const m = l[k]; if (!m) return;
  if (b.dataset.rm != null) { if (!confirm('Apagar “' + m.nome + '” da memória?')) return; await DB.del('proj:' + m.id); l.splice(k, 1); await DB.set('projetos', l); return renderMem(); }
  const p = await DB.get('proj:' + m.id); if (!p) return alert('Projeto não encontrado.');
  if (b.dataset.zip != null) return baixar(escreverZip(p.arquivos.map((x) => ({ nome: x.caminho, dados: x.editado ? new TextEncoder().encode(x.texto) : x.dados }))), m.nome.replace(/\.(zip|apk)$/i, '') + '.zip');
  despacotar(p); await posCarga();
});
const reaplicar = async () => { salvarCfg(); if (P.arquivos.length) await posCarga(true); };
$('#cfLimite').addEventListener('change', (e) => { CFG.limiteKB = +e.target.value; reaplicar(); });
$('#cfPastas').addEventListener('change', (e) => { CFG.ignorarPastas = e.target.checked; reaplicar(); });
$('#cfPastasTxt').addEventListener('change', (e) => { CFG.pastas = e.target.value; reaplicar(); });
$('#cfEstilo').addEventListener('change', (e) => { CFG.estilo = e.target.checked; salvarCfg(); });
$('#cfSessao').addEventListener('change', (e) => { CFG.sessao = e.target.checked; salvarCfg(); if (!CFG.sessao) DB.del('sessao'); });
$('#bBackup').addEventListener('click', () => baixar(JSON.stringify({ app: 'cirurgiao-4', data: new Date().toISOString(), notas, historico, gasto, cfg: CFG }, null, 1), 'cirurgiao-backup-' + new Date().toISOString().slice(0, 10) + '.json', 'application/json'));
$('#bRestaurar').addEventListener('click', () => $('#fBackup').click());
