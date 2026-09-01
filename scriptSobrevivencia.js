/* =========================================================================
 * MODO SOBREVIVÊNCIA — o jogo em si (estilo WarioWare)
 * =========================================================================
 * Terceira camada. Substitui o antigo quick-time event do modo terror.
 *
 * AS CAMADAS, de baixo pra cima:
 *   scriptJingles.js     → só toca som
 *   scriptConfigJogo.js  → preferências, popup e teclado
 *   scriptSobrevivencia.js → ESTE: as telas, a rodada e o loop da sessão
 *   scriptMinijogos.js   → os 7 minijogos, que se registram aqui
 *
 * O CICLO DE UMA RODADA (é o coração do arquivo, em `loopSessao`):
 *
 *     ┌─────────────────────────────────────────────────────────┐
 *     │  anúncio  →  minijogo  →  reação  →  (virada de onda?)   │
 *     └─────────────────────────────────────────────────────────┘
 *        3,1 s       ~2-4 s       1,8 s        a cada 4 rodadas
 *
 *   • 4 vidas. Errar custa 1 vida e 20 de HP; acertar dá 100 pontos.
 *   • 5 ondas de 4 minijogos. Cada onda deixa o jogo 26% mais rápido.
 *   • Sem vidas → morte. Sobreviver às 5 ondas → tela de vitória.
 *
 * ONDE ACHAR CADA COISA (na ordem em que aparecem abaixo):
 *   1. Ajustes do jogo        6. Peças de tela reaproveitadas
 *   2. Elementos da tela      7. As quatro telas de transição
 *   3. Estado da sessão       8. Como uma rodada roda
 *   4. Atalhos das camadas    9. O loop da sessão
 *   5. Ritmo e velocidade    10. Telas de fim, abertura e entrada
 * ========================================================================= */

const Sobrevivencia = (function () {
  "use strict";

  // ═══ 1. AJUSTES DO JOGO ═════════════════════════════════
  // Todo número que dá pra querer mexer está aqui em cima.
  const VIDAS_INICIAIS    = 4;
  const RODADAS_POR_ONDA  = 4;
  const ONDAS_PARA_VENCER = 5;
  const ACELERACAO_ONDA   = 0.26;  // +26% de velocidade por onda
  const DURACAO_MINIMA    = 1000;  // ms — piso pra rodada não ficar impossível
  const DANO_POR_ERRO     = 20;
  const CURA_POR_ACERTO   = 5;
  const PONTOS_POR_ACERTO = 100;
  const EXTRA_INTERVALO   = 1800;  // "intervalos maiores" no popup
  const ESPERA_ENTRE_SESSOES = 5 * 60 * 1000;

  // A música acompanha a aceleração, mas só de leve: quem tem que ficar
  // visivelmente mais rápido é o minijogo. Seguir a velocidade cheia deixava
  // os jingles esganiçados.
  const TAXA_AUDIO_MAXIMA = 1.2;
  const PESO_AUDIO        = 0.05;

  // Quanto dura cada passo da "dança" dos personagens nas transições.
  const PASSO_DANCA = 420;

  // Sprites usados nas telas de transição.
  const IMG_COMEMORA = "imgs/takematsu-falando-1.png";
  const IMG_ANUNCIA  = "imgs/takematsu-falando-2.png";
  const IMG_APANHA   = "imgs/takematsu-apanhando.png";
  const IMG_MORTO    = "imgs/takematsu-morto.png";

  // Os monstros não vão embora: uma vez que aparecem, ficam em todas as
  // intermissões seguintes. Só o recém-chegado faz a entrada correndo.
  const MONSTROS = {
    sophia: { id: "sophia", src: "imgs/sophia_monster-removebg-preview.png", alt: "Sophia monstro", lado: "esq" },
    akira:  { id: "akira",  src: "imgs/akira-monster.png",                   alt: "Akira monstro",  lado: "dir" }
  };

  const FALAS_BOAS = ["BOA!", "ISSO AÍ!", "AMASSOU!", "TAMO JUNTO!", "SUAVE!"];

  // ═══ 2. ELEMENTOS DA TELA ═══════════════════════════════
  const overlay     = document.getElementById("mj-overlay");
  const palco       = document.getElementById("mj-palco");   // onde o minijogo é montado
  const elVidas     = document.getElementById("mj-vidas");
  const elOnda      = document.getElementById("mj-onda");
  const elPontos    = document.getElementById("mj-pontos");
  const elBarra     = document.getElementById("mj-barra-fill");
  const elInstrucao = document.getElementById("mj-instrucao");   // tela de anúncio
  const elInter     = document.getElementById("mj-intermissao"); // tela de reação
  const elTelaCheia = document.getElementById("mj-tela-cheia");  // abertura, onda e fim

  // ═══ 3. ESTADO DA SESSÃO ════════════════════════════════
  const jogos = [];   // preenchido por scriptMinijogos.js via registrar()

  let sessaoAtiva  = false;
  let abrindo      = false;   // sequência de abertura em andamento
  let pausado      = false;
  let esperandoFim = false;   // tela final aguardando tecla/clique
  let vidas    = VIDAS_INICIAIS;
  let pontos   = 0;
  let acertos  = 0;
  let erros    = 0;
  let rodada   = 0;
  let onda     = 1;
  let monstros = [];          // quem já apareceu e ficou nas intermissões
  let ultimoJogo   = null;    // pra não sortear o mesmo duas vezes seguidas
  let fimDaSessao  = 0;
  let ouvintesAcao = [];      // handlers de tecla do minijogo da vez
  let cancelarRodada = null;  // definido enquanto uma rodada está no ar
  let duracaoHerdada = 0;     // som que a tela anterior deixou tocando

  // ═══ 4. ATALHOS PRAS OUTRAS CAMADAS ═════════════════════
  const cfg      = ConfigJogo.cfg;
  const avisar   = ConfigJogo.avisar;     // leitor de tela + narração
  const anunciar = ConfigJogo.anunciar;

  // ═══ 5. RITMO E VELOCIDADE ══════════════════════════════
  const esperar = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // Espera que desiste se o jogo for pausado ou encerrado. As telas de
  // transição usam esta: pausar corta a música, então deixar a tela rodar
  // até o fim deixaria o resto dela em silêncio. Cortada, a rodada é
  // refeita do zero — com música nova desde o começo.
  async function esperarOuPausar(ms) {
    const alvo = Date.now() + ms;
    while (Date.now() < alvo) {
      if (pausado || !sessaoAtiva) return false;
      await esperar(Math.min(60, alvo - Date.now()));
    }
    return true;
  }

  // Quanto o jogo está mais rápido que na onda 1.
  function velocidadeAtual() {
    return cfg.travarAceleracao ? 1 : (1 + ACELERACAO_ONDA * (onda - 1));
  }

  // A música acelera bem menos que o jogo (ver comentário lá em cima).
  function taxaDaOnda() {
    return Math.min(TAXA_AUDIO_MAXIMA, 1 + (velocidadeAtual() - 1) * PESO_AUDIO);
  }

  function duracaoDoJogo(jogo) {
    const base = jogo.duracao || 4000;
    return Math.max(DURACAO_MINIMA * cfg.tempoExtra, (base / velocidadeAtual()) * cfg.tempoExtra);
  }

  // Toca um arquivo emendado (que cobre DUAS telas) e devolve quanto tempo
  // a primeira fica no ar. A segunda pega o resto por `duracaoHerdada`.
  function tocarEmenda(combinado, segundo) {
    const partes = Jingles.emenda(combinado, segundo, taxaDaOnda());
    duracaoHerdada = partes.cauda;
    return partes.cabeca;
  }

  // Usa o som que a tela anterior deixou tocando; se não houver, toca o seu.
  function herdarOuTocar(nome) {
    if (duracaoHerdada) {
      const ms = duracaoHerdada;
      duracaoHerdada = 0;
      return ms;
    }
    return Jingles.tocar(nome, { taxa: taxaDaOnda() });
  }

  function pararMusica() {
    duracaoHerdada = 0;
    Jingles.pararTudo();
  }

  // Duração de cada passo da dança, ajustada pra caber um número INTEIRO de
  // vezes dentro da tela — assim o personagem fecha o passo junto com o
  // jingle em vez de flutuar fora do compasso.
  function compassoDaDanca(ms) {
    const ciclos = Math.max(1, Math.round(ms / PASSO_DANCA));
    return Math.round(ms / ciclos);
  }

  // ═══ 6. PEÇAS DE TELA REAPROVEITADAS ════════════════════
  // A vida do Takematsu mora em script.js; aqui só mexemos nela.
  function mexerVida(delta) {
    if (typeof vida !== "number" || typeof updateBarVida !== "function") return;
    vida = Math.max(0, Math.min(100, vida + delta));
    updateBarVida();
  }

  function atualizarHud() {
    if (elVidas) {
      elVidas.innerHTML = htmlVidas();
      elVidas.setAttribute("aria-label", vidas + " de " + VIDAS_INICIAIS + " vidas restantes");
    }
    if (elOnda)   elOnda.textContent = "ONDA " + onda;
    if (elPontos) elPontos.textContent = pontos + " pts";
  }

  // Corações. `quebrando` marca o que acabou de ser perdido, pra ele
  // apagar com animação em vez de simplesmente sumir.
  function htmlVidas(quebrando) {
    let html = "";
    for (let i = 0; i < VIDAS_INICIAIS; i++) {
      let classe = "mj-vida";
      if (i >= vidas) classe += " mj-vida-perdida";
      if (quebrando && i === vidas) classe += " mj-vida-quebrando";
      html += '<span class="' + classe + '" aria-hidden="true">❤</span>';
    }
    return html;
  }

  // "Esconder Imagens" do menu de acessibilidade só percorre as <img> que já
  // existiam na página, e as daqui nascem em tempo de execução.
  function semImagens() {
    return (typeof imagensOcultas !== "undefined") && imagensOcultas;
  }

  function htmlPersonagem(src, alt, animar) {
    if (semImagens()) return '<p class="mj-trans-alt">[' + alt + "]</p>";
    return '<img class="mj-trans-img' + (animar ? " mj-anima" : "") +
           '" src="' + src + '" alt="' + alt + '">';
  }

  function htmlMonstros(lista, novoId) {
    if (!lista.length || semImagens()) return "";
    return lista.map(function (m) {
      const entrando = m.id === novoId;
      return '<span class="mj-monstro-caixa mj-monstro-' + m.lado +
               (entrando ? " mj-monstro-entrando" : "") + '">' +
               '<img class="mj-monstro" src="' + m.src + '" alt="' + m.alt +
                 (entrando ? " surgindo" : " observando") + '">' +
             "</span>";
    }).join("");
  }

  // As telas de reação e de anúncio usam a MESMA grade de três linhas, com o
  // personagem sempre na do meio: assim ele não "pula" na troca e a sequência
  // parece uma cena só e contínua.
  // `ms` é a duração da tela: dela sai o compasso da dança.
  function montarTransicao(el, classe, partes, ms) {
    el.className = "mj-transicao " + classe;
    if (ms) el.style.setProperty("--mj-danca", compassoDaDanca(ms) + "ms");
    el.innerHTML =
      '<div class="mj-trans-topo">' + (partes.topo || "") + "</div>" +
      '<div class="mj-trans-meio">' +
        (partes.monstros || "") +
        htmlPersonagem(partes.img, partes.alt, partes.animar) +
      "</div>" +
      '<div class="mj-trans-base">' + (partes.base || "") + "</div>";
  }

  // ═══ 7. AS QUATRO TELAS DE TRANSIÇÃO ════════════════════

  // ── 7a. REAÇÃO: o personagem responde ao que acabou de acontecer ──
  // Escolhe quem aparece e o que ele fala, conforme o resultado e quantas
  // vidas sobraram. `vidas` já foi descontado quando isto roda.
  function cenaDaVez(venceu) {
    if (venceu) {
      return {
        img: IMG_COMEMORA, alt: "Takematsu comemorando", animar: true,
        fala: FALAS_BOAS[Math.floor(Math.random() * FALAS_BOAS.length)],
        classe: "mj-inter-boa"
      };
    }
    // Errou: o Takematsu apanha e fica PARADO. Quem se mexe é o monstro que
    // acabou de chegar.
    if (vidas === 3) return {
      img: IMG_APANHA, alt: "Takematsu apanhando", animar: false,
      fala: "AI! ESSA DOEU…", classe: "mj-inter-ruim"
    };
    if (vidas === 2) return {
      img: IMG_APANHA, alt: "Takematsu apanhando", animar: false,
      chega: MONSTROS.sophia, fala: "ELA TE VIU.", classe: "mj-inter-pior"
    };
    if (vidas === 1) return {
      img: IMG_APANHA, alt: "Takematsu apanhando", animar: false,
      chega: MONSTROS.akira, fala: "ELES TE CERCARAM.", classe: "mj-inter-pior"
    };
    return {
      img: IMG_MORTO, alt: "Takematsu morto", animar: false,
      fala: "ACABOU.", classe: "mj-inter-fim"
    };
  }

  // `proximo` diz qual tela vem depois: "jingle" (anúncio do minijogo),
  // "speedup" (virada de onda) ou "fim". Com isso dá pra escolher o arquivo
  // emendado certo e trocar de tela sem cortar a música.
  async function intermissao(venceu, proximo) {
    const cena = cenaDaVez(venceu);

    if (cena.chega && monstros.indexOf(cena.chega) === -1) monstros.push(cena.chega);
    const novoId = cena.chega ? cena.chega.id : null;

    let ms;
    if (proximo === "jingle" || proximo === "speedup") {
      const emendado = (venceu ? "win" : "lose") + (proximo === "jingle" ? "Jingle" : "Speedup");
      ms = tocarEmenda(emendado, proximo);
    } else {
      // Última reação da sessão: não existe arquivo emendado pro que vem
      // depois, então toca o sting solto. Ele já devolve só a parte com
      // som, então a tela final entra exatamente no fim da música.
      ms = Jingles.tocar(venceu ? "win" : "lose", { taxa: taxaDaOnda() });
    }
    // A risada é longa e fica tocando por cima da próxima tela de propósito:
    // interromper a música pra esperar ela acabar sairia pior.
    if (novoId) Jingles.tocar("risada");

    avisar(venceu
      ? "Acertou! " + cena.fala
      : "Errou! " + vidas + " de " + VIDAS_INICIAIS + " vidas restantes.");

    montarTransicao(elInter, cena.classe, {
      img: cena.img, alt: cena.alt, animar: cena.animar,
      monstros: htmlMonstros(monstros, novoId),
      base: '<div class="mj-trans-vidas" aria-hidden="true">' + htmlVidas(!venceu) + "</div>" +
            '<p class="mj-trans-fala">' + cena.fala + "</p>"
    }, ms);
    elInter.hidden = false;
    await esperarOuPausar(ms);
    elInter.hidden = true;
  }

  // ── 7b. ANÚNCIO: o verbo do próximo minijogo ──
  async function mostrarInstrucao(jogo) {
    palco.innerHTML = "";
    elBarra.style.width = "0%";

    // Normalmente o Jingle já vem tocando desde a tela anterior (arquivo
    // emendado); só na primeira rodada de cada onda ele é tocado aqui.
    const ms = herdarOuTocar("jingle");
    // Esta é a tela que precisa ser LIDA, então é ela que ganha o tempo
    // extra de quem pediu intervalos maiores. O jingle toca uma vez só: se
    // a tela ficou mais longa que ele, o fim dela fica em silêncio mesmo.
    const naTela = ms * Math.max(1, cfg.tempoExtra) + (cfg.intervalosLongos ? EXTRA_INTERVALO : 0);

    montarTransicao(elInstrucao, "mj-inter-proximo", {
      topo: '<span class="mj-instrucao-verbo">' + jogo.instrucao + "</span>",
      img: IMG_ANUNCIA, alt: "Takematsu anunciando o próximo minijogo", animar: true,
      // Sem linha de teclas aqui: o intervalo é pra ler o verbo e a dica
      // rápido. As teclas aparecem dentro do minijogo, onde são usadas.
      base: '<span class="mj-instrucao-dica">' + jogo.dica + "</span>"
    }, ms);
    elInstrucao.hidden = false;
    avisar(jogo.instrucao + " " + jogo.dica);

    const inteiro = await esperarOuPausar(naTela);
    elInstrucao.hidden = true;
    if (inteiro) Jingles.bip(1046, 0.06);   // "vai!" — marca o início da rodada
  }

  // ── 7c. VIRADA DE ONDA: o "speed up" do WarioWare ──
  async function telaOnda() {
    const ms = herdarOuTocar("speedup");
    montarTransicao(elTelaCheia, "mj-tela-onda", {
      topo: '<span class="mj-tc-titulo">MAIS RÁPIDO!</span>',
      img: IMG_ANUNCIA, alt: "Takematsu acelerando", animar: true,
      base: '<p class="mj-tc-sub">Onda ' + onda + " de " + ONDAS_PARA_VENCER + "</p>"
    }, ms);
    elTelaCheia.hidden = false;
    avisar("Mais rápido! Onda " + onda + " de " + ONDAS_PARA_VENCER + ".");
    await esperarOuPausar(ms);
    elTelaCheia.hidden = true;
  }

  // ── 7d. TELA SIMPLES: abertura e derrota, só título e subtítulo ──
  async function telaCheia(titulo, subtitulo, ms) {
    elTelaCheia.className = "mj-tela-simples";
    elTelaCheia.innerHTML =
      '<h2 class="mj-tc-titulo">' + titulo + "</h2>" +
      '<p class="mj-tc-sub">' + subtitulo + "</p>";
    elTelaCheia.hidden = false;
    avisar(titulo + ". " + subtitulo);
    await esperar(ms);
    elTelaCheia.hidden = true;
  }

  // ═══ 8. COMO UMA RODADA RODA ════════════════════════════
  // Devolve uma Promise com o resultado:
  //   true  = acertou      false = errou      null = cancelada pela pausa
  //
  // O minijogo recebe um `ctx` com tudo que ele pode usar — e SÓ com isso.
  // Nenhum minijogo mexe direto no DOM da página nem no estado da sessão.
  function jogarRodada(jogo) {
    return new Promise(function (resolve) {
      let terminou = false;
      const limpezas = [];
      ouvintesAcao = [];

      const duracao = duracaoDoJogo(jogo);
      const inicio  = performance.now();
      let relogio   = null;

      function terminar(resultado) {
        if (terminou) return;
        terminou = true;
        clearInterval(relogio);
        cancelarRodada = null;
        ouvintesAcao = [];
        limpezas.forEach(function (fn) {
          try { fn(); } catch (e) { console.warn("Erro limpando minijogo:", e); }
        });
        resolve(resultado);
      }

      cancelarRodada = function () { terminar(null); };

      const ctx = {
        // ── o que o minijogo pode saber ──
        rodada: rodada,
        onda: onda,
        // Nível de dificuldade (0 a 4). Quem travou a aceleração fica no 0:
        // travar precisa segurar a dificuldade toda, não só o cronômetro.
        nivel: cfg.travarAceleracao ? 0 : (onda - 1),
        duracao: duracao,
        velocidade: velocidadeAtual(),
        cfg: cfg,
        pausado: function () { return pausado; },

        // ── como desenhar ──
        html: function (markup) { palco.innerHTML = markup; },
        el:  function (sel) { return palco.querySelector(sel); },
        els: function (sel) { return Array.prototype.slice.call(palco.querySelectorAll(sel)); },

        // ── como ouvir o jogador ──
        aoAcao: function (fn) { ouvintesAcao.push(fn); },
        aoLimpar: function (fn) { limpezas.push(fn); },

        // ── como falar com o jogador ──
        anunciar: anunciar,
        avisar: avisar,
        narrar: ConfigJogo.narrar,
        bip: Jingles.bip,
        // Nome da tecla que o jogador mapeou pra essa ação, pra cada
        // minijogo mostrar o controle certo na própria cena.
        teclaDe: function (acao) { return ConfigJogo.nomeTecla(cfg.teclas[acao]); },
        dicaTeclas: function (acoes) {
          return '<p class="mj-dica-teclas">' + ConfigJogo.dicaTeclas(acoes) + "</p>";
        },

        // ── utilitários ──
        aleatorio: function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
        embaralhar: function (arr) {
          const copia = arr.slice();
          for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = copia[i]; copia[i] = copia[j]; copia[j] = t;
          }
          return copia;
        },

        // ── como terminar ──
        venceu: function () { terminar(true); },
        perdeu: function () { terminar(false); }
      };

      // A barra mede tempo ABSOLUTO, não a fração da rodada: começando
      // sempre cheia, ela ficava idêntica em toda onda e escondia o minijogo
      // ficando mais curto. Agora a onda 5 já começa com meia barra.
      const escala = Math.min(1, 1 / velocidadeAtual());
      elBarra.style.width = (escala * 100) + "%";

      palco.innerHTML = "";
      try {
        jogo.iniciar(ctx);
      } catch (e) {
        console.error("Minijogo '" + jogo.id + "' quebrou:", e);
        terminar(true);   // erro nosso não pode custar vida do jogador
        return;
      }

      relogio = setInterval(function () {
        const fracao = Math.min(1, (performance.now() - inicio) / duracao);
        elBarra.style.width = (escala * (1 - fracao) * 100) + "%";
        if (fracao >= 1) terminar(jogo.venceNoTempo === true);
      }, 40);

      ctx.aoLimpar(function () { elBarra.style.width = "0%"; });
    });
  }

  function sortearJogo() {
    if (jogos.length === 0) return null;
    if (jogos.length === 1) return jogos[0];
    let escolhido;
    do {
      escolhido = jogos[Math.floor(Math.random() * jogos.length)];
    } while (escolhido === ultimoJogo);
    ultimoJogo = escolhido;
    return escolhido;
  }

  // ═══ 9. O LOOP DA SESSÃO ════════════════════════════════
  // É aqui que dá pra ler o jogo inteiro de cima a baixo.
  async function loopSessao() {
    vidas = VIDAS_INICIAIS;
    pontos = 0; acertos = 0; erros = 0;
    rodada = 0; onda = 1;
    ultimoJogo = null;
    monstros = [];
    atualizarHud();

    // O Takematsu acorda inteiro pra encarar a noite. Sem isso, começar a
    // sessão com a vida já baixa (ou zerada, depois de uma derrota) faz o
    // HP furar o chão logo nos primeiros erros.
    if (typeof vida === "number" && vida < 100) mexerVida(100 - vida);

    // O Intro_com_Jingle cobre a abertura E o anúncio do primeiro minijogo.
    await telaCheia("MODO SOBREVIVÊNCIA",
      "O Takematsu virou. Sobreviva a " + (RODADAS_POR_ONDA * ONDAS_PARA_VENCER) + " minijogos.",
      tocarEmenda("introJingle", "jingle"));

    while (sessaoAtiva) {
      while (pausado) await esperar(120);
      if (!sessaoAtiva) break;

      const jogo = sortearJogo();
      if (!jogo) { console.warn("Nenhum minijogo registrado."); break; }

      // ── anúncio ──
      await mostrarInstrucao(jogo);
      if (!sessaoAtiva) break;
      // Pausou enquanto lia a instrução: refaz a rodada do zero em vez de
      // largar o jogador direto no minijogo já correndo.
      if (pausado) continue;

      // ── minijogo ──
      const venceu = await jogarRodada(jogo);
      if (!sessaoAtiva) break;
      if (venceu === null) continue;   // cancelada pela pausa: não conta

      // ── placar ──
      if (venceu) {
        acertos += 1;
        pontos += PONTOS_POR_ACERTO;
        mexerVida(CURA_POR_ACERTO);
      } else {
        erros += 1;
        vidas -= 1;
        mexerVida(-DANO_POR_ERRO);
      }
      atualizarHud();

      // Que tela vem depois da reação? A intermissão precisa saber pra
      // escolher o arquivo emendado certo e não deixar buraco na música.
      const viraOnda = (rodada + 1) % RODADAS_POR_ONDA === 0;
      const proximo = (vidas <= 0 || (viraOnda && onda + 1 > ONDAS_PARA_VENCER)) ? "fim"
                    : viraOnda ? "speedup"
                    : "jingle";

      // ── reação ──
      await intermissao(venceu, proximo);
      if (!sessaoAtiva) return;   // o jogador saiu pelo menu de pausa

      if (vidas <= 0) { await fim(false); return; }

      // ── virada de onda ──
      rodada++;
      if (rodada % RODADAS_POR_ONDA === 0) {
        onda++;
        if (onda > ONDAS_PARA_VENCER) { await fim(true); return; }
        atualizarHud();
        await telaOnda();
      }
    }

    encerrar();
  }

  // ═══ 10. TELAS DE FIM ═══════════════════════════════════
  // Nota final, no espírito da tela de resultados de fim de fase.
  function notaFinal(taxa) {
    if (taxa >= 1)    return "S";
    if (taxa >= 0.9)  return "A";
    if (taxa >= 0.75) return "B";
    if (taxa >= 0.5)  return "C";
    return "D";
  }

  function linhaPlacar(rotulo, valor, classe) {
    return '<div class="mj-placar-linha' + (classe ? " " + classe : "") + '">' +
             '<span class="mj-placar-rotulo">' + rotulo + "</span>" +
             '<span class="mj-placar-pontos" aria-hidden="true"></span>' +
             '<span class="mj-placar-valor">' + valor + "</span>" +
           "</div>";
  }

  // Espera qualquer tecla ou clique. `esperandoFim` desliga o teclado do
  // jogo enquanto isso, senão as teclas de jogar seriam capturadas antes.
  function esperarInteracao() {
    esperandoFim = true;
    return new Promise(function (resolver) {
      function sair() {
        document.removeEventListener("keydown", sair, true);
        document.removeEventListener("mousedown", sair, true);
        esperandoFim = false;
        resolver();
      }
      document.addEventListener("keydown", sair, true);
      document.addEventListener("mousedown", sair, true);
    });
  }

  async function telaVitoria() {
    const total = acertos + erros;
    const taxa = total ? acertos / total : 0;

    elTelaCheia.className = "mj-vitoria";
    elTelaCheia.style.setProperty("--mj-danca", PASSO_DANCA + "ms");
    elTelaCheia.innerHTML =
      '<p class="mj-vit-aviso">Clique em qualquer lugar, ou aperte qualquer tecla, para voltar à tela inicial</p>' +
      '<div class="mj-vit-corpo">' +
        '<div class="mj-vit-esq">' +
          htmlPersonagem(IMG_COMEMORA, "Takematsu comemorando", true) +
          '<div class="mj-trans-vidas" aria-hidden="true">' + htmlVidas(false) + "</div>" +
        "</div>" +
        '<div class="mj-vit-dir">' +
          '<h2 class="mj-vit-titulo">VOCÊ SOBREVIVEU!</h2>' +
          '<div class="mj-placar">' +
            linhaPlacar("ACERTOS", acertos + " / " + total) +
            linhaPlacar("ERROS", erros) +
            linhaPlacar("ONDAS", ONDAS_PARA_VENCER + " / " + ONDAS_PARA_VENCER) +
            linhaPlacar("PONTOS", pontos) +
            linhaPlacar("NOTA", '<span class="mj-nota">' + notaFinal(taxa) + "</span>", "mj-placar-nota") +
          "</div>" +
        "</div>" +
      "</div>";
    elTelaCheia.hidden = false;

    avisar("Você sobreviveu! " + acertos + " acertos de " + total + ", " + pontos +
           " pontos, nota " + notaFinal(taxa) + ". Aperte qualquer tecla para voltar.");

    Jingles.loop("vitoria");
    await esperarInteracao();
    Jingles.pararLoop("vitoria");
    elTelaCheia.hidden = true;
  }

  async function fim(venceu) {
    if (venceu) {
      // Cura TOTAL, não parcial: com a vida entre 30 e 60, updateBarVida()
      // deixa a Sophia e o Akira spawnados na tela principal e só os esconde
      // acima de 60 — sobreviver ia terminar com os dois grudados na tela.
      mexerVida(100);
      await telaVitoria();
      encerrar();
    } else {
      // Ficar sem vidas é a morte do Takematsu. updateBarVida() cuida do
      // jumpscare e do sprite, respeitando a preferência do jogador.
      mexerVida(-100);
      await telaCheia("VOCÊ NÃO SOBREVIVEU", pontos + " pontos.", Jingles.tocar("gameover"));
      encerrar();
      // De volta à tela inicial com ele morto, a trilha do fim fica rodando
      // até alguém começar outra sessão.
      Jingles.loop("doom");
    }
  }

  function encerrar() {
    sessaoAtiva = false;
    pausado = false;
    abrindo = false;
    fimDaSessao = Date.now();
    ouvintesAcao = [];
    pararMusica();
    restaurarTela();   // o véu abre, o relógio volta ao normal
    palco.innerHTML = "";
    elInstrucao.hidden = true;
    elTelaCheia.hidden = true;
    elInter.hidden = true;
    overlay.hidden = true;
    overlay.classList.remove("mj-pausado");
    document.body.classList.remove("mj-alto-contraste");
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  // ═══ 11. PAUSA ══════════════════════════════════════════
  // Pausar cancela a rodada em andamento sem contar acerto nem erro: alguns
  // minijogos têm temporizadores próprios que não dá pra congelar, e punir
  // quem precisou parar seria o oposto do que este modo quer ser.
  async function pausar() {
    if (pausado) return;
    pausado = true;
    overlay.classList.add("mj-pausado");
    if (cancelarRodada) cancelarRodada();
    // Corta a música junto: a rodada vai ser refeita do zero, e sem isso a
    // próxima tela herdaria a duração de um áudio que já parou.
    pararMusica();
    const continuar = await ConfigJogo.abrir(true);
    ConfigJogo.aplicar();
    overlay.classList.remove("mj-pausado");
    pausado = false;
    // Fecha na hora em vez de esperar o loop perceber: ele pode estar no
    // meio de uma espera longa (cartão de instrução, tela de onda).
    if (!continuar) encerrar();
  }

  // ═══ 12. ABERTURA E ENTRADA ═════════════════════════════
  // O relógio é o gatilho da virada: ele se destaca, os dígitos embaralham
  // e travam nas 3 da manhã. Aí a risada entra e o resto da tela é engolido
  // — o escurecimento dura exatamente o tempo do áudio.
  function horaAleatoria() {
    const p = function (n) { return String(Math.floor(Math.random() * n)).padStart(2, "0"); };
    return p(24) + ":" + p(60) + ":" + p(60);
  }

  async function abertura(forcado) {
    const relogio = document.getElementById("relogio");
    if (relogio) relogio.classList.add("mj-relogio-virando");

    // O Takematsu percebe antes do jogador: fica com cara de quem está
    // pensando enquanto o relógio vira.
    if (typeof travarExpressao === "function") travarExpressao("pensando");

    // Pelo atalho de demonstração o relógio "vira" 3 da manhã na marra.
    // Às 3h de verdade ele já está lá — só ganha o destaque.
    if (forcado && typeof travarRelogio === "function") {
      if (!cfg.reduzirAnimacao) {
        const ate = Date.now() + 700;
        while (Date.now() < ate) {
          travarRelogio(horaAleatoria());
          await esperar(55);
        }
      }
      travarRelogio("03:00:00");
    }

    // A risada entra no MESMO instante em que o relógio crava 3 da manhã —
    // qualquer espera aqui fazia o som parecer atrasado. Ela vem alta: no
    // resto do jogo toca baixinho porque divide espaço com o jingle de erro.
    if (relogio) relogio.classList.add("mj-relogio-3am");
    const ms = Jingles.tocar("risada", { vol: 0.85 });
    const engole = cfg.reduzirAnimacao ? 200 : ms;
    document.body.style.setProperty("--mj-engole", engole + "ms");
    document.body.classList.add("mj-engolindo");
    await esperar(engole);
  }

  function restaurarTela() {
    document.body.classList.remove("mj-engolindo");
    document.body.classList.add("background");
    document.body.style.removeProperty("--mj-engole");
    const relogio = document.getElementById("relogio");
    if (relogio) relogio.classList.remove("mj-relogio-virando", "mj-relogio-3am");
    if (typeof destravarRelogio === "function") destravarRelogio();
    if (typeof destravarExpressao === "function") destravarExpressao();
  }

  // Se o Takematsu continua morto ao voltar pra tela inicial, a trilha de
  // derrota volta com ele. Sem isso, abrir o modo e desistir deixava a tela
  // inicial em silêncio pra sempre.
  function retomarDoomSeMorto() {
    if (typeof vida === "number" && vida <= 0) Jingles.loop("doom");
  }

  async function iniciar(forcado) {
    // `abrindo` cobre a abertura inteira: ela leva alguns segundos e o
    // terrorTime() bate de 10 em 10, então sem isso daria pra disparar duas.
    if (sessaoAtiva || abrindo || ConfigJogo.aberto()) return;
    if (!forcado && Date.now() - fimDaSessao < ESPERA_ENTRE_SESSOES) return;

    // Tira o foco de qualquer campo de texto pra não roubar as teclas.
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

    // Jogar de novo encerra a trilha de derrota que ficou rodando.
    Jingles.pararLoop("doom");
    ConfigJogo.aplicar();

    abrindo = true;
    await abertura(forcado);

    const comecar = await ConfigJogo.abrir(false);
    abrindo = false;
    if (!comecar) {
      fimDaSessao = Date.now();   // respeita o "agora não" pelo tempo de espera
      restaurarTela();
      retomarDoomSeMorto();
      return;
    }

    ConfigJogo.aplicar();
    sessaoAtiva = true;
    overlay.hidden = false;
    loopSessao();
  }

  // ═══ 13. TECLADO ════════════════════════════════════════
  // Um único ouvinte pra sessão inteira: ele decide se a tecla é o atalho de
  // demonstração, a pausa, ou uma ação repassada ao minijogo da vez.
  document.addEventListener("keydown", function (e) {
    // Atalho de demonstração: Ctrl + Shift + 3 (as "3 da manhã")
    if (e.ctrlKey && e.shiftKey && (e.key === "3" || e.key === "#")) {
      e.preventDefault();
      iniciar(true);
      return;
    }

    if (!sessaoAtiva) return;
    // Tela final: qualquer tecla serve pra sair, então o jogo solta o teclado.
    if (esperandoFim) return;

    if (e.key === "Escape") {
      e.preventDefault();
      if (!pausado) pausar();
      return;
    }

    if (pausado) return;  // deixa o teclado livre pro popup de pausa

    const acao = ConfigJogo.acaoDaTecla(e);
    if (!acao) return;
    e.preventDefault();
    ouvintesAcao.slice().forEach(function (fn) { fn(acao, e); });
  }, true);

  // ═══ 14. O QUE ESTE ARQUIVO OFERECE ═════════════════════
  return {
    // scriptMinijogos.js chama isto uma vez por minijogo
    registrar: function (jogo) { jogos.push(jogo); },
    // script.js chama isto às 3h (ou no atalho de demonstração)
    iniciar: iniciar,
    emAndamento: function () { return sessaoAtiva; },
    semJumpscare: function () { return cfg.semJumpscare; },
    config: function () { return cfg; }
  };
})();
