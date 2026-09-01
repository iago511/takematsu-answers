/* =========================================================================
 * JINGLES — a trilha sonora do modo sobrevivência
 * =========================================================================
 * Esta é a camada mais de baixo do modo sobrevivência: ela só sabe TOCAR
 * som. Não sabe o que é uma onda, uma rodada ou um minijogo.
 *
 * Ela existe porque o som aqui tem duas manhas que valem ser explicadas:
 *
 *   1. TODO arquivo da pasta jingles/ tem ~1,3 s de silêncio no fim (sobra
 *      da exportação). Por isso cada jingle tem duas durações: `ms` (o
 *      arquivo inteiro) e `som` (até onde o som realmente vai). As telas do
 *      jogo usam `som` — usar `ms` deixava cada intervalo parado no mudo.
 *
 *   2. Os arquivos "_com_" são um sting já colado no jingle seguinte, então
 *      UM arquivo cobre DUAS telas. Ver `emenda()` mais abaixo.
 *
 * Quem usa: scriptSobrevivencia.js (as telas) e scriptConfigJogo.js (o bip
 * de teste ao ligar o som).
 * ========================================================================= */

const Jingles = (function () {
  "use strict";

  // `ms`  = duração do arquivo inteiro
  // `som` = até onde o som realmente vai
  //
  // Pra remedir depois de trocar algum arquivo: frames de MP3 Layer III em
  // silêncio gastam quase nenhum bit (`part2_3_length` ≈ 0), então dá pra
  // achar o último frame com som varrendo o bitstream.
  const CATALOGO = {
    intro:    { arquivo: "jingles/Intro.mp3",         ms: 3135, som: 1829 },
    jingle:   { arquivo: "jingles/Jingle.mp3",        ms: 3135, som: 1829 },
    speedup:  { arquivo: "jingles/SpeedUp.mp3",       ms: 4885, som: 3605 },
    win:      { arquivo: "jingles/Win.mp3",           ms: 3161, som: 1881 },
    lose:     { arquivo: "jingles/Lose.mp3",          ms: 3161, som: 1881 },
    // Mais baixa de propósito: toca junto com o Lose e não pode encobri-lo.
    risada:   { arquivo: "jingles/RisadaMonstro.mp3", ms: 3579, som: 2273, vol: 0.30 },
    gameover: { arquivo: "jingles/GameOver.mp3",      ms: 3814, som: 2508 },

    // Emendados: cada um cobre DUAS telas seguidas, sem buraco entre elas.
    introJingle:  { arquivo: "jingles/Intro_com_Jingle.mp3",  ms: 4859, som: 3553 },
    winJingle:    { arquivo: "jingles/Win_com_Jingle.mp3",    ms: 4885, som: 3605 },
    loseJingle:   { arquivo: "jingles/Lose_com_Jingle.mp3",   ms: 4937, som: 3631 },
    winSpeedup:   { arquivo: "jingles/SpeedUp_com_Win.mp3",   ms: 6583, som: 5277 },
    loseSpeedup:  { arquivo: "jingles/SpeedUp_com_Lose.mp3",  ms: 6609, som: 5329 },

    // Faixas longas em loop (vitória e derrota).
    vitoria:  { arquivo: "jingles/NICE_ONE.mp3",      ms: 27089,  som: 25783 },
    doom:     { arquivo: "jingles/doom.mp3",          ms: 167758, som: 166426, vol: 0.45 }
  };

  const VOLUME_PADRAO = 0.75;

  const audios = {};        // nome → elemento <audio>
  const loopsAtivos = {};   // nome → id do setTimeout que repete a faixa

  // Quem decide se o som está ligado é a configuração do jogador. Como esta
  // camada não conhece a configuração, ela recebe a pergunta de fora.
  let somEstaLigado = function () { return true; };

  // ── CARGA ───────────────────────────────────────────────
  function preparar() {
    Object.keys(CATALOGO).forEach(function (nome) {
      const j = CATALOGO[nome];
      try {
        const a = new Audio(j.arquivo);
        a.preload = "auto";
        a.volume = volumeDe(j);
        a.addEventListener("loadedmetadata", function () {
          conferirDuracao(nome, j, a);
        });
        audios[nome] = a;
      } catch (e) {
        console.warn("Não deu pra carregar o jingle " + nome, e);
      }
    });
  }

  // `som` é medido à mão. Se o arquivo mudou de tamanho, a medida está
  // velha e as telas vão ficar fora do compasso — então avisa no console.
  function conferirDuracao(nome, j, a) {
    if (!isFinite(a.duration) || a.duration <= 0) return;
    const real = Math.round(a.duration * 1000);
    if (Math.abs(real - j.ms) <= 150) return;
    console.warn("Jingle '" + nome + "' mudou de duração (" + j.ms + "ms → " +
      real + "ms). Remeça o 'som' dele em scriptJingles.js.");
    j.ms = real;
    j.som = Math.min(j.som, real);
  }

  function volumeDe(j) { return j.vol == null ? VOLUME_PADRAO : j.vol; }

  // ── TOCAR ───────────────────────────────────────────────
  // Devolve quanto tempo a tela deve ficar no ar: sempre a duração COM SOM,
  // dividida pela velocidade de reprodução.
  //
  // Opções: { vol, taxa }
  //   vol  — sobrescreve o volume do catálogo (a risada, por exemplo, é
  //          baixa no jogo mas vem alta na abertura)
  //   taxa — velocidade de reprodução, usada pra música acelerar junto com
  //          o jogo a cada onda
  function tocar(nome, op) {
    op = op || {};
    const j = CATALOGO[nome];
    if (!j) return 0;

    const taxa = op.taxa || 1;
    const a = audios[nome];

    if (a && somEstaLigado()) {
      try {
        a.pause();
        a.currentTime = 0;
        a.volume = op.vol == null ? volumeDe(j) : op.vol;
        a.playbackRate = taxa;
        // Sem isto o navegador corrige o tom e a aceleração some do ouvido —
        // e o "ficou mais rápido" é justamente o que precisa ser sentido.
        a.preservesPitch = false;
        a.mozPreservesPitch = false;
        a.webkitPreservesPitch = false;
        const p = a.play();
        if (p && p.catch) p.catch(function () { /* autoplay bloqueado */ });
      } catch (e) { /* som indisponível — o jogo segue mudo */ }
    }

    return Math.round(j.som / taxa);
  }

  // ── EMENDAS ─────────────────────────────────────────────
  // Um arquivo "_com_" é o sting de reação já colado no jingle seguinte.
  // Tocando o emendado e trocando de tela no ponto da emenda, a música não
  // para entre uma tela e outra.
  //
  // O ponto da emenda sai de uma subtração simples:
  //     emenda = som(arquivo emendado) − som(jingle que vem depois)
  // Ou seja, não é um número mágico: se os arquivos forem reexportados com
  // outra duração, a conta continua certa sozinha.
  //
  // Devolve { cabeca, cauda } = quanto dura a 1ª tela e quanto dura a 2ª.
  function emenda(combinado, segundo, taxa) {
    taxa = taxa || 1;
    tocar(combinado, { taxa: taxa });
    return {
      cabeca: Math.max(600, Math.round((CATALOGO[combinado].som - CATALOGO[segundo].som) / taxa)),
      cauda:  Math.round(CATALOGO[segundo].som / taxa)
    };
  }

  // ── LOOP ────────────────────────────────────────────────
  // O `loop` nativo do <audio> reiniciaria no fim do ARQUIVO, o que daria
  // 1,3 s de silêncio a cada volta. Então repetimos no fim do SOM.
  function loop(nome) {
    if (!CATALOGO[nome]) return;
    pararLoop(nome);
    const repetir = function () {
      const ms = tocar(nome);
      if (!ms) return;
      loopsAtivos[nome] = setTimeout(repetir, ms);
    };
    repetir();
  }

  function pararLoop(nome) {
    if (loopsAtivos[nome]) {
      clearTimeout(loopsAtivos[nome]);
      delete loopsAtivos[nome];
    }
    silenciar(audios[nome]);
  }

  function pararTudo() {
    Object.keys(loopsAtivos).forEach(function (n) {
      clearTimeout(loopsAtivos[n]);
      delete loopsAtivos[n];
    });
    Object.keys(audios).forEach(function (n) { silenciar(audios[n]); });
  }

  function silenciar(a) {
    if (!a) return;
    try { a.pause(); a.currentTime = 0; } catch (e) {}
  }

  // ── BIPES ───────────────────────────────────────────────
  // Efeitos curtos gerados na hora (Web Audio), não são arquivos: servem de
  // resposta imediata dentro dos minijogos — mover o cursor, entrar na zona
  // certa, acertar, errar.
  let contexto = null;

  function bip(freq, dur, tipo, vol) {
    if (!somEstaLigado()) return;
    try {
      if (!contexto) contexto = new (window.AudioContext || window.webkitAudioContext)();
      const osc   = contexto.createOscillator();
      const ganho = contexto.createGain();
      osc.type = tipo || "square";
      osc.frequency.value = freq || 440;
      ganho.gain.setValueAtTime(vol || 0.05, contexto.currentTime);
      ganho.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + (dur || 0.08));
      osc.connect(ganho);
      ganho.connect(contexto.destination);
      osc.start();
      osc.stop(contexto.currentTime + (dur || 0.08));
    } catch (e) {
      /* áudio bloqueado pelo navegador — o jogo continua sem som */
    }
  }

  preparar();

  return {
    tocar: tocar,
    emenda: emenda,
    loop: loop,
    pararLoop: pararLoop,
    pararTudo: pararTudo,
    bip: bip,
    // Injeta a pergunta "o som está ligado?", respondida pela configuração.
    usarInterruptor: function (fn) { somEstaLigado = fn; }
  };
})();
