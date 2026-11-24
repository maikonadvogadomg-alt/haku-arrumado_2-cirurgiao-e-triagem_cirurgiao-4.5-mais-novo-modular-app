'use strict';
function renderDeps() {
  const box = $('#depLista');
  if (!P.arquivos.length) { box.innerHTML = '<div class="info">Abra um projeto primeiro (aba 📂 Arquivos).</div>'; $('#depResumo').textContent = ''; $('#depChips').innerHTML = ''; return; }
  const { deps, pacotes } = coletarDeps();
  if (!pacotes.length) { box.innerHTML = '<div class="info">Este projeto não tem package.json — então não usa bibliotecas do npm (ou usa por CDN, direto no HTML). Veja 🔎 Detectar → 🌐 API/URLs para os endereços de CDN.</div>'; $('#depResumo').textContent = ''; $('#depChips').innerHTML = ''; return; }
  const temCodigo = analisaveis().some(([a]) => /^(js|mjs|cjs|jsx|ts|tsx|vue|svelte)$/.test(a.ext));
  const lista = [...deps.values()].sort((x, y) => x.nome.localeCompare(y.nome)).map((d) => Object.assign(d, avaliar(d, pacotes, temCodigo)));
  const conferidas = lista.filter((d) => d.n).length;
  const cont = { todas: lista.length, prob: lista.filter((d) => d.alertas.some((a) => a[0] === 'alta')).length, aviso: lista.filter((d) => d.alertas.some((a) => a[0] === 'media')).length, desc: lista.filter((d) => !d.e.txt || d.e.fonte === 'npm').length, montar: lista.filter((d) => d.e.tipo === 'montar' || d.e.tipo === 'tipos').length, naousada: lista.filter((d) => !d.usada).length };
  $('#depResumo').innerHTML = `${pacotes.length} package.json: ${pacotes.map((p) => `<code>${esc(p.arquivo)}</code>${p.erro ? ' <span style="color:var(--verm)">(' + esc(p.erro) + ')</span>' : ''}`).join(', ')}<br>${lista.length} biblioteca(s) diferentes · conferidas no npm: <b>${conferidas}</b> de ${lista.length}${conferidas < lista.length ? ' — toque em 🔎 Conferir todas' : ''}`;
  const CH = [['todas', 'Todas'], ['prob', '🔴 Travam o install'], ['aviso', '🟡 Avisos'], ['desc', '❔ Sem explicação em PT'], ['montar', '🔧 Só montagem'], ['naousada', '🗑 Não usadas']];
  $('#depChips').innerHTML = CH.map(([k, n]) => `<button class="chip ${depFiltro === k ? 'on' : ''}" data-df="${k}">${n} (${cont[k]})</button>`).join('');
  const q = $('#depFiltro').value.trim().toLowerCase();
  const f = lista.filter((d) => (!q || d.nome.toLowerCase().includes(q)) && (depFiltro === 'todas' || (depFiltro === 'prob' && d.alertas.some((a) => a[0] === 'alta')) || (depFiltro === 'aviso' && d.alertas.some((a) => a[0] === 'media')) || (depFiltro === 'desc' && (!d.e.txt || d.e.fonte === 'npm')) || (depFiltro === 'montar' && (d.e.tipo === 'montar' || d.e.tipo === 'tipos')) || (depFiltro === 'naousada' && !d.usada)));
  const TIPO = { app: '🧩 o app usa', montar: '🔧 só montagem', tipos: '📐 tipos (TS)', '?': '❔' };
  box.innerHTML = f.map((d) => {
    const pior = d.alertas.some((a) => a[0] === 'alta') ? 'alta' : d.alertas.some((a) => a[0] === 'media') ? 'media' : d.n ? 'ok' : 'info';
    const st = d.n ? (d.n.estado === 'naoexiste' ? '❌ não existe' : d.n.estado === 'erro' ? '⚠️ ' + esc(d.n.erro) : '✅ npm: ' + esc(d.n.ultima || '')) : '— não conferida';
    return `<div class="ri s-${pior === 'ok' ? 'info' : pior}" data-dep="${esc(d.nome)}"><div class="rh"><b>${esc(d.nome)}</b> · ${d.usos.map((u) => esc(u.versao) + (u.tipo !== 'dep' ? ' (' + u.tipo + ')' : '')).join(' · ')} · <span class="small">${TIPO[d.e.tipo] || '❔'}</span> · <span class="small">${st}</span></div>` +
      `<div class="small" style="margin-top:3px">${d.e.txt ? esc(d.e.txt) : '<i>sem explicação — toque em 🔎 Conferir (traz a descrição do npm) e depois 🤖 Explicar com IA</i>'}</div>` +
      d.alertas.map((a) => `<div class="rs" style="color:${a[0] === 'alta' ? 'var(--verm)' : a[0] === 'media' ? 'var(--amar)' : 'var(--azul)'}">${a[0] === 'alta' ? '🔴' : a[0] === 'media' ? '🟡' : 'ℹ️'} ${esc(a[1])}</div>`).join('') +
      `<div class="lin" style="margin-top:4px"><button class="peq fixo" data-da="npm">🔎 npm</button><button class="peq fixo" data-da="cdn">🌐 CDN</button><button class="peq fixo" data-da="site">↗ site</button><span class="small fixo">em: ${[...new Set(d.usos.map((u) => u.arquivo))].map(esc).join(', ')}</span></div></div>`;
  }).join('') || '<div class="bom">Nada com esse filtro.</div>';
  box._lista = lista;
}
async function conferirTodas() {
  const { deps } = coletarDeps(); const nomes = [...deps.keys()];
  if (!nomes.length) return;
  const b = $('#bDepVer'); b.disabled = true;
  let feito = 0;
  const fila = nomes.slice();
  const trabalhador = async () => { while (fila.length) { const n = fila.shift(); NPM.delete(n); await npmInfo(n); feito++; b.innerHTML = `<span class="spin"></span> ${feito}/${nomes.length}`; } };
  try { await Promise.all(Array.from({ length: 6 }, trabalhador)); }
  finally { b.disabled = false; b.innerHTML = '🔎 Conferir todas no npm'; }
  const erros = nomes.filter((n) => NPM.get(n)?.estado === 'erro').length;
  toast(erros === nomes.length ? '⚠️ Não consegui falar com o npm (sem internet?)' : `✅ ${nomes.length} biblioteca(s) conferidas no npm.`);
  renderDeps();
}
async function explicarComIA() {
  const { deps } = coletarDeps();
  const falta = [...deps.keys()].filter((n) => { const e = explicar(n); return !e.txt || e.fonte === 'npm'; });
  if (!falta.length) return toast('✅ Todas já têm explicação em português.');
  if (!$('#iaChave').value.trim()) { alert('Coloque sua chave de IA na aba 🤖 IA primeiro (qualquer provedor).'); return ir('ia'); }
  const linhas = falta.map((n) => `${n}: ${(NPM.get(n) || {}).descricao || '(sem descrição)'}`).join('\n');
  const pedido = `Para cada biblioteca do npm abaixo, explique em UMA linha curta, em português simples (para quem não é programador), para que ela serve. Diga também se é "app" (o programa usa ao rodar) ou "montar" (só para montar/testar). Se o nome parecer errado ou inventado, diga "suspeito: provavelmente não existe".\nResponda SÓ assim, uma por linha:\nnome | app ou montar | explicação\n\n${linhas}`;
  const b = $('#bDepIA'); b.disabled = true; b.innerHTML = '<span class="spin"></span> perguntando…';
  try {
    const r = await chamarIA([{ role: 'user', content: pedido }], 4000);
    await registrarGasto(r, pedido.length);
    let n = 0;
    for (const l of r.texto.split('\n')) { const m = /^\s*[-*•]?\s*`?([@\w./-]+)`?\s*\|\s*(app|montar)\s*\|\s*(.+)$/i.exec(l); if (m && deps.has(m[1])) { DIC_IA[m[1]] = { tipo: m[2].toLowerCase(), txt: m[3].trim() }; n++; } }
    await DB.set('dicIA', DIC_IA);
    toast(`🤖 ${n} explicação(ões) em português guardada(s) — ficam salvas para os próximos projetos.`);
    renderDeps();
  } catch (e) { alert('A IA não respondeu: ' + e.message); }
  finally { b.disabled = false; b.innerHTML = '🤖 Explicar as desconhecidas com IA'; }
}
function packageLimpo() {
  const { deps, pacotes } = coletarDeps();
  if (!deps.size) return alert('Nenhuma dependência.');
  const naoConf = [...deps.keys()].filter((n) => !NPM.get(n) || NPM.get(n).estado === 'erro').length;
  if (naoConf && !confirm(`${naoConf} biblioteca(s) ainda não foram conferidas no npm, então não sei se existem. Gerar mesmo assim? (Melhor tocar antes em 🔎 Conferir todas.)`)) return;
  const base = (() => { try { return JSON.parse(txt(P.arquivos[pacotes.find((p) => !p.erro)?.i ?? -1] || { texto: '{}' })); } catch { return {}; } })();
  const out = { name: base.name || 'meu-projeto', version: base.version || '1.0.0', private: true, type: base.type, scripts: base.scripts || {}, dependencies: {}, devDependencies: {} };
  const tirados = [], corrigidos = [], movidos = [];
  for (const d of deps.values()) {
    const n = NPM.get(d.nome), e = explicar(d.nome);
    if (n && n.estado === 'naoexiste') { tirados.push(d.nome); continue; }
    if (/^@replit\//.test(d.nome)) { tirados.push(d.nome + ' (Replit)'); continue; }
    let ver = d.usos[0].versao;
    if (n && n.estado === 'ok') { const boa = d.usos.map((u) => u.versao).find((v) => versaoExiste(v, n.versoes) !== false); if (boa) ver = boa; else { ver = '^' + n.ultima; corrigidos.push(`${d.nome}: ${d.usos[0].versao} → ${ver}`); } }
    const dev = e.tipo === 'montar' || e.tipo === 'tipos' || d.usos.every((u) => u.tipo === 'dev');
    if (dev && d.usos.some((u) => u.tipo === 'dep')) movidos.push(d.nome);
    (dev ? out.devDependencies : out.dependencies)[d.nome] = ver;
  }
  if (!out.type) delete out.type;
  const json = JSON.stringify(out, null, 2) + '\n';
  const nota = `O QUE MUDEI:\n• Tirei (não existem no npm ou são da Replit): ${tirados.join(', ') || 'nenhuma'}\n• Corrigi versões que não existem: ${corrigidos.join('; ') || 'nenhuma'}\n• Passei para devDependencies (só montagem): ${movidos.join(', ') || 'nenhuma'}\n${pacotes.length > 1 ? '• Juntei ' + pacotes.length + ' package.json num só.\n' : ''}\n═══ package.json ═══\n`;
  modalTexto('📄 package.json limpo', nota + json, [['⬇️ Baixar package.json', () => baixar(json, 'package.json', 'application/json')], ['🩹 Trocar no projeto', async () => { const i = pacotes.find((p) => !p.erro)?.i; if (i == null) return; aplicarTexto(i, json); fecharModal(); await posEdicao(); toast('🩹 package.json trocado (o original fica guardado: ↩ Desfazer).'); }]]);
}
function relatorioDeps() {
  const box = $('#depLista'); const l = box._lista || []; if (!l.length) return;
  let s = `DEPENDÊNCIAS — ${P.nome}\n${agora()}\n${'═'.repeat(50)}\n`;
  for (const d of l) s += `\n■ ${d.nome}  ${d.usos.map((u) => u.versao + (u.tipo !== 'dep' ? ' (' + u.tipo + ')' : '')).join(' · ')}\n  ${d.e.txt || '(sem explicação)'}\n${d.n ? '  npm: ' + (d.n.estado === 'naoexiste' ? 'NÃO EXISTE' : d.n.ultima || '') + '\n' : ''}${d.alertas.map((a) => '  ' + (a[0] === 'alta' ? '🔴' : a[0] === 'media' ? '🟡' : 'ℹ️') + ' ' + a[1]).join('\n')}${d.alertas.length ? '\n' : ''}`;
  baixar(s, 'dependencias-' + Date.now() + '.txt');
}

/* ── ⌨️ Terminal de pesquisa (npm / PyPI de verdade) ── */
function termOut(t, cls) { const d = document.createElement('div'); d.className = cls || ''; d.textContent = t; $('#termSaida').appendChild(d); $('#termSaida').scrollTop = 1e9; }
async function termRodar() {
  const linha = $('#termEntrada').value.trim(); if (!linha) return;
  $('#termEntrada').value = ''; termOut('$ ' + linha, 'term-cmd');
  const [c1, c2, ...resto] = linha.split(/\s+/); const arg = resto.join(' ');
  try {
    if (/^(limpar|clear|cls)$/.test(c1)) { $('#termSaida').innerHTML = ''; return; }
    if (c1 === 'ajuda' || c1 === 'help') return termOut('npm search <palavra> · npm info <nome> · npm versoes <nome> · pip info <nome> · cdn <nome> · limpar');
    if (c1 === 'npm' && c2 === 'search') {
      const r = await fetch('https://registry.npmjs.org/-/v1/search?size=20&text=' + encodeURIComponent(arg)); const j = await r.json();
      if (!j.objects?.length) return termOut('Nada encontrado.');
      for (const o of j.objects) termOut(`${o.package.name}@${o.package.version} — ${DIC[o.package.name]?.[1] || o.package.description || ''}`);
      return;
    }
    if (c1 === 'npm' && (c2 === 'info' || c2 === 'view' || c2 === 'versoes')) {
      NPM.delete(arg); const n = await npmInfo(arg);
      if (n.estado === 'naoexiste') return termOut(`❌ "${arg}" não existe no npm.`, 'term-erro');
      if (n.estado === 'erro') return termOut('⚠️ ' + n.erro, 'term-erro');
      if (c2 === 'versoes') return termOut(`${n.versoes.length} versões: ${n.versoes.join(', ')}`);
      return termOut(`${arg} — última versão ${n.ultima} · ${n.versoes.length} versões${n.licenca ? ' · licença ' + n.licenca : ''}\n${explicar(arg).txt || n.descricao || ''}${n.depreciado ? '\n⚠️ abandonada: ' + n.depreciado : ''}${n.home ? '\n' + n.home : ''}`);
    }
    if (c1 === 'pip' && (c2 === 'info' || c2 === 'show')) {
      const r = await fetch('https://pypi.org/pypi/' + encodeURIComponent(arg) + '/json');
      if (r.status === 404) return termOut(`❌ "${arg}" não existe no PyPI (Python).`, 'term-erro');
      const j = await r.json(); return termOut(`${j.info.name} — última ${j.info.version}\n${j.info.summary || ''}\n${j.info.home_page || j.info.project_url || ''}`);
    }
    if (c1 === 'cdn') return termOut(`https://cdn.jsdelivr.net/npm/${c2}/+esm\nhttps://esm.sh/${c2}\nhttps://unpkg.com/${c2}`);
    termOut('Comando não conhecido. Digite: ajuda', 'term-erro');
  } catch (e) { termOut('⚠️ Sem conexão: ' + e.message, 'term-erro'); }
}

/* ── 🧱 Recriar: plano completo (MD) e scripts .bat/.ps1/.sh ── */
function arvoreTexto(caminhos) {
  const raiz = {};
  for (const c of caminhos) { let n = raiz; for (const parte of c.split('/')) { n[parte] = n[parte] || {}; n = n[parte]; } }
  const linhas = [];
  const anda = (n, pre) => { const ks = Object.keys(n).sort((a, b) => (Object.keys(n[b]).length > 0) - (Object.keys(n[a]).length > 0) || a.localeCompare(b)); ks.forEach((k, i) => { const ult = i === ks.length - 1, pasta = Object.keys(n[k]).length > 0; linhas.push(pre + (ult ? '└── ' : '├── ') + k + (pasta ? '/' : '')); if (pasta) anda(n[k], pre + (ult ? '    ' : '│   ')); }); };
  anda(raiz, '');
  return linhas.join('\n');
}
async function gerarPlano() {
  if (!P.arquivos.length) { alert('Abra um projeto primeiro.'); return null; }
  const partes = { resumo: '', deps: '', problemas: '' };
  const ana = analisaveis();
  const porExt = new Map(); P.arquivos.forEach((a) => porExt.set(a.ext || '(sem)', (porExt.get(a.ext || '(sem)') || 0) + 1));
  let r = `# Plano do projeto: ${P.nome}\n\n_Gerado pelo Cirurgião em ${agora()}_\n\n## Resumo\n\n`;
  r += `- Arquivos: **${fmtN(P.arquivos.length)}** (${fmtB(P.arquivos.reduce((s, a) => s + a.tam, 0))}), analisados: ${fmtN(ana.length)}\n`;
  r += `- Linhas de código analisadas: ${fmtN(ana.reduce((s, [a]) => s + nLinhas(a), 0))}\n`;
  r += `- Tipos de arquivo: ${[...porExt].sort((a, b) => b[1] - a[1]).map(([e, n]) => `${e} ${n}`).join(' · ')}\n`;
  r += `- Tecnologias: ${(P._tec || []).join(' · ') || '—'}\n`;
  const pk = coletarDeps();
  if (pk.pacotes.length) r += `- package.json: ${pk.pacotes.map((p) => '`' + p.arquivo + '`').join(', ')}${pk.pacotes.length > 1 ? ' (monorepo)' : ''}\n`;
  const scripts = pk.pacotes.flatMap((p) => Object.entries(p.scripts || {}).map(([k, v]) => `- \`npm run ${k}\` → \`${v}\` (${p.arquivo})`));
  if (scripts.length) r += `\n### Comandos do projeto (scripts)\n\n${scripts.join('\n')}\n`;
  r += `\n## Estrutura completa (${fmtN(P.arquivos.length)} arquivos)\n\n\`\`\`\n${arvoreTexto(P.arquivos.map((a) => a.caminho))}\n\`\`\`\n`;
  try { const rotas = [...rotasDe(P).values()]; if (rotas.length) r += `\n## Rotas e telas (${rotas.length})\n\n| Rota | Arquivo |\n|---|---|\n${rotas.sort((a, b) => a.k.localeCompare(b.k)).map((x) => `| \`${x.k}\` | ${x.chave} |`).join('\n')}\n`; } catch {}
  partes.resumo = r;
  let d = '';
  if (pk.deps.size) {
    const temCodigo = ana.some(([a]) => /^(js|mjs|cjs|jsx|ts|tsx|vue|svelte)$/.test(a.ext));
    d += `## Dependências (${pk.deps.size})\n\n| Biblioteca | Versão | Para que serve | Situação |\n|---|---|---|---|\n`;
    for (const dep of [...pk.deps.values()].sort((a, b) => a.nome.localeCompare(b.nome))) {
      const av = avaliar(dep, pk.pacotes, temCodigo);
      const sit = av.alertas.length ? av.alertas.map((a) => (a[0] === 'alta' ? '🔴 ' : a[0] === 'media' ? '🟡 ' : 'ℹ️ ') + a[1]).join('<br>') : (av.n ? '✅' : '— (não conferida no npm)');
      d += `| \`${dep.nome}\` | ${dep.usos.map((u) => u.versao + (u.tipo !== 'dep' ? ' (' + u.tipo + ')' : '')).join(', ')} | ${(av.e.txt || '—').replace(/\|/g, '/')} | ${sit.replace(/\|/g, '/')} |\n`;
    }
  } else d += '## Dependências\n\nSem package.json (não usa bibliotecas do npm, ou usa por CDN no HTML).\n';
  partes.deps = d;
  let pr = '';
  if ($('#recExames').checked) {
    status('⏳ Rodando o exame completo para o plano…');
    const t = await EX.tudo(ana);
    const graves = t.itens.filter((x) => x.sev === 'alta'), medios = t.itens.filter((x) => x.sev === 'media');
    pr += `## Problemas encontrados\n\n${t.dica}\n\n### 🔴 Graves (${graves.length})\n\n${graves.map((x) => `- \`${P.arquivos[x.a].caminho}\` linha ${x.n}: **${x.tipo}** — ${x.sol}`).join('\n') || 'Nenhum.'}\n\n### 🟡 Atenção (${medios.length})\n\n${medios.map((x) => `- \`${P.arquivos[x.a].caminho}\` linha ${x.n}: **${x.tipo}** — ${x.sol}`).join('\n') || 'Nenhum.'}\n`;
    status('');
  }
  pr += `\n## Passo a passo para recriar\n\n1. Instale o **Node.js** (versão LTS) em nodejs.org.\n2. Baixe os scripts na aba 🧱 Recriar do Cirurgião e dê dois cliques em **recriar.bat** (Windows) — ou rode \`sh recriar.sh\` no Termux/Linux.\n3. ${pk.pacotes.length ? 'Abra o terminal na pasta criada e rode `npm install`' + (scripts.length ? ', depois o comando de iniciar (veja "Comandos do projeto" acima).' : '.') : 'Abra o index.html no navegador.'}\n4. Corrija primeiro os 🔴 graves desta lista (de cima para baixo) e rode o exame de novo.\n5. Antes de publicar, confira 🔑 Chaves expostas.\n`;
  partes.problemas = pr;
  return partes;
}
function b64de(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
