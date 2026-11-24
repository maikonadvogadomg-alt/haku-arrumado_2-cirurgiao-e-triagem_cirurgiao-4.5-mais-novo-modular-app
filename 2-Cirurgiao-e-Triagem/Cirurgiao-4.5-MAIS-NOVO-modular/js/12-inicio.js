'use strict';
/* ── Regras de detecção ─────────────────────────────────────────────── */
const R_REPLIT = [
  { re: /\b[\w-]+\.(?:replit\.(?:com|dev|app)|repl\.co)\b|\breplit\.(?:com|dev|app)\b|replit-dev\.com|\.replit\.dev/gi, sev: 'alta', tipo: '🌐 Endereço da Replit', sol: 'Esse endereço morre quando o projeto sai da Replit. Troque pelo seu (GitHub Pages, Netlify, Vercel) ou por caminho relativo.' },
  { re: /\bREPL_(?:ID|SLUG|OWNER|IDENTITY|PUBKEYS|LANGUAGE|IMAGE)\b/g, sev: 'alta', tipo: '🔑 Variável REPL_*', sol: 'Só existe dentro da Replit. Remova ou troque por um valor fixo/variável sua (.env).' },
  { re: /\bREPLIT_[A-Z0-9_]+\b/g, sev: 'alta', tipo: '🔑 Variável REPLIT_*', sol: 'Só existe dentro da Replit (domínios, banco, deploy). Troque por variável sua no .env ou valor fixo.' },
  { re: /@replit\/[\w.-]+/g, sev: 'alta', tipo: '📦 Pacote @replit/', sol: 'Plugin/pacote da Replit (cartographer, runtime-error-modal, database, object-storage…). Remova do package.json e do vite.config; troque banco/armazenamento por alternativa sua.' },
  { re: /__replauth\w*|x-replit-user[\w-]*|getReplitUser|replit\s*auth|ReplitAuth/gi, sev: 'alta', tipo: '🔐 Login da Replit (Replit Auth)', sol: 'O login da Replit não funciona fora dela. Troque por login próprio (Supabase Auth, senha local).' },
  { re: /\bAI_INTEGRATIONS_[A-Z0-9_]+\b/g, sev: 'alta', tipo: '🤖 IA paga via Replit (AI Integrations)', sol: 'A IA passa pela conta da Replit e para quando você para de pagar. Troque pela chamada direta ao provedor com SUA chave.' },
  { re: /127\.0\.0\.1:1106|replit-objstore|objectStorageClient/gi, sev: 'alta', tipo: '🗄 Armazenamento de arquivos da Replit', sol: 'Object Storage da Replit (sidecar 1106). Troque por pasta local, IndexedDB ou Supabase Storage.' },
  { re: /@google-cloud\/storage/g, sev: 'media', tipo: '🗄 Google Cloud Storage', sol: 'Na Replit isso costuma ser o Object Storage dela (só funciona lá dentro). Confira; se for, troque por pasta local, IndexedDB ou Supabase Storage.' },
  { re: /\/api\/(?:code-assistant|tts)\b/g, sev: 'alta', tipo: '🔗 Rota de servidor da Replit', sol: 'Essa rota só existia no servidor da Replit. Chame a IA direto (com sua chave) ou use a voz do navegador (speechSynthesis).' },
  { re: /@workspace\/[\w.-]+/g, sev: 'media', tipo: '📦 Pacote interno @workspace/', sol: 'Pacote do monorepo da Replit. Ele precisa vir junto (pasta lib/ ou packages/) e estar no package.json da raiz como workspace — senão o build falha.' },
  { re: /process\.env\.(?:PORT|BASE_PATH)\b/g, sev: 'media', tipo: '⚙️ PORT/BASE_PATH obrigatórios', sol: 'A Replit define PORT e BASE_PATH sozinha. Fora dela, dê um valor padrão: process.env.PORT || 5000 e process.env.BASE_PATH || "/".' },
  { re: /@neondatabase\/serverless|\bDATABASE_URL\b/g, sev: 'media', tipo: '🐘 Banco criado pela Replit (Neon)', sol: 'O banco era provisionado pela Replit. Crie o seu (Neon/Supabase grátis) e ponha a URL no .env, ou use banco local (PGlite).' },
  { re: /\bSESSION_SECRET\b/g, sev: 'media', tipo: '🔑 Segredo do painel Secrets', sol: 'Vinha do painel Secrets da Replit. Coloque no arquivo .env (que NUNCA vai para o GitHub).' },
  { re: /["'`]\/tmp\//g, sev: 'media', tipo: '📁 Pasta /tmp do Linux', sol: 'Não existe no Windows. Use os.tmpdir() do Node.' },
  { re: /spawn\(\s*["'`](?:sh|bash|python3?)["'`]|edge[-_]tts/g, sev: 'media', tipo: '🐧 Comando de Linux/Python', sol: 'Depende de programas que a Replit tinha instalados. No Windows/celular falha: troque por pacote Node (ex.: msedge-tts) ou recurso do navegador.' },
  { re: /secure:\s*true/g, sev: 'media', tipo: '🍪 Cookie só em https', sol: 'Com secure:true o login não funciona em http://localhost. Use secure:"auto".' },
  { re: /(?<![\w.-])\.replit(?![\w.-])|replit\.nix\b/g, sev: 'info', tipo: '⚙️ Menção a arquivo de config da Replit', sol: 'Arquivo de configuração da Replit — pode ignorar/remover.' },
  { re: /process\.env\.[A-Z_][A-Z0-9_]*/g, sev: 'info', tipo: '🔑 Variável de ambiente', sol: 'Confira se ela existe no seu .env. Na Replit vinha do painel Secrets.' },
];
const ARQ_REPLIT = /(^|\/)(\.replit|replit\.nix|replit\.md|\.replitignore|replit_zip_error_log\.txt)$|(^|\/)\.(upm|pythonlibs)\//;
const R_BUGS = [
  { re: /^(?:<{7}|={7}|>{7})(?: |$)/gm, sev: 'alta', tipo: '🔴 Marca de conflito do Git (<<<<<<<)', sol: 'Sobrou de um merge mal resolvido. Escolha uma das versões e apague as marcas <<<<<<< ======= >>>>>>>.' },
  { re: /=\s*(?:async\s*)?<[A-Z]\w*>\s*\(/g, ext: /^tsx$/, sev: 'alta', tipo: '🔴 Genérico <T>( em .tsx', sol: 'Em .tsx o <T> vira tag JSX e quebra o build. Troque <T>( por <T,>(' },
  { re: /\beval\s*\(/g, sev: 'alta', tipo: '🔴 eval()', sol: 'Perigoso e bloqueado em muitos lugares (CSP, APK). Evite.' },
  { re: /catch\s*(?:\(\s*\w*\s*\))?\s*\{\s*\}/g, sev: 'media', tipo: '🙈 Erro engolido (catch vazio)', sol: 'Se der erro aqui, ninguém fica sabendo. Mostre ou registre o erro: catch(e){ console.error(e) }.' },
  { re: /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/g, sev: 'media', tipo: '🌐 Endereço local fixo', sol: 'Só funciona no computador onde roda o servidor. Em APK/site, use caminho relativo ou endereço configurável.' },
  { re: /document\.write\s*\(/g, sev: 'media', tipo: '⚠️ document.write', sol: 'Apaga a página se rodar depois de carregar. Use elemento.innerHTML/appendChild.' },
  { re: /JSON\.parse\(\s*localStorage\.getItem\([^)]*\)\s*\)/g, sev: 'media', tipo: '⚠️ JSON.parse(localStorage) sem proteção', sol: 'Se o dado salvo estiver vazio/corrompido, o app trava. Use: JSON.parse(localStorage.getItem(k) || "[]") dentro de try/catch.' },
  { re: /\bthrow\s+["'`]/g, sev: 'info', tipo: '⚠️ throw com texto simples', sol: 'Prefira throw new Error("…") (guarda a linha do erro).' },
  { re: /[^=!<>]==[^=]/g, sev: 'estilo', tipo: '✳️ Comparação fraca ==', sol: 'Normalmente funciona; === é mais seguro.' },
  { re: /\bvar\s+[\w$]+/g, ext: /^(js|mjs|cjs|jsx|ts|tsx|html?)$/, sev: 'estilo', tipo: '✳️ var', sol: 'Funciona; let/const evitam confusão de escopo.' },
  { re: /innerHTML\s*\+=/g, sev: 'estilo', tipo: '✳️ innerHTML +=', sol: 'Lento em listas grandes e apaga eventos. Monte o texto e atribua uma vez.' },
  { re: /\bXMLHttpRequest\b/g, sev: 'estilo', tipo: '✳️ XMLHttpRequest', sol: 'Funciona; fetch() é mais simples.' },
  { re: /setTimeout\s*\([^,]+,\s*0\s*\)/g, sev: 'estilo', tipo: '✳️ setTimeout(…, 0)', sol: 'Gambiarra de tempo; às vezes esconde um problema de ordem.' },
];
const R_SEGREDOS = [
  { re: /AIza[0-9A-Za-z_\-]{35}/g, tipo: '🔑 Chave Google/Gemini' },
  { re: /\bAQ\.[0-9A-Za-z_\-]{30,}/g, tipo: '🔑 Chave Google/Gemini (nova, AQ.)' },
  { re: /sk-ant-[A-Za-z0-9_\-]{20,}/g, tipo: '🔑 Chave Anthropic' },
  { re: /sk-or-[A-Za-z0-9_\-]{20,}/g, tipo: '🔑 Chave OpenRouter' },
  { re: /\bsk-(?:proj-)?[A-Za-z0-9_\-]{20,}/g, tipo: '🔑 Chave OpenAI/compatível' },
  { re: /\bgsk_[A-Za-z0-9]{20,}/g, tipo: '🔑 Chave Groq' },
  { re: /\bxai-[A-Za-z0-9]{20,}/g, tipo: '🔑 Chave xAI' },
  { re: /\bpplx-[A-Za-z0-9]{20,}/g, tipo: '🔑 Chave Perplexity' },
  { re: /\b(?:ghp|gho|ghs|ghu)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}/g, tipo: '🔑 Token do GitHub' },
  { re: /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g, tipo: '🔐 CHAVE PRIVADA (PEM)' },
  { re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, tipo: '🎫 Token JWT (ver se é service_role)' },
  { re: /postgres(?:ql)?:\/\/[^:\s'"]+:[^@\s'"]+@[^\s'"]+/g, tipo: '🐘 URL de banco com senha' },
  { re: /\b(?:password|senha|secret|api[_-]?key|token)\s*[:=]\s*["'`][^"'`\s]{6,}["'`]/gi, tipo: '🔑 Senha/chave escrita no código' },
];
const EX = {};
EX.replit = async (lista) => {
  const itens = await porArquivo(lista, (a, i, it) => exameReplit(a, i, it, false));
  // Arquivos de config da Replit que estão fora da lista analisada (ex.: .replit é pequeno, mas pode estar em pasta ignorada)
  return { titulo: '🚨 Marcas da Replit', itens, vazio: 'Nenhuma marca da Replit encontrada. 🎉', dica: 'Vermelho = para de funcionar fora da Replit. Amarelo = precisa ajuste para rodar no seu PC. Azul = só conferir.' };
};
EX.bugs = async (lista) => {
  const itens = await porArquivo(lista, (a, i, it) => { varrer(a, i, R_BUGS, it); idsDuplicados(a, i, it); declDuplicadas(a, i, it); });
  return { titulo: '🐛 Bugs comuns', itens, vazio: 'Nenhum bug comum encontrado. Isso não garante que a lógica esteja certa — para isso use ✅ Sintaxe e a 🤖 IA.', dica: CFG.estilo ? '' : 'Avisos de estilo (==, var…) estão escondidos — ligue em ⚙️ Ajustes se quiser ver.' };
};
let _acorn = null;
const SCRIPT_JS = /^(|text\/javascript|application\/javascript|module|text\/ecmascript)$/i;
EX.sintaxe = async (lista) => {
  const ac = await acornPronto();
  let semAcorn = 0;
  const itens = await porArquivo(lista, (a, i, it) => {
    const t = txt(a);
    if (a.ext === 'json' || (a.ext === 'map' && t.trim().startsWith('{'))) {
      if (!t.trim()) return;
      try { JSON.parse(t); } catch (e) {
        const pm = /position (\d+)/.exec(e.message); const lm = /line (\d+)/.exec(e.message);
        const n = pm ? linhaDe(a, +pm[1]) : lm ? +lm[1] : 1;
        it.push({ a: i, n, col: 0, len: 0, sev: 'alta', tipo: '🔴 JSON inválido', sol: 'O arquivo não abre como JSON (' + e.message + '). Costuma ser vírgula sobrando no fim, aspas simples ou comentário — JSON não aceita.' });
      }
      return;
    }
    if (/^(js|mjs|cjs)$/.test(a.ext)) {
      if (!ac) { semAcorn++; balanco(a, i, it); return; }
      const e = parseJS(ac, t);
      if (e) it.push({ a: i, n: e.loc?.line || 1, col: e.loc?.column || 0, len: 1, sev: 'alta', tipo: '🔴 Erro de sintaxe (o arquivo não roda)', sol: traduzErro(e.message) });
      return;
    }
    if (/^html?$/.test(a.ext)) {
      const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi; let m;
      while ((m = re.exec(t))) {
        const attrs = m[1];
        if (/\bsrc\s*=/.test(attrs)) continue;
        const tipo = (/\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs) || [])[1] || '';
        if (!SCRIPT_JS.test(tipo)) continue;
        const ini = m.index + m[0].indexOf('>') + 1;
        const base = linhaDe(a, ini);
        if (!ac) { semAcorn++; continue; }
        const e = parseJS(ac, m[2]);
        if (e) { const n = base + (e.loc?.line || 1) - 1; it.push({ a: i, n, col: e.loc?.column || 0, len: 1, sev: 'alta', tipo: '🔴 Erro de sintaxe no <script>', sol: traduzErro(e.message) + ' — quando isso acontece, NENHUMA função deste <script> funciona (botões “mortos”).' }); }
      }
      return;
    }
    if (/^(ts|tsx|jsx|css|scss|less)$/.test(a.ext)) balanco(a, i, it);
  });
  return { titulo: '✅ Exame de sintaxe', itens, vazio: 'Nenhum erro de sintaxe encontrado nos arquivos .js, .html (scripts internos) e .json.' + (ac ? '' : ' (Sem internet: usei só a contagem de chaves e parênteses.)'), dica: (ac ? '.js, .json e <script> do .html: verificação exata (mesmo leitor que os navegadores usam). ' : '⚠️ Sem internet para baixar o verificador exato — usei a contagem de { ( [. ') + '.ts/.tsx/.jsx/.css: contagem de { ( [ — pode dar alarme falso, confira.' + (semAcorn ? ` (${semAcorn} script(s) sem verificação exata.)` : '') };
};
EX.refs = async (lista) => {
  const caminhos = new Set(P.arquivos.map((a) => a.caminho));
  const deps = new Set(), pkgs = [];
  for (const a of P.arquivos) if (/(^|\/)package\.json$/.test(a.caminho) && !/node_modules\//.test(a.caminho)) {
    try { const j = JSON.parse(txt(a)); pkgs.push(a.caminho); for (const k of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) Object.keys(j[k] || {}).forEach((d) => deps.add(d)); if (j.name) deps.add(j.name); } catch {}
  }
  const NODE = new Set('assert buffer child_process cluster crypto dgram dns events fs http http2 https module net os path perf_hooks process querystring readline stream string_decoder timers tls tty url util v8 vm worker_threads zlib fs/promises stream/promises timers/promises'.split(' '));
  const existe = (base, rel) => {
    const partes = (base ? base.split('/') : []);
    for (const s of rel.split('/')) { if (s === '..') partes.pop(); else if (s && s !== '.') partes.push(s); }
    const p = partes.join('/');
    const cands = [p, ...['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.vue', '.svelte'].map((e) => p + e), ...['/index.ts', '/index.tsx', '/index.js', '/index.jsx'].map((e) => p + e)];
    // import "./x.js" que na verdade é x.ts (padrão TS)
    if (/\.js$/.test(p)) cands.push(p.replace(/\.js$/, '.ts'), p.replace(/\.js$/, '.tsx'));
    return cands.some((c) => caminhos.has(c));
  };
  const existeSufixo = (p) => { const s = '/' + p.replace(/^\/+/, ''); for (const c of caminhos) if (('/' + c).endsWith(s)) return true; return false; };
  const itens = await porArquivo(lista, (a, ai, it) => {
    const t = txt(a), dir = a.caminho.includes('/') ? a.caminho.slice(0, a.caminho.lastIndexOf('/')) : '';
    const add = (pos, len, sev, tipo, sol) => { const n = linhaDe(a, pos); it.push({ a: ai, n, col: pos - inicios(a)[n - 1], len, sev, tipo, sol }); };
    if (/^(js|mjs|cjs|jsx|ts|tsx|vue|svelte)$/.test(a.ext) || /^html?$/.test(a.ext)) {
      const re = /(?:\bimport\s+(?:[\w*${}\s,]+\s+from\s+)?|\bexport\s+(?:[\w*${}\s,]+\s+)?from\s+|\bimport\s*\(\s*|\brequire\s*\(\s*)["'`]([^"'`]+)["'`]/g; let m;
      while ((m = re.exec(t))) {
        const s = m[1], pos = m.index + m[0].lastIndexOf(s);
        if (/^https?:|^data:|^\/\//.test(s)) continue;
        if (s.startsWith('.')) { if (!existe(dir, s)) add(pos, s.length, 'alta', '📎 Arquivo importado não existe', `“${s}” não está no projeto. O build/execução vai falhar com “Cannot find module”. Ele pode ter ficado de fora do zip.`); continue; }
        if (s.startsWith('/')) { if (!existeSufixo(s)) add(pos, s.length, 'media', '📎 Caminho absoluto não encontrado', `“${s}” não foi achado no projeto.`); continue; }
        if (/^[@~#]\//.test(s)) { const resto = s.slice(2); if (!['src/', 'client/src/', 'app/', ''].some((p) => existe('', p + resto)) && !existeSufixo(resto) && !existeSufixo(resto + '.ts') && !existeSufixo(resto + '.tsx') && !existeSufixo(resto + '/index.ts') && !existeSufixo(resto + '/index.tsx')) add(pos, s.length, 'info', '📎 Atalho de pasta (@/…) não confirmado', `Não achei “${s}”. Confira o “paths” do tsconfig e o “alias” do vite.config.`); continue; }
        const nome = s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0];
        if (s.startsWith('node:') || NODE.has(s) || NODE.has(nome)) continue;
        if (nome.startsWith('@workspace/')) { add(pos, s.length, 'media', '📦 Pacote do monorepo (@workspace)', `“${nome}” é interno do projeto Replit. A pasta dele precisa estar no zip e listada em “workspaces”.`); continue; }
        if (nome.startsWith('@replit/')) { add(pos, s.length, 'alta', '📦 Pacote da Replit', 'Remova e substitua — ver exame 🚨 Replit.'); continue; }
        if (pkgs.length && !deps.has(nome)) add(pos, s.length, 'media', '📦 Pacote usado mas não declarado', `“${nome}” é importado mas não aparece em nenhum package.json. O npm install não vai baixar e dá erro.`);
      }
    }
    if (/^html?$/.test(a.ext)) {
      const re = /<(?:script|img|link|source|iframe|audio|video)\b[^>]*?\s(?:src|href)\s*=\s*["']([^"'#?]+)[^"']*["']/gi; let m;
      while ((m = re.exec(t))) {
        const s = m[1].trim();
        if (!s || /^(https?:|data:|blob:|mailto:|tel:|javascript:|\/\/|\{|\$|%)/i.test(s)) continue;
        const ok = s.startsWith('/') ? existeSufixo(s) : existe(dir, s) || existeSufixo(s);
        if (!ok) add(m.index + m[0].indexOf(m[1]), m[1].length, 'alta', '📎 Arquivo do HTML não existe', `O HTML pede “${s}”, mas ele não está no projeto. Vai dar 404 (tela branca, ícone quebrado ou script faltando).`);
      }
    }
  });
  const CONH = [[['react', 'preact'], 'React + Preact'], [['jquery', 'react'], 'jQuery + React (mexem no mesmo HTML)'], [['moment', 'date-fns', 'dayjs'], 'Mais de uma biblioteca de datas'], [['lodash', 'underscore'], 'Lodash + Underscore'], [['bootstrap', 'tailwindcss'], 'Bootstrap + Tailwind'], [['webpack', 'vite'], 'Webpack + Vite (dois montadores)'], [['bcrypt', 'bcryptjs'], 'bcrypt + bcryptjs']];
  const extra = [];
  for (const [libs, desc] of CONH) { const tem = libs.filter((l) => deps.has(l)); if (tem.length >= 2) extra.push(`⚡ ${desc}: ${tem.join(', ')}`); }
  return { titulo: '📎 Referências e pacotes', itens, vazio: 'Todas as referências apontam para arquivos que existem, e os pacotes estão declarados.', dica: (pkgs.length ? `Pacotes lidos de: ${pkgs.join(', ')}. ` : 'Nenhum package.json no projeto — não deu para conferir pacotes. ') + (extra.length ? '\n' + extra.join('\n') : '') };
};
EX.segredos = async (lista) => {
  const itens = await porArquivo(lista, (a, i, it) => {
    varrer(a, i, R_SEGREDOS.map((r) => ({ ...r, sev: 'alta', sol: 'Chave/senha escrita no código: qualquer um que abrir o arquivo (ou o APK) consegue usar e gastar seus créditos. Tire daqui, cancele (revogue) essa chave no site do provedor e gere outra.' })), it);
    for (const x of it) if (x.a === i && x.achado) x.oculto = true;
  });
  for (const a of P.arquivos) if (/(^|\/)(\.env(\..+)?|.+\.(pem|key|pfx|p12|keystore|jks))$/.test(a.caminho) && !/\.env\.(exemplo|example|sample)$/.test(a.caminho)) itens.unshift({ a: P.arquivos.indexOf(a), n: 1, col: 0, len: 0, sev: 'alta', tipo: '🔐 Arquivo secreto dentro do projeto', sol: 'Este arquivo guarda segredos (senhas, chave privada). NÃO mande para GitHub, IA ou outra pessoa. Tire do zip antes de compartilhar.' });
  return { titulo: '🔑 Chaves e senhas expostas', itens, vazio: 'Nenhuma chave ou senha visível no código. 👍', dica: 'As chaves aparecem mascaradas (só o começo) para não vazarem nem nesta tela.' };
};
