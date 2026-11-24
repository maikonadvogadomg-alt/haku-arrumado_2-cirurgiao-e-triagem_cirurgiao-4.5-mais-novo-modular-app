# 📋 Plano para entender e modularizar: Haku-arrumado/2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO.html

_Gerado pelo Laboratório em 24/11/2026, 05:24:34 — sem IA, lendo o código._

## 📊 Resumo

| Item | Quantidade |
|---|---|
| Tamanho | 214 KB · 2818 linhas |
| Blocos de estilo | 1 |
| Blocos de código | 1 |
| Funções | 178 |
| Botões/eventos na tela | 0 |
| Cores diferentes | 40 |
| Bibliotecas de fora | 0 |
| Problemas | 1 (0 graves) |

## ⚠️ Problemas encontrados (resolver primeiro)

- 🟡 O código procura o id "L" (em irParaLinha, selecionarLinha), mas a tela não tem esse id. Pode ser criado depois pelo código — ou pode ser um erro.

## 🧩 Funções — o que cada uma faz

| Função | Linhas | O que faz | Chama | É chamada por |
|---|---|---|---|---|
| `$` | 556–556 (1) | faz uma parte da lógica | — | status, escopo, lerArquivos, carregarFiles, ir, renderTudo |
| `$$` | 557–557 (1) | faz uma parte da lógica | — | ir, renderCodigo, selecionarLinha |
| `esc` | 558–558 (1) | arruma texto | — | lerArquivos, carregarFiles, posCarga, pinta, renderListaArq, renderSelArq |
| `fmtB` | 559–559 (1) | faz uma parte da lógica | — | renderTudo, pinta, renderListaArq, renderCodigo, renderMem, preencherCfg |
| `fmtN` | 560–560 (1) | faz uma parte da lógica | — | copiar, posCarga, renderTudo, pinta, renderListaArq, renderCodigo |
| `usd` | 561–561 (1) | faz uma parte da lógica | — | medir, enviar, renderGasto, renderHist |
| `agora` | 562–562 (1) | faz uma parte da lógica | — | relatorio, enviar, novaNota, pacote, relatorioDeps, gerarPlano |
| `pausa` | 563–563 (1) | usa tempo (espera/repete) | — | lerZip, varreduraRapida, porArquivo, comparar |
| `tokensDe` | 564–564 (1) | faz uma parte da lógica | — | partesEnvio, medir, registrarGasto |
| `abrir` | 569–577 (9) | importa/abre · guarda/lê no banco do aparelho (IndexedDB) | — | — |
| `get` | 578–583 (6) | faz uma parte da lógica | — | addMarcas, renderCodigo, renderMarcas, selecionarLinha, idsDuplicados, declDuplicadas |
| `set` | 584–587 (4) | faz uma parte da lógica | — | addMarcas, idsDuplicados, declDuplicadas, mostrarResultado, renderRes, buscar |
| `del` | 588–591 (4) | faz uma parte da lógica | — | verSessao |
| `limpar` | 592–595 (4) | apaga/limpa | — | — |
| `extDe` | 615–615 (1) | faz uma parte da lógica | — | novoArquivo, lerArquivos, despacotar |
| `decode` | 616–619 (4) | faz uma parte da lógica | — | lerZip, txt, campo, lerTar |
| `pareceBinario` | 620–620 (1) | faz uma parte da lógica | — | novoArquivo |
| `inflate` | 621–625 (5) | lê arquivo | — | lerZip |
| `lerZip` | 626–656 (31) | carrega | decode, decode, inflate, pausa | lerArquivos, expandirZip |
| `crc32` | 658–658 (1) | faz uma parte da lógica | — | escreverZip, comparar |
| `escreverZip` | 659–677 (19) | faz uma parte da lógica | crc32 | exportarZip |
| `baixar` | 678–683 (6) | exporta/baixa · desenha/muda a tela · baixa arquivo · usa tempo (espera/repete) | — | exportarZip, modalTexto, preencherMsg, packageLimpo, relatorioDeps |
| `copiar` | 684–687 (4) | desenha/muda a tela · copia para a área de transferência | fmtN, toast | modalTexto, preencherMsg |
| `status` | 688–688 (1) | desenha/muda a tela | $ | toast, lerArquivos, carregarFiles, posCarga, porArquivo, gerarPlano |
| `toast` | 690–690 (1) | mostra aviso · usa tempo (espera/repete) | status | copiar, expandirZip, exportarZip, preencherMsg, novaNota, salvarSessao |
| `txt` | 693–693 (1) | faz uma parte da lógica | decode | inicios, textoLinha, tem, tecnologias, renderCodigo, aplicarTexto |
| `inicios` | 694–697 (4) | faz uma parte da lógica | txt | linhaDe, textoLinha, nLinhas, irParaLinha, balanco, varrer |
| `linhaDe` | 698–698 (1) | faz uma parte da lógica | inicios | balanco, varrer, idsDuplicados, declDuplicadas, add, buscar |
| `textoLinha` | 699–699 (1) | faz uma parte da lógica | inicios, txt | itensFiltrados, trechoHTML, relatorio, comparar |
| `nLinhas` | 700–700 (1) | faz uma parte da lógica | inicios | renderTudo, renderCodigo, irParaLinha, blocoArquivo, renderCmp, gerarPlano |
| `ignoradoPor` | 701–711 (11) | faz uma parte da lógica | — | analisaveis, renderTudo, pinta, renderListaArq, renderCodigo, rotasDe |
| `analisaveis` | 712–712 (1) | salva | ignoradoPor | escopo, varreduraRapida, renderTudo, tem, tecnologias, contexto |
| `escopo` | 713–718 (6) | faz uma parte da lógica | $, analisaveis | buscar |
| `novoArquivo` | 721–725 (5) | faz uma parte da lógica | extDe, pareceBinario | lerArquivos, expandirZip, copiarDoB, transplantarVarios |
| `gunzip` | 726–729 (4) | lê arquivo | — | lerArquivos |
| `ehTar` | 730–730 (1) | faz uma parte da lógica | — | lerArquivos |
| `campo` | 733–733 (1) | faz uma parte da lógica | decode | lerTar |
| `lerTar` | 731–753 (23) | carrega | decode, campo | lerArquivos |
| `lerArquivos` | 754–787 (34) | carrega · lê arquivo | $, esc, status, extDe, gunzip, ehTar | carregarFiles |
| `carregarFiles` | 788–801 (14) | carrega | $, lerArquivos, posCarga, esc, status | — |
| `posCarga` | 802–810 (9) | faz uma parte da lógica | status, varreduraRapida, tecnologias, renderTudo, ir, esc | carregarFiles, renderTudo, renderCodigo, expandirZip, verSessao, reaplicar |
| `varreduraRapida` | 811–825 (15) | conversa com IA/API | analisaveis, exameReplit, conflitoMerge, addMarcas, pausa | posCarga, posEdicao |
| `addMarcas` | 826–834 (9) | faz uma parte da lógica | set, get, set, get | varreduraRapida, mostrarResultado |
| `ir` | 837–845 (9) | faz uma parte da lógica | $$, $, medir, infoCmp, renderDeps | posCarga, abrirArquivo, mostrarResultado, explicarComIA |
| `renderTudo` | 849–878 (30) | mostra/atualiza na tela · liga botões/eventos · desenha/muda a tela | $, fmtN, renderSelArq, analisaveis, nLinhas, fmtB | posCarga, renderCodigo, posEdicao, mostrarResultado |
| `tem` | 880–880 (1) | faz uma parte da lógica | analisaveis, txt | tecnologias |
| `cam` | 881–881 (1) | faz uma parte da lógica | — | tecnologias |
| `tecnologias` | 879–903 (25) | guarda/lê no aparelho (localStorage) · guarda/lê no banco do aparelho (IndexedDB) | analisaveis, txt, cam, tem | posCarga |
| `pinta` | 922–936 (15) | liga botões/eventos · desenha/muda a tela | ignoradoPor, esc, fmtB, fmtN, $ | renderListaArq |
| `renderListaArq` | 904–938 (35) | mostra/atualiza na tela · liga botões/eventos · desenha/muda a tela | $, ignoradoPor, fmtN, esc, fmtB, pinta | renderTudo |
| `renderSelArq` | 949–953 (5) | mostra/atualiza na tela · desenha/muda a tela | $, esc | renderTudo |
| `abrirArquivo` | 955–965 (11) | importa/abre | $, ir, renderCodigo, irParaLinha | renderCodigo, transplantarVarios, verDiff |
| `renderCodigo` | 966–1006 (41) | mostra/atualiza na tela · liga botões/eventos · desenha/muda a tela | $, ignoradoPor, esc, fmtB, nLinhas, fmtN | abrirArquivo, posEdicao, mostrarResultado |
| `pior` | 1008–1008 (1) | faz uma parte da lógica | — | renderCodigo, renderMarcas |
| `renderMarcas` | 1009–1014 (6) | mostra/atualiza na tela · desenha/muda a tela | get, $, get, pior, esc | renderCodigo |
| `rolar` | 1022–1022 (1) | faz uma parte da lógica | — | irParaLinha |
| `irParaLinha` | 1016–1027 (12) | faz uma parte da lógica | nLinhas, $, inicios, rolar, selecionarLinha | abrirArquivo |
| `selecionarLinha` | 1028–1035 (8) | desenha/muda a tela | $$, get, $ | irParaLinha |
| `aplicarTexto` | 1070–1077 (8) | faz uma parte da lógica | txt | preencherMsg, inserirNoA, verDiff, packageLimpo |
| `posEdicao` | 1078–1078 (1) | faz uma parte da lógica | varreduraRapida, renderTudo, renderCodigo, salvarSessao | preencherMsg, renderCmp, transplantarVarios, verDiff, packageLimpo |
| `dadosAtuais` | 1079–1079 (1) | faz uma parte da lógica | — | exportarZip, comparar |
| `ind` | 1088–1088 (1) | faz uma parte da lógica | — | organizar |
| `organizar` | 1085–1105 (21) | faz uma parte da lógica | ind | — |
| `expandirZip` | 1106–1117 (12) | faz uma parte da lógica | lerZip, novoArquivo, posCarga, fmtN, esc, toast | renderCodigo |
| `podeRegex` | 1124–1124 (1) | faz uma parte da lógica | — | tokensEstrutura |
| `tokensEstrutura` | 1121–1147 (27) | faz uma parte da lógica | podeRegex | extrairBloco, balanco, blocoAte |
| `extrairBloco` | 1148–1157 (10) | faz uma parte da lógica | tokensEstrutura | — |
| `balanco` | 1158–1176 (19) | faz uma parte da lógica | txt, tokensEstrutura, linhaDe, inicios | — |
| `exameReplit` | 1200–1203 (4) | faz uma parte da lógica | varrer | varreduraRapida |
| `varrer` | 1234–1250 (17) | faz uma parte da lógica | txt, inicios, linhaDe, add | exameReplit, conflitoMerge |
| `conflitoMerge` | 1251–1251 (1) | faz uma parte da lógica | varrer | varreduraRapida |
| `porArquivo` | 1254–1262 (9) | faz uma parte da lógica | fmtN, status, pausa | buscar |
| `idsDuplicados` | 1273–1281 (9) | faz uma parte da lógica | txt, linhaDe, inicios, get, set | — |
| `declDuplicadas` | 1282–1290 (9) | faz uma parte da lógica | txt, linhaDe, get, set | — |
| `carregarScript` | 1292–1292 (1) | carrega · desenha/muda a tela | — | acornPronto |
| `acornPronto` | 1293–1300 (8) | faz uma parte da lógica | carregarScript | — |
| `parseJS` | 1301–1308 (8) | faz uma parte da lógica | — | — |
| `traduzErro` | 1349–1353 (5) | faz uma parte da lógica | — | — |
| `existe` | 1361–1369 (9) | faz uma parte da lógica | — | — |
| `existeSufixo` | 1370–1370 (1) | faz uma parte da lógica | — | — |
| `add` | 1373–1373 (1) | faz uma parte da lógica | linhaDe, inicios | varrer, preencherMsg, faltasDoBloco, copiarDoB, transplantarVarios, verDiff |
| `mostrarResultado` | 1528–1542 (15) | mostra/atualiza na tela · guarda/lê no aparelho (localStorage) | addMarcas, get, set, $, renderTudo, renderRes | buscar |
| `itensFiltrados` | 1543–1546 (4) | faz uma parte da lógica | $, textoLinha | renderRes, contexto |
| `trechoHTML` | 1547–1561 (15) | faz uma parte da lógica | txt, textoLinha, fmtN, esc | renderRes |
| `renderRes` | 1562–1585 (24) | mostra/atualiza na tela · liga botões/eventos · desenha/muda a tela | $, itensFiltrados, fmtN, esc, get, set | mostrarResultado |
| `relatorio` | 1599–1610 (12) | faz uma parte da lógica | agora, textoLinha | contexto |
| `montarBusca` | 1617–1625 (9) | faz uma parte da lógica | $ | buscar |
| `buscar` | 1626–1634 (9) | faz uma parte da lógica | montarBusca, escopo, txt, inicios, linhaDe, set | — |
| `exportarZip` | 1654–1660 (7) | exporta/baixa | dadosAtuais, escreverZip, baixar, fmtN, toast | — |
| `modal` | 1689–1695 (7) | abre/fecha janela · liga botões/eventos · desenha/muda a tela | $ | modalTexto, novaNota, escolherAlvo, verDiff |
| `modalTexto` | 1696–1699 (4) | abre/fecha janela · desenha/muda a tela | fmtN, copiar, baixar, modal, $ | transplantarVarios, packageLimpo |
| `fecharModal` | 1701–1701 (1) | abre/fecha janela · desenha/muda a tela | $ | novaNota, escolherAlvo, transplantarVarios, verDiff, packageLimpo |
| `detectarProv` | 1720–1724 (5) | faz uma parte da lógica | — | — |
| `iaCfg` | 1725–1725 (1) | conversa com IA | $ | guardarIA, blocoArquivo, contexto, partesEnvio, medir, chamarIA |
| `preencherProv` | 1726–1735 (10) | faz uma parte da lógica | $, medir | — |
| `guardarIA` | 1736–1743 (8) | salva | iaCfg, salvarCfg, $, set | enviar |
| `numerar` | 1753–1753 (1) | faz uma parte da lógica | — | blocoArquivo |
| `blocoArquivo` | 1754–1760 (7) | faz uma parte da lógica | iaCfg, txt, nLinhas, fmtN, numerar | contexto |
| `precisaArq` | 1763–1763 (1) | faz uma parte da lógica | — | contexto |
| `contexto` | 1761–1773 (13) | faz uma parte da lógica | iaCfg, itensFiltrados, relatorio, precisaArq, blocoArquivo, $ | medir, enviar |
| `partesEnvio` | 1775–1788 (14) | faz uma parte da lógica | iaCfg, tokensDe | medir, enviar |
| `medir` | 1789–1809 (21) | desenha/muda a tela | $, iaCfg, contexto, tokensDe, partesEnvio, gastoMes | ir, preencherProv, enviar |
| `gastoMes` | 1821–1821 (1) | faz uma parte da lógica | — | medir, enviar, renderGasto |
| `chamarIA` | 1822–1851 (30) | conversa com IA · busca na internet/servidor · converte dados (JSON) | iaCfg, $ | enviar, explicarComIA |
| `registrarGasto` | 1852–1860 (9) | faz uma parte da lógica | iaCfg, tokensDe, set, renderGasto | enviar, explicarComIA |
| `enviar` | 1861–1902 (42) | desenha/muda a tela | iaCfg, $, contexto, medir, gastoMes, usd | — |
| `addMsg` | 1903–1903 (1) | desenha/muda a tela | $ | enviar |
| `add` | 1907–1907 (1) | desenha/muda a tela | — | varrer, preencherMsg, faltasDoBloco, copiarDoB, transplantarVarios, verDiff |
| `preencherMsg` | 1904–1929 (26) | liga botões/eventos · desenha/muda a tela | esc, add, fmtN, copiar, baixar, txt | enviar |
| `renderGasto` | 1935–1939 (5) | mostra/atualiza na tela · desenha/muda a tela | gastoMes, $, usd, esc, fmtN | registrarGasto |
| `novaNota` | 1944–1951 (8) | faz uma parte da lógica | esc, $, agora, set, renderNotas, fecharModal | — |
| `renderNotas` | 1952–1954 (3) | mostra/atualiza na tela · desenha/muda a tela | $, esc | novaNota |
| `renderHist` | 1967–1971 (5) | mostra/atualiza na tela · desenha/muda a tela | $, esc, usd, fmtN | enviar |
| `pacote` | 1981–1981 (1) | faz uma parte da lógica | agora | salvarSessao |
| `despacotar` | 1982–1985 (4) | faz uma parte da lógica | extDe, $ | verSessao |
| `salvarSessao` | 1987–1991 (5) | salva · usa tempo (espera/repete) | pacote, set, esc, toast | posCarga, posEdicao |
| `renderMem` | 1992–1995 (4) | mostra/atualiza na tela · desenha/muda a tela | get, $, esc, fmtN, fmtB | — |
| `verSessao` | 2016–2024 (9) | liga botões/eventos · desenha/muda a tela | get, $, esc, fmtN, despacotar, posCarga | — |
| `salvarCfg` | 2027–2027 (1) | salva | set | renderTudo, guardarIA, reaplicar |
| `preencherCfg` | 2028–2034 (7) | desenha/muda a tela | $, fmtB | renderTudo |
| `reaplicar` | 2035–2035 (1) | faz uma parte da lógica | salvarCfg, posCarga | — |
| `juntar` | 2048–2048 (1) | faz uma parte da lógica | — | — |
| `raizDe` | 2078–2083 (6) | faz uma parte da lógica | — | rotasDe, funcoesDe, comparar, alvoNoA, copiarDoB, escolherAlvo |
| `chaveDe` | 2084–2084 (1) | faz uma parte da lógica | — | rotasDe, funcoesDe, comparar, alvoNoA |
| `infoCmp` | 2085–2089 (5) | desenha/muda a tela | $, esc, fmtN | ir |
| `blocoAte` | 2111–2115 (5) | faz uma parte da lógica | tokensEstrutura | blocoRota, blocoFuncao |
| `inicioLinha` | 2116–2116 (1) | faz uma parte da lógica | — | blocoRota, blocoTela, blocoFuncao |
| `blocoRota` | 2117–2123 (7) | faz uma parte da lógica | blocoAte, inicioLinha | comparar, inserirNoA |
| `blocoTela` | 2124–2130 (7) | faz uma parte da lógica | inicioLinha | comparar, inserirNoA |
| `blocoFuncao` | 2131–2147 (17) | faz uma parte da lógica | inicioLinha, blocoAte | comparar |
| `rotasDe` | 2148–2159 (12) | faz uma parte da lógica | raizDe, ignoradoPor, txt, chaveDe, set | comparar, gerarPlano |
| `funcoesDe` | 2160–2171 (12) | faz uma parte da lógica | raizDe, ignoradoPor, txt, chaveDe, set | comparar |
| `importsDe` | 2172–2183 (12) | importa/abre | — | faltasDoBloco, inserirNoA |
| `temNoA` | 2186–2186 (1) | faz uma parte da lógica | — | faltasDoBloco |
| `faltasDoBloco` | 2184–2203 (20) | faz uma parte da lógica | importsDe, temNoA, set, get, add | inserirNoA |
| `id` | 2207–2207 (1) | faz uma parte da lógica | get, set | — |
| `lcs` | 2209–2220 (12) | faz uma parte da lógica | — | rec, diffLinhas |
| `rec` | 2221–2243 (23) | faz uma parte da lógica | lcs, get, set, get, set, set | diffLinhas |
| `diffLinhas` | 2206–2246 (41) | faz uma parte da lógica | get, set, lcs, get, set, get | comparar, verDiff |
| `linhasDe` | 2247–2247 (1) | faz uma parte da lógica | — | comparar, verDiff |
| `contarDiff` | 2248–2248 (1) | calcula | — | comparar, verDiff |
| `comparar` | 2251–2283 (33) | desenha/muda a tela | $, pausa, rotasDe, funcoesDe, raizDe, chaveDe | — |
| `pend` | 2292–2292 (1) | faz uma parte da lógica | — | renderCmp |
| `renderCmp` | 2285–2318 (34) | mostra/atualiza na tela · liga botões/eventos · desenha/muda a tela | $, fmtN, pend, alvoNoA, esc, fmtB | comparar, transplantarVarios, verDiff |
| `alvoNoA` | 2333–2333 (1) | faz uma parte da lógica | raizDe, chaveDe | renderCmp, transplantarVarios |
| `copiarDoB` | 2334–2340 (7) | faz uma parte da lógica | raizDe, novoArquivo, txt, add | renderCmp |
| `escolherAlvo` | 2341–2347 (7) | faz uma parte da lógica | ignoradoPor, esc, raizDe, $, fecharModal, modal | transplantarVarios |
| `transplantarVarios` | 2348–2368 (21) | faz uma parte da lógica | alvoNoA, escolherAlvo, raizDe, novoArquivo, inserirNoA, add | renderCmp |
| `inserirNoA` | 2369–2393 (25) | faz uma parte da lógica | txt, blocoRota, blocoTela, faltasDoBloco, importsDe, aplicarTexto | transplantarVarios |
| `lin` | 2405–2405 (1) | faz uma parte da lógica | esc | verDiff |
| `verDiff` | 2395–2436 (42) | liga botões/eventos | txt, linhasDe, diffLinhas, contarDiff, fmtN, esc | — |
| `pkgsDoProjeto` | 2454–2456 (3) | faz uma parte da lógica | — | coletarDeps |
| `coletarDeps` | 2457–2470 (14) | converte dados (JSON) | pkgsDoProjeto, txt, set, get | renderDeps, conferirTodas, explicarComIA, packageLimpo, gerarPlano |
| `explicar` | 2471–2484 (14) | faz uma parte da lógica | get | avaliar, explicarComIA, packageLimpo, termRodar |
| `numV` | 2486–2486 (1) | faz uma parte da lógica | — | casaUm |
| `cmpV` | 2487–2487 (1) | faz uma parte da lógica | — | casaUm |
| `n` | 2490–2490 (1) | faz uma parte da lógica | — | casaUm |
| `casaUm` | 2488–2496 (9) | faz uma parte da lógica | n, numV, cmpV | versaoExiste |
| `versaoExiste` | 2497–2503 (7) | faz uma parte da lógica | casaUm | avaliar, packageLimpo |
| `nomeUrl` | 2504–2504 (1) | faz uma parte da lógica | — | npmInfo |
| `npmInfo` | 2505–2521 (17) | busca na internet/servidor | get, nomeUrl, set | trabalhador, conferirTodas, termRodar |
| `usoNoCodigo` | 2522–2531 (10) | faz uma parte da lógica | analisaveis, txt | avaliar |
| `avaliar` | 2532–2545 (14) | faz uma parte da lógica | explicar, get, versaoExiste, usoNoCodigo | renderDeps, gerarPlano |
| `renderDeps` | 2546–2570 (25) | mostra/atualiza na tela · desenha/muda a tela | $, coletarDeps, analisaveis, avaliar, esc | ir, conferirTodas, explicarComIA |
| `trabalhador` | 2577–2577 (1) | desenha/muda a tela | npmInfo | — |
| `conferirTodas` | 2571–2583 (13) | confere/valida · desenha/muda a tela | coletarDeps, $, npmInfo, get, toast, renderDeps | — |
| `explicarComIA` | 2584–2602 (19) | conversa com IA · desenha/muda a tela | coletarDeps, explicar, toast, $, ir, get | — |
| `packageLimpo` | 2603–2625 (23) | converte dados (JSON) | coletarDeps, get, txt, explicar, versaoExiste, baixar | — |
| `relatorioDeps` | 2626–2631 (6) | faz uma parte da lógica | $, agora, baixar | — |
| `termOut` | 2647–2647 (1) | desenha/muda a tela | $ | termRodar |
| `termRodar` | 2648–2676 (29) | busca na internet/servidor · desenha/muda a tela | $, termOut, npmInfo, explicar | — |
| `anda` | 2685–2685 (1) | faz uma parte da lógica | — | arvoreTexto |
| `arvoreTexto` | 2681–2688 (8) | faz uma parte da lógica | anda | gerarPlano |
| `gerarPlano` | 2689–2728 (40) | faz uma parte da lógica | analisaveis, get, set, agora, fmtN, fmtB | — |
| `b64de` | 2739–2739 (1) | faz uma parte da lógica | — | — |
| `psq` | 2748–2748 (1) | faz uma parte da lógica | — | — |
| `shq` | 2748–2748 (1) | faz uma parte da lógica | — | — |
| `avisa` | 2773–2773 (1) | usa tempo (espera/repete) | — | — |

## 🔗 Variáveis que várias funções usam (o "estado" do app)

Ao separar em módulos, essas precisam ficar num lugar que todos enxerguem (ex.: um arquivo `00-estado.js` carregado primeiro).

- `DB` (linha 567) — usada por: guardarIA, registrarGasto, enviar, novaNota, salvarSessao, renderMem, verSessao, salvarCfg
- `CFG` (linha 600) — usada por: ignoradoPor, renderTudo, renderCodigo, varrer, preencherProv, guardarIA, medir, enviar
- `P` (linha 601) — usada por: analisaveis, escopo, carregarFiles, posCarga, renderTudo, cam, tecnologias, renderListaArq
- `atual` (linha 602) — usada por: escopo, carregarFiles, renderSelArq, abrirArquivo, renderCodigo, renderMarcas, irParaLinha, selecionarLinha
- `R` (linha 604) — usada por: carregarFiles, mostrarResultado, itensFiltrados, renderRes, relatorio, contexto, despacotar
- `marcas` (linha 605) — usada por: carregarFiles, varreduraRapida, addMarcas, renderTudo, renderCodigo, renderMarcas, selecionarLinha
- `notas` (linha 606) — usada por: novaNota, renderNotas
- `historico` (linha 606) — usada por: enviar, renderHist
- `gasto` (linha 606) — usada por: gastoMes, registrarGasto, renderGasto
- `selLinha` (linha 607) — usada por: ir, abrirArquivo, selecionarLinha
- `conv` (linha 608) — usada por: medir, enviar
- `EXT_ZIP` (linha 614) — usada por: lerArquivos, renderCodigo
- `SEV_NOME` (linha 1527) — usada por: renderRes, relatorio
- `_aoFechar` (linha 1700) — usada por: fecharModal, escolherAlvo
- `PROV` (linha 1707) — usada por: detectarProv, preencherProv, chamarIA, registrarGasto, enviar
- `SISTEMA` (linha 1774) — usada por: partesEnvio, medir, chamarIA, enviar
- `PB` (linha 2074) — usada por: infoCmp, comparar, renderCmp, copiarDoB, inserirNoA, verDiff
- `CMP` (linha 2075) — usada por: comparar, renderCmp
- `cmpAba` (linha 2076) — usada por: comparar, pend, renderCmp, transplantarVarios
- `feitos` (linha 2077) — usada por: comparar, pend, renderCmp, copiarDoB, transplantarVarios, verDiff
- `OBJ_ROTA` (linha 2109) — usada por: rotasDe, inserirNoA
- `ARQ_CODIGO` (linha 2110) — usada por: funcoesDe, escolherAlvo
- `DIC` (linha 2440) — usada por: explicar, termRodar
- `NPM` (linha 2451) — usada por: explicar, npmInfo, avaliar, trabalhador, conferirTodas, explicarComIA, packageLimpo, termRodar
- `DIC_IA` (linha 2452) — usada por: explicar, explicarComIA

## ✂️ Proposta de módulos (já feita pelo ✂️ Picar)

- 🎨 css/01-estilo.css (137 linhas)
- 📜 js/01-funcoes-decode.js (135 linhas: decode, pareceBinario, inflate, lerZip, escreverZip, baixar…)
- 📜 js/02-funcoes-lerarquivos.js (151 linhas: lerArquivos, carregarFiles, posCarga, varreduraRapida, addMarcas, ir…)
- 📜 js/03-funcoes-renderlistaarq.js (165 linhas: renderListaArq, renderSelArq, abrirArquivo, renderCodigo, renderMarcas, irParaLinha…)
- 📜 js/04-funcoes-tokensestrutura.js (152 linhas: tokensEstrutura, extrairBloco, balanco, exameReplit, varrer, conflitoMerge…)
- 📜 js/05-funcoes-trechohtml.js (156 linhas: trechoHTML, renderRes, relatorio, montarBusca, buscar, exportarZip…)
- 📜 js/06-funcoes-medir.js (165 linhas: medir, gastoMes, chamarIA, registrarGasto, enviar, addMsg…)
- 📜 js/07-funcoes-salvarsessao.js (133 linhas: salvarSessao, renderMem, verSessao, salvarCfg, preencherCfg, raizDe…)
- 📜 js/08-funcoes-difflinhas.js (148 linhas: diffLinhas, contarDiff, comparar, renderCmp, alvoNoA, copiarDoB…)
- 📜 js/09-funcoes-inserirnoa.js (157 linhas: inserirNoA, verDiff, pkgsDoProjeto, coletarDeps, explicar, casaUm…)
- 📜 js/10-funcoes-renderdeps.js (171 linhas: renderDeps, conferirTodas, explicarComIA, packageLimpo, relatorioDeps, termOut…)
- 📜 js/11-inicio.js (124 linhas: $, $$, esc, fmtB, fmtN, usd…)
- 📜 js/12-inicio.js (163 linhas: R_REPLIT, ARQ_REPLIT, R_BUGS, R_SEGREDOS, EX, _acorn…)
- 📜 js/13-inicio.js (155 linhas: SEV_NOME)
- 📜 js/14-inicio.js (115 linhas: drop, _aoFechar, PROV, SISTEMA, PERG, _sessT…)
- 📜 js/15-inicio.js (125 linhas: PB, CMP, cmpAba, feitos, chaveDe, OBJ_ROTA…)
- 📜 js/16-inicio.js (77 linhas: ponte)

**Teste:** ✅ a versão picada roda igual à original (0 erro(s) que já existiam antes)

## 🛣️ Passo a passo

1. Resolva os 🔴 problemas graves (eles travam o app).
2. Use o **✂️ Picar** do Laboratório: ele separa estilos e códigos em arquivos, na mesma ordem (não muda o funcionamento) e testa.
3. Abra a versão picada no Mini SK. Cada arquivo agora é pequeno: dá para ler e mexer um por vez.
4. Para ir além (módulos "de verdade"), separe por assunto usando a tabela de funções acima: o que mexe na tela, o que salva, o que fala com a IA.
5. Sempre teste depois de cada mudança (🧪 Prévia ou ⚖️ Comparar com a versão anterior).

## 🤖 Pedido pronto para a IA

```
Tenho um app HTML chamado "Haku-arrumado/2-Cirurgiao-e-Triagem/Cirurgiao-4.5-MAIS-NOVO.html" (2818 linhas, 178 funções). Segue o plano gerado pelo meu Laboratório.
Quero transformar em versão MODULAR (index.html + css/ + js/ numerados), sem mudar o que ele faz.
Regras: entregue os arquivos inteiros (nunca "troque este pedaço"), explique em português simples, e resolva primeiro os problemas marcados com 🔴.
```
