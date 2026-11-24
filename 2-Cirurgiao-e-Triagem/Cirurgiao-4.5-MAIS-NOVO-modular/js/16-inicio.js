'use strict';
$('#bScripts').addEventListener('click', () => {
  if (!P.arquivos.length) return alert('Abra um projeto primeiro.');
  const tudo = $('input[name=recModo]:checked').value === 'tudo', npm = $('#recNpm').checked, edit = $('#recEdit').checked;
  const raiz = raizDe(P.arquivos);
  const nomePasta = (raiz.replace(/\/$/, '') || P.nome.replace(/\.(zip|apk|jar|tar|tgz|gz)$/i, '') || 'projeto').replace(/[\\/:*?"<>|]/g, '_');
  const lista = P.arquivos.filter((a) => ignoradoPor(a) !== 'pasta' && !a.erro).map((a) => ({ rel: chaveDe(a, raiz), dados: edit ? dadosAtuais(a) : (a.original != null && a.editado && !a.bin ? new TextEncoder().encode(a.original) : a.dados) }));
  const pastas = [...new Set(lista.flatMap((f) => { const ps = f.rel.split('/').slice(0, -1); return ps.map((_, k) => ps.slice(0, k + 1).join('/')); }))].sort();
  const temPkg = lista.some((f) => f.rel === 'package.json');
  const psq = (s) => "'" + s.replace(/'/g, "''") + "'", shq = (s) => "'" + s.replace(/'/g, "'\\''") + "'";
  let ps = `# Recria o projeto "${nomePasta}" — gerado pelo Cirurgião em ${agora()}\n$ErrorActionPreference = 'Stop'\n$base = Join-Path $PSScriptRoot ${psq(nomePasta)}\nNew-Item -ItemType Directory -Force -Path $base | Out-Null\n`;
  let sh = `#!/bin/sh\n# Recria o projeto "${nomePasta}" — gerado pelo Cirurgião em ${agora()}\nset -e\ncd "$(dirname "$0")"\nmkdir -p ${shq(nomePasta)}\ncd ${shq(nomePasta)}\n`;
  for (const p of pastas) { ps += `New-Item -ItemType Directory -Force -Path (Join-Path $base ${psq(p)}) | Out-Null\n`; sh += `mkdir -p ${shq(p)}\n`; }
  let total = 0;
  for (const f of lista) {
    if (tudo && f.dados.length) { const b = b64de(f.dados); total += f.dados.length; ps += `[IO.File]::WriteAllBytes((Join-Path $base ${psq(f.rel)}), [Convert]::FromBase64String('${b}'))\n`; sh += `printf '%s' '${b}' | base64 -d > ${shq(f.rel)}\n`; }
    else { ps += `New-Item -ItemType File -Force -Path (Join-Path $base ${psq(f.rel)}) | Out-Null\n`; sh += `: > ${shq(f.rel)}\n`; }
  }
  ps += `Write-Host ''\nWrite-Host 'Pronto! ${lista.length} arquivo(s) em' $base -ForegroundColor Green\n`;
  sh += `echo ""\necho "Pronto! ${lista.length} arquivo(s) em $(pwd)"\n`;
  if (npm && temPkg) { ps += `if (Get-Command npm -ErrorAction SilentlyContinue) { Set-Location $base; npm install } else { Write-Host 'Instale o Node.js (nodejs.org) e rode: npm install' -ForegroundColor Yellow }\n`; sh += `if command -v npm >/dev/null 2>&1; then npm install; else echo "Instale o Node.js e rode: npm install"; fi\n`; }
  const bat = `@echo off\r\nchcp 65001 >nul\r\necho Recriando o projeto "${nomePasta}"...\r\npowershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0recriar.ps1"\r\necho.\r\npause\r\n`;
  const leia = `COMO USAR\r\n\r\nWindows: extraia este .zip numa pasta e dê dois cliques em recriar.bat.\r\nCelular (Termux), Linux ou Mac: sh recriar.sh\r\n\r\nEle cria a pasta "${nomePasta}" ao lado dos scripts, com ${lista.length} arquivo(s)${tudo ? ' e todo o conteúdo' : ' (vazios)'}.${npm && temPkg ? '\r\nNo fim roda npm install (precisa do Node.js instalado).' : ''}\r\n`;
  const enc = new TextEncoder();
  baixar(escreverZip([{ nome: 'recriar.bat', dados: enc.encode(bat) }, { nome: 'recriar.ps1', dados: enc.encode('﻿' + ps) }, { nome: 'recriar.sh', dados: enc.encode(sh) }, { nome: 'LEIA-ME.txt', dados: enc.encode(leia) }]), 'recriar-' + nomePasta + '.zip');
  $('#recInfo').textContent = `✅ ${lista.length} arquivo(s), ${pastas.length} pasta(s)${tudo ? ', ' + fmtB(total) + ' de conteúdo' : ''}. Pastas como node_modules/.git ficaram de fora.`;
});

/* ── 🔗 Ponte com o Mini SK ─────────────────────────────────────────────
   O Mini SK abre o Cirurgião com #ponte-minisk e manda o projeto por mensagem.
   Aqui você examina e corrige; ↩️ Devolver manda só os arquivos mudados. */
let ponte = { ativa: /ponte-minisk/.test(location.hash) && !!window.opener, origem: '*', recebido: false };
if (ponte.ativa) {
  let n = 0;
  const avisa = () => { if (ponte.recebido || n++ > 40) return; try { window.opener.postMessage({ app: 'cirurgiao', tipo: 'pronto' }, '*'); } catch {} setTimeout(avisa, 500); };
  setTimeout(avisa, 300);
}
window.addEventListener('message', async (e) => {
  const d = e.data;
  if (!d || d.app !== 'minisk' || e.source !== window.opener) return;
  if (d.tipo === 'projeto' && Array.isArray(d.arquivos)) {
    ponte.recebido = true; ponte.origem = e.origin && e.origin !== 'null' ? e.origin : '*';
    P = { nome: (d.nome || 'Projeto') + ' (do Mini SK)', arquivos: d.arquivos.map((x) => novoArquivo(String(x.caminho), x.dados instanceof Uint8Array ? x.dados : new Uint8Array(x.dados || []))) };
    P.arquivos.sort((a, b) => a.caminho.localeCompare(b.caminho));
    atual = -1; marcas = new Map(); R = null; CMP = null;
    await posCarga();
    $('#bDevolver').hidden = false;
    toast('🔗 Projeto recebido do Mini SK. Examine, corrija e toque em ↩️ Devolver ao Mini SK.');
  }
  if (d.tipo === 'recebido') toast('✅ O Mini SK aplicou ' + (d.n || 0) + ' arquivo(s). Pode voltar para a aba dele.');
});
$('#bDevolver').addEventListener('click', () => {
  if (!window.opener || window.opener.closed) return alert('A aba do Mini SK foi fechada. Baixe o .zip em 📂 Arquivos e importe lá.');
  const mudados = P.arquivos.filter((a) => (a.editado || a.novo) && !a.bin);
  if (!mudados.length) return alert('Você ainda não corrigiu nenhum arquivo aqui. (Edite em 📄 Código, use Buscar e substituir, a IA 🩹, ou o 🔀 Comparar.)');
  if (!confirm('Devolver ao Mini SK ' + mudados.length + ' arquivo(s) corrigido(s)?\n\n' + mudados.map((a) => '• ' + a.caminho).join('\n'))) return;
  window.opener.postMessage({ app: 'cirurgiao', tipo: 'devolver', arquivos: mudados.map((a) => ({ caminho: a.caminho, texto: txt(a) })) }, ponte.origem);
  toast('↩️ Enviado. Volte para a aba do Mini SK e confirme lá.');
});

/* ── Início ─────────────────────────────────────────────────────────── */
(async function iniciar() {
  CFG = { ...CFG_PADRAO, ...(await DB.get('cfg', {})) };
  CFG.ia = CFG.ia || {};
  [notas, historico, gasto] = await Promise.all([DB.get('notas', []), DB.get('historico', []), DB.get('gasto', [])]);
  DIC_IA = await DB.get('dicIA', {});
  preencherCfg();
  $('#iaLembrar').checked = !!CFG.ia.lembrar;
  $('#iaNumerar').checked = CFG.ia.numerar !== false;
  if (CFG.ia.maxOut) $('#iaMaxOut').value = String(CFG.ia.maxOut);
  const prov = CFG.ia.prov || 'groq';
  preencherProv(prov);
  if (CFG.ia.lembrar) $('#iaChave').value = await DB.get('chave:' + prov, '');
  renderNotas(); renderHist(); renderGasto(); renderMem(); renderTudo(); renderCodigo();
  verSessao();
})();
