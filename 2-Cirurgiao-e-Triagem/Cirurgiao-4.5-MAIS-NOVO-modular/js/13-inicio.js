'use strict';
EX.funcoes = async (lista) => {
  const R_FN = [
    [/\bfunction\s*\*?\s*([\w$]+)\s*\(/g, 'função'],
    [/^[ \t]*(?:export\s+)?(?:const|let|var)\s+([\w$]+)\s*(?::[^=\n]+)?=\s*(?:async\s*)?(?:\([^)\n]*\)|[\w$]+)\s*(?::[^=\n]+)?=>/gm, 'função (seta)'],
    [/^[ \t]*(?:export\s+)?(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s+)?function\b/gm, 'função'],
    [/^[ \t]*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([\w$]+)/gm, 'classe'],
    [/^[ \t]+(?:async\s+)?(?:static\s+)?(?!if\b|for\b|while\b|switch\b|catch\b|function\b|return\b)([\w$]+)\s*\([^)\n]*\)\s*\{/gm, 'método'],
    [/^[ \t]*(?:async\s+)?def\s+(\w+)\s*\(/gm, 'função Python'],
    [/^[ \t]*(?:public|private|protected|internal|override|suspend|\s)*fun\s+(\w+)\s*\(/gm, 'função Kotlin'],
    [/app\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)/g, 'rota do servidor'],
  ];
  const itens = await porArquivo(lista, (a, ai, it) => {
    if (!/^(js|mjs|cjs|jsx|ts|tsx|html?|vue|svelte|py|kt|java|php|cs|swift|dart)$/.test(a.ext)) return;
    const t = txt(a), vistos = new Set();
    for (const [re, tipo] of R_FN) {
      re.lastIndex = 0; let m;
      while ((m = re.exec(t))) {
        const pos = m.index + (m[0].length - m[0].trimStart().length);
        const n = linhaDe(a, pos);
        const nome = tipo === 'rota do servidor' ? m[1].toUpperCase() + ' ' + m[2] : m[1];
        const k = n + nome; if (vistos.has(k)) continue; vistos.add(k);
        it.push({ a: ai, n, col: pos - inicios(a)[n - 1], len: m[0].trim().length, sev: 'info', tipo: `${tipo}: ${nome}`, sol: '', fn: pos });
      }
    }
  });
  itens.sort((x, y) => x.a - y.a || x.n - y.n);
  return { titulo: '📋 Funções, classes e rotas', itens, vazio: 'Nenhuma função encontrada.', dica: 'Toque para abrir no lugar. No arquivo, toque no número da linha → 📎 Extrair bloco para pegar a função inteira (sem limite de tamanho).' };
};
EX.storage = async (lista) => {
  const itens = await porArquivo(lista, (a, i, it) => varrer(a, i, [{ re: /\b(?:localStorage|sessionStorage)\s*\.\s*(?:getItem|setItem|removeItem|clear)\s*\(\s*([^)]*)|\b(?:localStorage|sessionStorage)\s*\[[^\]]+\]/g, sev: 'info', tipo: '🧠 localStorage', sol: '' }, { re: /\bindexedDB\.open\s*\(|\bcreateObjectStore\s*\(/g, sev: 'info', tipo: '🗃 IndexedDB', sol: '' }], it));
  const chaves = new Map();
  for (const it of itens) { const m = /(?:getItem|setItem|removeItem)\s*\(\s*["'`]([^"'`]+)/.exec(textoLinha(P.arquivos[it.a], it.n)); if (m) chaves.set(m[1], (chaves.get(m[1]) || 0) + 1); }
  return { titulo: '🧠 Onde o app guarda dados', itens, vazio: 'Este código não usa localStorage nem IndexedDB.', dica: chaves.size ? 'Chaves usadas: ' + [...chaves].map(([k, n]) => `${k} (${n}×)`).join(' · ') : '' };
};
EX.api = async (lista) => {
  const itens = await porArquivo(lista, (a, i, it) => varrer(a, i, [
    { re: /\bfetch\s*\(|\baxios(?:\.\w+)?\s*\(|\bnew\s+XMLHttpRequest|\bEventSource\s*\(|\bnew\s+WebSocket\s*\(/g, sev: 'info', tipo: '🌐 Chamada de internet', sol: '' },
    { re: /generativelanguage\.googleapis\.com|api\.openai\.com|api\.anthropic\.com|api\.groq\.com|openrouter\.ai|api\.perplexity\.ai|api\.x\.ai|api\.deepseek\.com|openapi\.monica\.im/g, sev: 'info', tipo: '🤖 Endereço de IA', sol: '' },
    { re: /\b(?:gemini-[\w.-]+|gpt-[\w.-]+|claude-[\w.-]+|llama-?[\w.-]+|grok-[\w.-]+|sonar[\w.-]*|deepseek-[\w.-]+)/g, sev: 'info', tipo: '🧠 Nome de modelo de IA', sol: 'Modelos antigos são desligados com o tempo — se a IA parou de responder, confira se este nome ainda existe.' },
    { re: /\b(?:Authorization|x-api-key|x-goog-api-key|Bearer\s)/g, sev: 'info', tipo: '🔑 Cabeçalho de chave', sol: '' },
  ], it));
  const urls = new Map();
  for (const [a] of lista) { const re = /https?:\/\/[^\s"'`<>)\\]+/g; let m; const t = txt(a); while ((m = re.exec(t))) { const u = m[0].replace(/[.,;]+$/, ''); urls.set(u, (urls.get(u) || 0) + 1); } }
  const dica = urls.size ? `${fmtN(urls.size)} endereço(s) diferentes no código:\n` + [...urls].sort((x, y) => y[1] - x[1]).map(([u, n]) => `${n}× ${u}`).join('\n') : '';
  return { titulo: '🌐 API, IA e endereços', itens, vazio: 'Nenhuma chamada de internet encontrada.', dica };
};
EX.json = async (lista) => {
  const itens = await porArquivo(lista, (a, ai, it) => {
    const t = txt(a);
    if (a.ext === 'json') { let ok = true; try { JSON.parse(t); } catch { ok = false; } it.push({ a: ai, n: 1, col: 0, len: 0, sev: ok ? 'info' : 'alta', tipo: ok ? '📦 Arquivo JSON válido' : '🔴 Arquivo JSON inválido', sol: fmtB(a.tam) + (ok ? '' : ' — ver ✅ Sintaxe para a linha exata') }); return; }
    const re = /\{(?=\s*")(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}|\[(?=\s*[{"\d-])(?:[^[\]]|\[[^[\]]*\])*\]/g; let m;
    while ((m = re.exec(t))) {
      if (m[0].length < 20) continue;
      try { const v = JSON.parse(m[0]); if (typeof v !== 'object' || !v) continue; const n = linhaDe(a, m.index); it.push({ a: ai, n, col: m.index - inicios(a)[n - 1], len: m[0].length, sev: 'info', tipo: '📦 Bloco de dados JSON', sol: '', bloco: JSON.stringify(v, null, 2) }); } catch {}
    }
  });
  return { titulo: '📦 JSON', itens, vazio: 'Nenhum JSON encontrado.', dica: 'Blocos de dados escritos direto no código aparecem completos (toque em “ver bloco”).' };
};
EX.teatro = async (lista) => {
  const REAL = /fetch\s*\(|FileReader|arrayBuffer\(|\.async\(|JSZip|lerZip|new\s+Blob|indexedDB|localStorage\.(?:set|get)Item|XMLHttpRequest|WebSocket|navigator\.clipboard|\.download\s*=|JSON\.parse|crypto\.|speechSynthesis|require\(|readFile|writeFile|exec\(|spawn\(|\.postMessage\(|import\(/;
  const FINGE_TXT = /✅|sucesso|conclu[ií]d|pronto!|gerado|removid|instalad|enviad|publicad|compilad|build ok/i;
  const itens = await porArquivo(lista, (a, ai, it) => {
    if (!/^(js|mjs|cjs|jsx|ts|tsx|html?)$/.test(a.ext)) return;
    const t = txt(a), ls = inicios(a);
    const re = /(?:^|[^\w$.])(?:async\s+)?function\s+([\w$]+)\s*\(|^[ \t]*(?:const|let)\s+([\w$]+)\s*=\s*(?:async\s*)?\([^)\n]*\)\s*=>/gm; let m;
    while ((m = re.exec(t))) {
      const nome = m[1] || m[2], ini = m.index + (m[0].length - m[0].trimStart().length);
      const b = blocoFuncao(t, ini, !m[1]); if (!b) continue;
      const c = b.texto;
      const sinais = [];
      if (/\/\/\s*simula|\/\*\s*simula/i.test(c)) sinais.push('comentário “simular”');
      if (/setTimeout\s*\(/.test(c) && FINGE_TXT.test(c.substring(c.search(/setTimeout\s*\(/)))) sinais.push('mostra “✅ concluído” depois de um tempo fixo (setTimeout)');
      if (/Math\.random\(\)/.test(c) && /progress|porcent|width|%/i.test(c)) sinais.push('barra de progresso sorteada (Math.random)');
      if (/(?:textContent|innerHTML|innerText)\s*=\s*`[^`]*(?::\s*\d+\s*\\n|:\s*\d+\s*<)[^`]*`/.test(c) && !/\$\{[^}]*(?:length|count|total|soma|n\b)/i.test(c)) sinais.push('resultado com números fixos escritos no código');
      if (!sinais.length) continue;
      const real = REAL.test(c);
      const n = linhaDe(a, ini);
      it.push({ a: ai, n, col: ini - ls[n - 1], len: nome.length + 9, sev: real ? 'media' : 'alta', tipo: (real ? '🎭 Parte simulada: ' : '🎭 Finge que faz: ') + nome + '()', sol: (real ? 'Faz alguma coisa de verdade, mas tem trecho de faz-de-conta: ' : 'Não lê arquivo, não chama internet, não salva nada — só exibe mensagens: ') + sinais.join('; ') + '.' });
    }
  });
  return { titulo: '🎭 Código de mentira (simulação)', itens, vazio: 'Nenhuma função “de mentira” encontrada. 👍', dica: 'Procura funções que só fingem trabalhar: esperam um tempo fixo e mostram “✅ concluído”, sorteiam a barra de progresso ou exibem números fixos. 🔴 = não faz nada de verdade. 🟡 = mistura real com simulado. É um indício forte, não prova — confira abrindo a função.' };
};
EX.manual = async (lista) => {
  const linhasTot = lista.reduce((s, [a]) => s + nLinhas(a), 0);
  let m = `📖 MANUAL DO PROJETO — ${P.nome}\nGerado em ${agora()} pelo Cirurgião 4.0\n${'═'.repeat(60)}\n\n`;
  m += `Arquivos: ${fmtN(P.arquivos.length)} (analisados: ${fmtN(lista.length)}) · Linhas analisadas: ${fmtN(linhasTot)}\nTecnologias: ${tecnologias().join(' · ') || '—'}\n\n`;
  const rep = (await EX.replit(lista)).itens, fn = (await EX.funcoes(lista)).itens, ap = (await EX.api(lista)).itens;
  if (rep.length) { m += `⚠️ MARCAS DA REPLIT: ${fmtN(rep.length)}\n`; const pt = new Map(); rep.forEach((x) => pt.set(x.tipo, (pt.get(x.tipo) || 0) + 1)); for (const [t, n] of pt) m += `   ${n}× ${t}\n`; m += '\n'; }
  m += `📂 ESTRUTURA (todos os arquivos)\n${'─'.repeat(40)}\n`;
  for (const a of P.arquivos) m += `${a.bin ? '🔒' : ignoradoPor(a) ? '⏸' : '📄'} ${a.caminho} (${fmtB(a.tam)}${a.bin ? '' : ', ' + fmtN(nLinhas(a)) + ' linhas'})\n`;
  m += `\n📋 FUNÇÕES POR ARQUIVO\n${'─'.repeat(40)}\n`;
  let ult = -1;
  for (const f of fn) { if (f.a !== ult) { m += `\n■ ${P.arquivos[f.a].caminho}\n`; ult = f.a; } m += `   linha ${f.n}: ${f.tipo}\n`; }
  const ia = new Set(ap.filter((x) => x.tipo.includes('IA') || x.tipo.includes('modelo')).map((x) => x.achado));
  if (ia.size) m += `\n🤖 IA USADA\n${'─'.repeat(40)}\n${[...ia].join('\n')}\n`;
  m += `\n💡 PRÓXIMOS PASSOS\n${'─'.repeat(40)}\n1. 🚨 Replit → trocar o que para fora dela\n2. ✅ Sintaxe → achar o erro que deixa botões mortos\n3. 📎 Referências → arquivos faltando no zip\n4. 🔑 Chaves expostas → antes de publicar\n5. 🤖 IA → correção, mandando só o arquivo certo\n`;
  modalTexto('📖 Manual do projeto', m, [['📌 Virar nota', () => novaNota('', 0, m)]]);
  return null;
};
EX.tudo = async (lista) => {
  const partes = [];
  for (const k of ['replit', 'sintaxe', 'refs', 'segredos', 'teatro', 'bugs']) { status('⏳ Exame: ' + k + '…'); partes.push(await EX[k](lista)); }
  const itens = partes.flatMap((p) => p.itens);
  return { titulo: '⚡ Exame completo', itens, vazio: 'Nada encontrado em nenhum exame. 🎉', dica: partes.map((p) => `${p.titulo}: ${fmtN(p.itens.length)}`).join(' · ') };
};
$$('[data-d]').forEach((b) => b.addEventListener('click', async () => {
  const lista = escopo(); if (!lista) return;
  if (!lista.length) return alert('Nenhum arquivo analisável. Veja ⚙️ Ajustes (limite de tamanho / pastas) ou se os arquivos são binários.');
  b.disabled = true; const txt0 = b.innerHTML; b.innerHTML = '<span class="spin"></span>';
  try { const r = await EX[b.dataset.d](lista); if (r) mostrarResultado(r); }
  catch (e) { alert('Erro no exame: ' + e.message); console.error(e); }
  finally { b.disabled = false; b.innerHTML = txt0; status(''); }
}));

/* ── Resultado ──────────────────────────────────────────────────────── */
const SEV_NOME = { alta: '🔴 Grave', media: '🟡 Atenção', info: '🔵 Informação', estilo: '⚪ Estilo' };
$('#chipsSev').addEventListener('click', (e) => { const c = e.target.closest('[data-s]'); if (!c) return; R.filtroSev = c.dataset.s; R.limite = 300; renderRes(); });
$('#resFiltro').addEventListener('input', () => { R.limite = 300; renderRes(); });
$('#resLista').addEventListener('click', (e) => {
  const g = e.target.closest('.gh'); if (g) return abrirArquivo(+g.dataset.a);
  const r = e.target.closest('.ri'); if (!r) return;
  const it = $('#resLista')._itens[+r.dataset.k];
  if (e.target.closest('[data-bloco]')) {
    const a = P.arquivos[it.a], t = txt(a), b = extrairBloco(t, it.fn);
    if (!b) return alert('Não achei o fim do bloco.');
    return modalTexto(`📎 ${it.tipo} — ${a.caminho}, linhas ${it.n}–${linhaDe(a, b.fim)}`, t.substring(it.fn, b.fim + 1));
  }
  abrirArquivo(it.a, it.n);
});
$('#bRelCopiar').addEventListener('click', () => copiar(relatorio(itensFiltrados())));
$('#bRelBaixar').addEventListener('click', () => baixar(relatorio(itensFiltrados()), 'relatorio-' + Date.now() + '.txt'));
$('#bRelNota').addEventListener('click', () => novaNota('', 0, relatorio(itensFiltrados())));
$('#bRelIA').addEventListener('click', () => { $('#iaCtx').value = 'res'; $('#trechoBox').hidden = true; if (!$('#iaPerg').value.trim()) $('#iaPerg').value = 'Analise estes achados. Diga o que é mais grave, em que ordem corrigir e como corrigir cada um (com o código já corrigido).'; ir('ia'); });
$('#bBuscar').addEventListener('click', buscar);
$('#busca').addEventListener('keydown', (e) => { if (e.key === 'Enter') buscar(); });
$('#bBuscaReplit').addEventListener('click', () => { $('#busca').value = 'replit, REPL_, @replit/, @workspace/, /api/code-assistant, /api/tts, AI_INTEGRATIONS'; $('#bRegex').checked = false; buscar(); });
$('#bBuscaErro').addEventListener('click', () => { $('#busca').value = 'undefined is not, cannot read, is not a function, syntax error, unexpected token, is not defined, failed to fetch'; $('#bRegex').checked = false; buscar(); });
$('#bTrocar').addEventListener('click', async () => {
  const res = montarBusca(); const lista = escopo(); if (!res || !lista) return;
  if (res.length > 1) return alert('Para substituir, use UM termo só (sem vírgula) ou marque “expressão regular”.');
  const re = res[0], por = $('#trocaPor').value;
  let tot = 0; const afetados = [];
  for (const [a, i] of lista) { re.lastIndex = 0; const n = (txt(a).match(re) || []).length; if (n) { tot += n; afetados.push([i, n]); } }
  if (!tot) return alert('Nenhuma ocorrência.');
  if (!confirm(`Substituir ${fmtN(tot)} ocorrência(s) em ${fmtN(afetados.length)} arquivo(s)?\n\n“${$('#busca').value}” → “${por}”\n\nO original de cada arquivo fica guardado (↩ Desfazer no arquivo).`)) return;
  for (const [i] of afetados) { re.lastIndex = 0; aplicarTexto(i, txt(P.arquivos[i]).replace(re, por)); }
  await posEdicao();
  toast(`✂️ ${fmtN(tot)} substituição(ões) feitas. Baixe o .zip na aba 📂 Arquivos.`);
  buscar();
});
$('#bZip').addEventListener('click', () => exportarZip(false));
$('#bZipEdit').addEventListener('click', () => exportarZip(true));
$('#bFechar').addEventListener('click', () => { if (P.arquivos.some((a) => a.editado) && !confirm('Há arquivos editados. Fechar mesmo assim? (Baixe o .zip antes se quiser guardar.)')) return; P = { nome: '', arquivos: [] }; atual = -1; marcas = new Map(); R = null; $('#cardRes').hidden = true; renderTudo(); renderCodigo(); DB.del('sessao'); });
