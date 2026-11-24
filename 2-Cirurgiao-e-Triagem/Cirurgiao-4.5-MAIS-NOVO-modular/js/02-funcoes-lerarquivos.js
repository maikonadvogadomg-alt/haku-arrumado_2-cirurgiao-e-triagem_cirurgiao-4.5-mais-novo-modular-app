'use strict';
async function lerArquivos(files, juntar) {
  const prog = $('#prog'); prog.hidden = false;
  const novos = [];
  try {
    for (const [fi, f] of files.entries()) {
      status('⏳ Lendo ' + esc(f.name) + '…');
      let u8 = new Uint8Array(await f.arrayBuffer());
      const ext = extDe(f.name);
      const nomeRel = f.webkitRelativePath || f.name;
      // .tar, .tar.gz, .tgz, .taz, .gz
      if (/\.(tar\.gz|tgz|taz|tar|gz)$/i.test(f.name)) {
        try {
          if (/\.(gz|tgz|taz)$/i.test(f.name) || (u8[0] === 0x1f && u8[1] === 0x8b)) u8 = await gunzip(u8);
          if (/\.(tar\.gz|tgz|taz|tar)$/i.test(f.name) || ehTar(u8)) {
            const pref = files.length > 1 || juntar ? f.name.replace(/\.(tar\.gz|tgz|taz|tar)$/i, '') + '/' : '';
            for (const e of lerTar(u8)) novos.push(novoArquivo(pref + e.nome, e.dados));
          } else novos.push(novoArquivo(f.name.replace(/\.gz$/i, ''), u8));
        } catch (er) { novos.push(Object.assign(novoArquivo(f.name, u8), { bin: true, erro: 'não consegui abrir: ' + er.message })); }
        prog.firstChild.style.width = Math.round(((fi + 1) / files.length) * 100) + '%';
        continue;
      }
      if (EXT_ZIP.test(ext)) {
        const ents = await lerZip(u8, (x) => { prog.firstChild.style.width = Math.round(((fi + x) / files.length) * 100) + '%'; });
        const pref = files.length > 1 || juntar ? f.name.replace(/\.[^.]+$/, '') + '/' : '';
        for (const e of ents) {
          if (e.erro) { novos.push(Object.assign(novoArquivo(pref + e.nome, new Uint8Array()), { bin: true, erro: e.erro })); continue; }
          novos.push(novoArquivo(pref + e.nome, e.dados));
        }
      } else novos.push(novoArquivo(nomeRel, u8));
      prog.firstChild.style.width = Math.round(((fi + 1) / files.length) * 100) + '%';
    }
  } finally { prog.hidden = true; prog.firstChild.style.width = '0'; }
  return novos;
}
async function carregarFiles(lista) {
  const files = [...lista];
  if (!files.length) return;
  const juntar = $('#juntar').checked && P.arquivos.length;
  if (!juntar) { P = { nome: '', arquivos: [] }; atual = -1; marcas = new Map(); R = null; }
  try {
    const novos = await lerArquivos(files, juntar);
    P.arquivos.push(...novos);
    P.arquivos.sort((a, b) => a.caminho.localeCompare(b.caminho));
    if (!P.nome || !juntar) P.nome = files.length === 1 ? files[0].name : files.length + ' arquivos';
    await posCarga();
  } catch (e) { alert('Erro ao abrir: ' + e.message); status('❌ ' + esc(e.message)); }
  finally { $('#arquivo').value = ''; }
}
async function posCarga(semSalvar) {
  status('⏳ Varredura rápida de Replit e problemas graves…');
  await varreduraRapida();
  P._tec = tecnologias();
  renderTudo();
  ir('arq');
  status('✅ ' + esc(P.nome) + ' — ' + fmtN(P.arquivos.length) + ' arquivo(s). Agora use 🔎 Detectar.');
  if (!semSalvar) salvarSessao();
}
async function varreduraRapida() {
  marcas = new Map();
  let t0 = performance.now();
  for (const [a, i] of analisaveis()) {
    a.rep = 0; a.bug = 0;
    const itens = [];
    exameReplit(a, i, itens, true);
    a.rep = itens.length;
    const b = [];
    conflitoMerge(a, i, b);
    a.bug = b.length;
    addMarcas(itens.concat(b));
    if (performance.now() - t0 > 40) { await pausa(); t0 = performance.now(); }
  }
}
function addMarcas(itens) {
  for (const it of itens) {
    if (!marcas.has(it.a)) marcas.set(it.a, new Map());
    const m = marcas.get(it.a);
    if (!m.has(it.n)) m.set(it.n, []);
    const l = m.get(it.n);
    if (!l.some((x) => x.tipo === it.tipo)) l.push({ tipo: it.tipo, sev: it.sev });
  }
}

/* ── Abas ───────────────────────────────────────────────────────────── */
function ir(t) {
  $$('#abas button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
  $$('main>section').forEach((s) => (s.hidden = s.id !== 't-' + t));
  $('#barraSel').hidden = !(t === 'cod' && selLinha);
  if (t === 'ia') medir();
  if (t === 'cmp') infoCmp();
  if (t === 'dep') renderDeps();
  window.scrollTo({ top: 0 });
}

/* ── Lista de arquivos ──────────────────────────────────────────────── */
function renderTudo() {
  $('#projNome').textContent = P.arquivos.length ? P.nome + ' · ' + fmtN(P.arquivos.length) + ' arquivos' : 'Nenhum projeto aberto';
  const tem = P.arquivos.length > 0;
  $('#cardResumo').hidden = !tem; $('#cardLista').hidden = !tem;
  if (!tem) { $('#listaArq').innerHTML = ''; renderSelArq(); return; }
  const ana = analisaveis();
  let linhas = 0, tam = 0;
  for (const a of P.arquivos) tam += a.tam;
  for (const [a] of ana) linhas += nLinhas(a);
  $('#sArq').textContent = fmtN(P.arquivos.length);
  $('#sAna').textContent = fmtN(ana.length);
  $('#sLin').textContent = fmtN(linhas);
  $('#sTam').textContent = fmtB(tam);
  const porMotivo = { pasta: 0, tamanho: 0, 'binário': 0 };
  P.arquivos.forEach((a) => { const m = ignoradoPor(a); if (m) porMotivo[m]++; });
  const rep = P.arquivos.reduce((s, a) => s + (a.rep ? 1 : 0), 0);
  const erros = P.arquivos.filter((a) => a.erro).length;
  let av = '';
  if (rep) av += `<div class="aviso">🚨 <b>${fmtN(rep)} arquivo(s)</b> com marcas da Replit. Toque em “🚨 Com Replit” abaixo, ou vá em 🔎 Detectar → 🚨 Replit.</div>`;
  if (porMotivo.pasta) av += `<div class="info">⏸ ${fmtN(porMotivo.pasta)} arquivo(s) em pastas como node_modules/.git <b>não foram analisados</b> (continuam na lista). <button class="peq" id="bIncluirPastas">Analisar também</button></div>`;
  if (porMotivo.tamanho) av += `<div class="info">⏸ ${fmtN(porMotivo.tamanho)} arquivo(s) acima de ${fmtB(CFG.limiteKB * 1024)} não foram analisados. <button class="peq" id="bIncluirGrandes">Analisar também</button></div>`;
  if (porMotivo['binário']) av += `<div class="small">🔒 ${fmtN(porMotivo['binário'])} arquivo(s) binário(s) (imagens, fontes, .dex…): ficam na lista e vão no .zip, mas não são lidos como texto.</div>`;
  if (erros) av += `<div class="aviso">⚠️ ${erros} arquivo(s) do zip não puderam ser extraídos.</div>`;
  $('#avisosCarga').innerHTML = av;
  $('#bIncluirPastas')?.addEventListener('click', () => { CFG.ignorarPastas = false; salvarCfg(); preencherCfg(); posCarga(true); });
  $('#bIncluirGrandes')?.addEventListener('click', () => { CFG.limiteKB = 0; salvarCfg(); preencherCfg(); posCarga(true); });
  $('#tags').innerHTML = (P._tec || []).map((t) => `<span class="tag">${t}</span>`).join('');
  renderListaArq();
  renderSelArq();
}
function tecnologias() {
  const tem = (re) => analisaveis().some(([a]) => re.test(txt(a)));
  const cam = (re) => P.arquivos.some((a) => re.test(a.caminho));
  const t = [];
  if (cam(/(^|\/)(\.replit|replit\.nix|replit\.md)$/)) t.push('🚨 Projeto Replit');
  if (cam(/package\.json$/)) t.push('📦 Node/npm');
  if (tem(/from\s+['"]react['"]/)) t.push('⚛️ React');
  if (cam(/vite\.config\./)) t.push('⚡ Vite');
  if (tem(/express\(\)/)) t.push('🚂 Express (servidor)');
  if (tem(/drizzle-orm/)) t.push('🗄 Drizzle');
  if (tem(/@neondatabase|DATABASE_URL/)) t.push('🐘 Postgres/Neon');
  if (tem(/supabase/i)) t.push('🟢 Supabase');
  if (tem(/localStorage/)) t.push('🧠 localStorage');
  if (tem(/indexedDB/)) t.push('🗃 IndexedDB');
  if (tem(/capacitor/i) || cam(/capacitor\.config/)) t.push('📱 Capacitor');
  if (cam(/AndroidManifest\.xml|classes\.dex/)) t.push('🤖 APK Android');
  if (tem(/electron/)) t.push('🖥 Electron');
  if (tem(/generativelanguage|gemini/i)) t.push('🤖 Gemini');
  if (tem(/openai|gpt-4|gpt-3/i)) t.push('🤖 OpenAI');
  if (tem(/anthropic|claude-/i)) t.push('🤖 Anthropic');
  if (tem(/groq\.com/)) t.push('🤖 Groq');
  if (cam(/\.py$/)) t.push('🐍 Python');
  if (tem(/processo|advogad|jur[ií]dic|tribunal|\bcpf\b|\bcnis\b|inss/i)) t.push('⚖️ Jurídico');
  return t;
}
