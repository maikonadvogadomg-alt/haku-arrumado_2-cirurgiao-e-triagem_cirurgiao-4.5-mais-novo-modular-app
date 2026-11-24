'use strict';
$('#fBackup').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.app !== 'cirurgiao-4') throw new Error('não é um backup do Cirurgião 4.0');
    const juntar = (atual, novo) => { const ids = new Set(atual.map((x) => x.id || x.data)); return atual.concat((novo || []).filter((x) => !ids.has(x.id || x.data))); };
    notas = juntar(notas, j.notas); historico = juntar(historico, j.historico); gasto = juntar(gasto, j.gasto);
    if (j.cfg) { CFG = { ...CFG_PADRAO, ...j.cfg }; salvarCfg(); preencherCfg(); }
    await Promise.all([DB.set('notas', notas), DB.set('historico', historico), DB.set('gasto', gasto)]);
    renderNotas(); renderHist(); renderGasto(); toast('⬆️ Backup restaurado.');
  } catch (er) { alert('Backup inválido: ' + er.message); }
  e.target.value = '';
});
$('#bMigrar').addEventListener('click', async () => {
  let n = 0;
  try {
    const nt = JSON.parse(localStorage.getItem('cirurgiao_notas') || '[]');
    nt.forEach((x) => { notas.push({ id: +x.id || Date.now() + n, caminho: x.arquivo || '', linha: 0, texto: x.texto, data: x.data }); n++; });
    const hs = JSON.parse(localStorage.getItem('cirurgiao_historico') || '[]');
    hs.forEach((x) => { historico.push({ id: +x.id || Date.now() + n, data: x.data, prov: x.provedor, modelo: '', arquivo: x.arquivo, pergunta: x.pergunta, resposta: x.resposta }); n++; });
    const mem = JSON.parse(localStorage.getItem('cirurgiao_memoria') || '[]');
    const l = await DB.get('projetos', []);
    for (const m of mem) { const id = 'p' + (m.id || Date.now() + n); const dados = new TextEncoder().encode(m.conteudo || ''); await DB.set('proj:' + id, { nome: m.nome, data: m.data, arquivos: [{ caminho: m.nome, dados, bin: false, texto: null, original: null, editado: false }] }); l.push({ id, nome: m.nome, data: m.data, n: 1, tam: dados.length, edit: 0 }); n++; }
    await Promise.all([DB.set('notas', notas), DB.set('historico', historico), DB.set('projetos', l)]);
    renderNotas(); renderHist(); renderMem();
    alert(n ? `📥 ${n} item(ns) trazidos da 3.0.` : 'Não achei dados da 3.0 neste navegador. (Só funciona se a 3.0 foi aberta no MESMO endereço/arquivo.)');
  } catch (e) { alert('Erro: ' + e.message); }
});
$('#bApagarTudo').addEventListener('click', async () => { if (!confirm('Apagar notas, histórico, gasto, projetos guardados, chaves e ajustes DESTE aparelho?')) return; await DB.limpar(); location.reload(); });

/* ── Comparar duas versões e transplantar ───────────────────────────── */
let PB = null;      // versão doadora (B)
let CMP = null;     // último resultado da comparação
let cmpAba = 'rotas';
const feitos = new Set();
const chaveDe = (a, raiz) => (raiz && a.caminho.startsWith(raiz) ? a.caminho.slice(raiz.length) : a.caminho);
$('#bAbrirB').addEventListener('click', () => $('#arquivoB').click());
$('#arquivoB').addEventListener('change', async (e) => {
  const files = [...e.target.files]; if (!files.length) return;
  try {
    const arqs = await lerArquivos(files, false);
    arqs.sort((x, y) => x.caminho.localeCompare(y.caminho));
    PB = { nome: files.length === 1 ? files[0].name : files.length + ' arquivos', arquivos: arqs };
    CMP = null; $('#cmpRes').hidden = true; feitos.clear();
    infoCmp(); status('✅ Versão B aberta. Toque em 🔀 Comparar.');
  } catch (er) { alert('Erro ao abrir a versão B: ' + er.message); }
  finally { e.target.value = ''; }
});
$('#bTrocarAB').addEventListener('click', async () => {
  if (P.arquivos.some((a) => a.editado) && !confirm('O A tem edições. Ao trocar, ele vira o B (doador) e as edições continuam nele, mas o zip baixado sai do novo A. Trocar?')) return;
  const velho = P; P = PB; PB = velho; atual = -1; marcas = new Map(); R = null; CMP = null; feitos.clear();
  $('#cmpRes').hidden = true; $('#cardRes').hidden = true;
  await posCarga(); ir('cmp');
});

const OBJ_ROTA = /^(app|router|server|routes|r|\w*[Rr]outer|\w*App|\w*Routes)$/;
const ARQ_CODIGO = /^(js|mjs|cjs|ts|tsx|jsx|vue|svelte|html?)$/;
const inicioLinha = (t, pos) => t.lastIndexOf('\n', pos - 1) + 1;
const linhasDe = (t) => t.replace(/\r\n/g, '\n').split('\n');

$('#bComparar').addEventListener('click', comparar);
const ABAS_CMP = [['rotas', '🛣 Rotas/telas que faltam no A'], ['funcs', '🧩 Funções que faltam no A'], ['soB', '📄 Arquivos só no B'], ['dif', '✏️ Arquivos diferentes'], ['soA', '🅰️ Só no A']];
$('#cmpChips').addEventListener('click', (e) => { const c = e.target.closest('[data-c]'); if (c) { cmpAba = c.dataset.c; renderCmp(); } });
$('#cmpFiltro').addEventListener('input', renderCmp);
$('#cmpLista').addEventListener('click', async (e) => {
  const r = e.target.closest('.ri'); if (!r) return;
  if (r.dataset.a) return abrirArquivo(+r.dataset.a);
  const x = CMP[cmpAba][+r.dataset.idx];
  const ac = e.target.closest('[data-ac]')?.dataset.ac || r.dataset.ac;
  if (ac === 'verB') { const a = PB.arquivos[x.i]; modalTexto(`🅱️ ${x.k} — ${a.caminho}, linha ${x.n}`, x.bloco); }
  if (ac === 'verArqB') { const a = PB.arquivos[x.ib]; modalTexto('🅱️ ' + a.caminho, txt(a), [['➕ Copiar para o A', async () => { copiarDoB(x); fecharModal(); await posEdicao(); renderCmp(); }]]); }
  if (ac === 'trans') transplantarVarios([x]);
  if (ac === 'copiar') { copiarDoB(x); await posEdicao(); renderCmp(); toast('➕ Copiado: ' + esc(x.k)); }
  if (ac === 'diff') verDiff(x);
  if (ac === 'usarB') { if (!confirm(`Trocar o conteúdo de “${P.arquivos[x.ia].caminho}” pelo do B?\n(O original do A fica guardado: ↩ Desfazer no arquivo.)`)) return; const aB = PB.arquivos[x.ib]; if (aB.bin) { const a = P.arquivos[x.ia]; a.dados = aB.dados; a.tam = aB.tam; } else aplicarTexto(x.ia, txt(aB)); feitos.add('dif|' + x.k); await posEdicao(); renderCmp(); }
});
let _diffEstado = null;

/* ── 📦 Dependências: português, npm de verdade, versões que não existem ── */
// [tipo, explicação]. Tipos: app (o app precisa), montar (só para montar/testar), tipos (TypeScript)
const DIC = {
  react: ['app', 'Monta as telas do app (botões, páginas, formulários)'], 'react-dom': ['app', 'Mostra as telas do React no navegador'], vue: ['app', 'Monta as telas do app (alternativa ao React)'], svelte: ['app', 'Monta as telas do app (alternativa ao React)'], next: ['app', 'Site/app em React com servidor junto (Next.js)'], 'react-router-dom': ['app', 'Troca de página dentro do app React'], wouter: ['app', 'Troca de página dentro do app (versão leve)'], 'react-router': ['app', 'Troca de página dentro do app React'],
  express: ['app', 'O servidor: recebe os pedidos da tela (/api/…) e responde'], fastify: ['app', 'Servidor (alternativa mais rápida ao Express)'], koa: ['app', 'Servidor (alternativa ao Express)'], cors: ['app', 'Deixa a tela falar com o servidor de outro endereço'], 'body-parser': ['app', 'Lê os dados que a tela manda ao servidor (o Express já faz isso sozinho)'], 'cookie-parser': ['app', 'Lê os cookies (login) no servidor'], 'express-session': ['app', 'Mantém o login entre uma página e outra'], 'connect-pg-simple': ['app', 'Guarda o login no banco Postgres'], memorystore: ['app', 'Guarda o login na memória do servidor'], passport: ['app', 'Login (usuário e senha, Google…)'], 'passport-local': ['app', 'Login com usuário e senha'], jsonwebtoken: ['app', 'Cria e confere "crachás" de login (JWT)'], bcrypt: ['app', 'Embaralha senhas antes de guardar (precisa compilar)'], bcryptjs: ['app', 'Embaralha senhas antes de guardar'], helmet: ['app', 'Proteções de segurança do servidor'], multer: ['app', 'Recebe arquivos enviados (upload) no servidor'], 'express-rate-limit': ['app', 'Limita pedidos repetidos (contra abuso)'], compression: ['app', 'Compacta as respostas do servidor'], morgan: ['app', 'Mostra no terminal cada pedido que chega'], pino: ['app', 'Registra o que o servidor faz (log)'], 'pino-http': ['app', 'Registra cada pedido no log'], 'pino-pretty': ['montar', 'Deixa o log bonito no terminal'], ws: ['app', 'Conexão ao vivo (WebSocket) — terminal, chat'], 'socket.io': ['app', 'Conexão ao vivo entre tela e servidor'], 'socket.io-client': ['app', 'Conexão ao vivo (lado da tela)'], dotenv: ['app', 'Lê o arquivo .env (chaves e senhas)'], zod: ['app', 'Confere se os dados estão no formato certo'], yup: ['app', 'Confere dados de formulário'], joi: ['app', 'Confere dados (validação)'],
  axios: ['app', 'Faz pedidos à internet/API (como o fetch)'], 'node-fetch': ['app', 'fetch para Node antigo (Node 18+ já tem fetch)'], ky: ['app', 'Faz pedidos à internet (leve)'], got: ['app', 'Faz pedidos à internet (Node)'],
  pg: ['app', 'Conecta no banco Postgres'], postgres: ['app', 'Conecta no banco Postgres'], '@neondatabase/serverless': ['app', 'Conecta no banco Neon (Postgres na nuvem)'], 'drizzle-orm': ['app', 'Fala com o banco de dados sem escrever SQL na mão'], 'drizzle-kit': ['montar', 'Cria/atualiza as tabelas do banco (drizzle)'], 'drizzle-zod': ['app', 'Gera validação a partir das tabelas'], prisma: ['montar', 'Ferramenta do banco Prisma'], '@prisma/client': ['app', 'Fala com o banco (Prisma)'], mongoose: ['app', 'Conecta no MongoDB'], sqlite3: ['app', 'Banco SQLite num arquivo (precisa compilar)'], 'better-sqlite3': ['app', 'Banco SQLite num arquivo (precisa compilar)'], 'sql.js': ['app', 'Banco SQLite que roda no navegador'], '@electric-sql/pglite': ['app', 'Banco Postgres que roda local, sem instalar nada'], '@supabase/supabase-js': ['app', 'Conecta no Supabase (banco + login)'], firebase: ['app', 'Conecta no Firebase do Google'], 'node-sql-parser': ['app', 'Lê e entende comandos SQL'],
  openai: ['app', 'Fala com a IA da OpenAI (ou compatíveis)'], '@anthropic-ai/sdk': ['app', 'Fala com a IA Claude'], '@google/genai': ['app', 'Fala com a IA Gemini (Google)'], '@google/generative-ai': ['app', 'Fala com a IA Gemini (versão antiga)'], 'groq-sdk': ['app', 'Fala com a IA da Groq'], ollama: ['app', 'Fala com a IA local Ollama'], 'msedge-tts': ['app', 'Voz neural da Microsoft (Francisco/Francisca)'], 'node-edge-tts': ['app', 'Voz neural da Microsoft (Edge)'], 'edge-tts': ['app', 'Voz neural da Microsoft'],
  'pdf-parse': ['app', 'Tira o texto de PDFs'], 'pdfjs-dist': ['app', 'Lê e mostra PDFs'], 'pdf-lib': ['app', 'Cria e edita PDFs'], jspdf: ['app', 'Cria PDFs no navegador'], pdfkit: ['app', 'Cria PDFs no servidor'], mammoth: ['app', 'Tira o texto de arquivos Word (.docx)'], docx: ['app', 'Cria arquivos Word (.docx)'], xlsx: ['app', 'Lê e cria planilhas Excel'], exceljs: ['app', 'Lê e cria planilhas Excel'], 'tesseract.js': ['app', 'Lê texto de imagem (OCR)'], jszip: ['app', 'Abre e cria arquivos .zip'], 'file-saver': ['app', 'Baixa arquivos pelo navegador'], 'mime-types': ['app', 'Descobre o tipo do arquivo pela extensão'], marked: ['app', 'Transforma Markdown em HTML'], 'react-markdown': ['app', 'Mostra texto Markdown no React'], 'remark-gfm': ['app', 'Tabelas e listas no Markdown'], 'highlight.js': ['app', 'Pinta o código com cores'], 'rehype-highlight': ['app', 'Pinta o código com cores (Markdown)'], dompurify: ['app', 'Limpa HTML perigoso antes de mostrar'], cheerio: ['app', 'Lê páginas HTML no servidor (raspar site)'], puppeteer: ['app', 'Abre um navegador escondido para automatizar sites (pesado)'], playwright: ['montar', 'Testa/automatiza sites com navegador'],
  '@monaco-editor/react': ['app', 'O editor de código do VS Code dentro da tela'], 'monaco-editor': ['app', 'O editor de código do VS Code'], '@xterm/xterm': ['app', 'A tela do terminal'], xterm: ['app', 'A tela do terminal'], '@xterm/addon-fit': ['app', 'Ajusta o terminal ao tamanho da tela'], 'node-pty': ['app', 'Terminal de verdade no servidor (precisa compilar)'], '@webcontainer/api': ['app', 'Roda Node dentro do navegador (StackBlitz)'], 'isomorphic-git': ['app', 'Git dentro do navegador/Node'], '@isomorphic-git/lightning-fs': ['app', 'Pasta de arquivos dentro do navegador (para o git)'], '@octokit/rest': ['app', 'Fala com o GitHub'],
  '@tanstack/react-query': ['app', 'Busca e guarda dados do servidor na tela'], 'lucide-react': ['app', 'Ícones'], 'react-icons': ['app', 'Ícones'], 'framer-motion': ['app', 'Animações'], recharts: ['app', 'Gráficos'], 'chart.js': ['app', 'Gráficos'], 'date-fns': ['app', 'Datas (formatar, somar dias)'], dayjs: ['app', 'Datas (leve)'], moment: ['app', 'Datas (antiga, pesada)'], clsx: ['app', 'Junta nomes de classe CSS'], 'class-variance-authority': ['app', 'Variações de estilo dos componentes'], 'tailwind-merge': ['app', 'Junta classes do Tailwind sem conflito'], 'react-hook-form': ['app', 'Formulários'], '@hookform/resolvers': ['app', 'Liga o formulário à validação'], sonner: ['app', 'Avisos pop-up (toast)'], cmdk: ['app', 'Menu de comandos'], 'embla-carousel-react': ['app', 'Carrossel'], vaul: ['app', 'Gaveta que sobe (celular)'], 'input-otp': ['app', 'Campo de código (OTP)'], 'next-themes': ['app', 'Tema claro/escuro'], 'react-day-picker': ['app', 'Calendário'], 'react-resizable-panels': ['app', 'Painéis que redimensionam'], uuid: ['app', 'Gera códigos únicos'], nanoid: ['app', 'Gera códigos únicos curtos'], lodash: ['app', 'Funções úteis variadas'], qrcode: ['app', 'Gera QR Code'], '@capacitor/core': ['app', 'Transforma o site em app Android/iPhone'], '@capacitor/android': ['app', 'Parte Android do Capacitor'], '@capacitor/cli': ['montar', 'Comandos do Capacitor'],
  vite: ['montar', 'Monta (empacota) o site e roda em modo de teste'], '@vitejs/plugin-react': ['montar', 'Plugin do Vite para React'], typescript: ['montar', 'Confere os tipos do TypeScript'], tsx: ['montar', 'Roda arquivos .ts direto no Node'], 'ts-node': ['montar', 'Roda arquivos .ts direto no Node'], esbuild: ['montar', 'Empacotador muito rápido'], webpack: ['montar', 'Empacotador (antigo)'], nodemon: ['montar', 'Reinicia o servidor quando o código muda'], concurrently: ['montar', 'Roda dois comandos ao mesmo tempo'], 'cross-env': ['montar', 'Variáveis de ambiente que funcionam no Windows'], tailwindcss: ['montar', 'Estilo/CSS por classes'], '@tailwindcss/vite': ['montar', 'Tailwind dentro do Vite'], postcss: ['montar', 'Processa o CSS'], autoprefixer: ['montar', 'Ajusta CSS para navegadores antigos'], eslint: ['montar', 'Verifica erros de escrita no código'], prettier: ['montar', 'Arruma a formatação do código'], vitest: ['montar', 'Testes automáticos'], jest: ['montar', 'Testes automáticos'], electron: ['montar', 'Transforma em programa de computador (.exe)'], 'electron-builder': ['montar', 'Gera o instalador .exe'], 'electron-vite': ['montar', 'Vite para apps Electron'], pkg: ['montar', 'Transforma o servidor em .exe'], '@replit/vite-plugin-cartographer': ['montar', '⚠️ Plugin da Replit — remova fora da Replit'], '@replit/vite-plugin-runtime-error-modal': ['montar', '⚠️ Plugin da Replit — remova fora da Replit'],
};
const NPM = new Map();      // nome → { estado, descricao, ultima, versoes[], depreciado, licenca, home }
let DIC_IA = {};            // explicações que a IA traduziu (guardadas)
let depFiltro = 'todas';
// ── Versões (semver simplificado: ^ ~ >= <= > < x * ||) ──
const numV = (v) => String(v).replace(/^v/, '').split(/[.+-]/).slice(0, 3).map((x) => parseInt(x, 10) || 0);
const cmpV = (a, b) => { for (let k = 0; k < 3; k++) { if (a[k] !== b[k]) return a[k] < b[k] ? -1 : 1; } return 0; };
const nomeUrl = (nome) => nome.replace('/', '%2F');
$('#bDepVer').addEventListener('click', conferirTodas);
$('#bDepIA').addEventListener('click', explicarComIA);
$('#bDepLimpo').addEventListener('click', packageLimpo);
$('#bDepRel').addEventListener('click', relatorioDeps);
$('#depFiltro').addEventListener('input', renderDeps);
$('#depChips').addEventListener('click', (e) => { const c = e.target.closest('[data-df]'); if (c) { depFiltro = c.dataset.df; renderDeps(); } });
$('#depLista').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-da]'); if (!b) return;
  const nome = b.closest('[data-dep]').dataset.dep;
  if (b.dataset.da === 'site') return window.open('https://www.npmjs.com/package/' + nome, '_blank', 'noopener');
  if (b.dataset.da === 'npm') { b.innerHTML = '<span class="spin"></span>'; NPM.delete(nome); await npmInfo(nome); renderDeps(); return; }
  if (b.dataset.da === 'cdn') { const n = NPM.get(nome); const v = n && n.ultima ? '@' + n.ultima : ''; modalTexto('🌐 ' + nome + ' por CDN (sem instalar)', `Para usar no navegador sem npm install, troque o import por um destes:\n\n// jsDelivr\nimport x from "https://cdn.jsdelivr.net/npm/${nome}${v}/+esm";\n\n// esm.sh\nimport x from "https://esm.sh/${nome}${v}";\n\n// unpkg (arquivo pronto, quando existir)\n<script src="https://unpkg.com/${nome}${v}"><\/script>\n\nObs.: bibliotecas de servidor (express, pg, fs…) NÃO funcionam no navegador, com ou sem CDN.`); }
});
$('#termIr').addEventListener('click', termRodar);
$('#termEntrada').addEventListener('keydown', (e) => { if (e.key === 'Enter') termRodar(); });
$('#bPlano').addEventListener('click', async () => {
  const b = $('#bPlano'); b.disabled = true; b.innerHTML = '<span class="spin"></span> montando…';
  try { const p = await gerarPlano(); if (!p) return; const md = p.resumo + '\n' + p.deps + '\n' + p.problemas; modalTexto('📝 Plano completo', md, [['⬇️ Baixar plano.md', () => baixar(md, 'plano-' + (P.nome.replace(/\.[^.]+$/, '') || 'projeto') + '.md', 'text/markdown')], ['📌 Virar nota', () => novaNota('', 0, md)]]); }
  catch (e) { alert('Erro: ' + e.message); } finally { b.disabled = false; b.innerHTML = '📝 Gerar plano'; }
});
$('#bPlanoPartes').addEventListener('click', async () => {
  const p = await gerarPlano(); if (!p) return;
  const nome = P.nome.replace(/\.[^.]+$/, '') || 'projeto';
  baixar(escreverZip([['1-resumo-e-estrutura.md', p.resumo], ['2-dependencias.md', p.deps], ['3-problemas-e-passos.md', p.problemas]].map(([n, t]) => ({ nome: n, dados: new TextEncoder().encode(t) }))), 'plano-' + nome + '-3-partes.zip');
});
