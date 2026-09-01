/* =========================================================================
 * CONFIGURAÇÃO DO MODO SOBREVIVÊNCIA
 * =========================================================================
 * Segunda camada: tudo que o JOGADOR escolhe, e o teclado.
 *
 * Junta três coisas que andam sempre juntas:
 *   1. As preferências (`cfg`) e o popup que aparece antes de começar;
 *   2. O mapeamento do teclado — traduzir uma tecla apertada numa das três
 *      ações lógicas do jogo;
 *   3. As saídas de acessibilidade: leitor de tela (aria-live) e narração
 *      por voz.
 *
 * REGRA DE OURO DO PROJETO: todo minijogo usa somente três ações lógicas —
 * "anterior", "proximo" e "confirmar". Nada de mouse, nada de arrastar,
 * nada de tecla exclusiva de um jogo só. É isso que faz o remapeamento
 * valer pra sessão inteira, inclusive no modo de duas teclas (varredura),
 * usado por quem tem mobilidade reduzida.
 *
 * Depende de: scriptJingles.js (pro bip de teste ao ligar o som).
 * Quem usa: scriptSobrevivencia.js.
 * ========================================================================= */

const ConfigJogo = (function () {
  "use strict";

  // ── ESQUEMAS DE TECLADO PRONTOS ─────────────────────────
  const PRESETS = {
    setas: { rotulo: "Setas + Enter",  teclas: { anterior: "ArrowLeft", proximo: "ArrowRight", confirmar: "Enter" } },
    wasd:  { rotulo: "A / D + Espaço", teclas: { anterior: "a",         proximo: "d",          confirmar: " "     } },
    duas:  { rotulo: "Duas teclas",    teclas: { anterior: null,        proximo: " ",          confirmar: "Enter" } }
  };

  const PADRAO = {
    preset: "setas",
    teclas: { anterior: "ArrowLeft", proximo: "ArrowRight", confirmar: "Enter" },
    tempoExtra: 1,
    travarAceleracao: false,
    intervalosLongos: false,
    altoContraste: false,
    reduzirAnimacao: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    semJumpscare: false,
    narracao: false,
    sons: true
  };

  const CHAVE_STORAGE = "takematsuSobrevivencia";

  // Este objeto é exportado e lido direto por quem usa. Por isso ele nunca
  // é trocado por outro — só preenchido por dentro (ver `carregar`).
  const cfg = { ...PADRAO, teclas: { ...PADRAO.teclas } };

  // ── ELEMENTOS DO POPUP ──────────────────────────────────
  const modal       = document.getElementById("mj-config");
  const elTeclas    = document.getElementById("mj-teclas-lista");
  const btnComecar  = document.getElementById("mj-comecar");
  const btnCancelar = document.getElementById("mj-cancelar");
  const elAnuncio   = document.getElementById("mj-anuncio");
  const elLegenda   = document.getElementById("mj-legenda-teclas");

  // ── PERSISTÊNCIA ────────────────────────────────────────
  function salvar() {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(cfg));
    } catch (e) {
      console.warn("Não deu pra salvar as configurações dos minijogos.", e);
    }
  }

  function carregar() {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE_STORAGE));
      if (!dados) return;
      // Object.assign em vez de trocar o objeto: quem já pegou a referência
      // de `cfg` continua enxergando os valores novos.
      Object.assign(cfg, dados);
      cfg.teclas = { ...PADRAO.teclas, ...(dados.teclas || {}) };
    } catch (e) {
      console.warn("Configurações dos minijogos corrompidas, usando o padrão.", e);
    }
  }

  // ── TECLADO ─────────────────────────────────────────────
  // Guarda teclas de 1 caractere em minúsculo pra "A" e "a" contarem igual.
  function normalizar(tecla) {
    return (typeof tecla === "string" && tecla.length === 1) ? tecla.toLowerCase() : tecla;
  }

  function nomeTecla(tecla) {
    if (!tecla) return "—";
    const nomes = {
      ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓",
      Enter: "Enter", " ": "Espaço", Escape: "Esc", Tab: "Tab"
    };
    return nomes[tecla] || tecla.toUpperCase();
  }

  // Traduz o evento de teclado numa das três ações lógicas (ou null).
  // Tab / Shift+Tab valem sempre, porque navegar por Tab é justamente o
  // que os minijogos estão ensinando.
  function acaoDaTecla(e) {
    if (e.key === "Tab") return e.shiftKey ? "anterior" : "proximo";
    const k = normalizar(e.key);
    if (cfg.teclas.confirmar && k === normalizar(cfg.teclas.confirmar)) return "confirmar";
    if (cfg.teclas.proximo   && k === normalizar(cfg.teclas.proximo))   return "proximo";
    if (cfg.teclas.anterior  && k === normalizar(cfg.teclas.anterior))  return "anterior";
    return null;
  }

  // Monta a barrinha de teclas mostrada dentro dos minijogos, sempre com o
  // mapeamento atual do jogador.
  const ROTULO_ACAO = { anterior: "voltar", proximo: "navegar", confirmar: "confirmar" };

  function dicaTeclas(acoes) {
    return acoes
      .filter(function (a) { return cfg.teclas[a]; })
      .map(function (a) {
        return '<kbd class="mj-kbd">' + nomeTecla(cfg.teclas[a]) + "</kbd> " + ROTULO_ACAO[a];
      })
      .join('<span class="mj-kbd-sep">·</span>');
  }

  // ── SAÍDAS DE ACESSIBILIDADE ────────────────────────────
  function narrar(texto) {
    if (!cfg.narracao || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const fala = new SpeechSynthesisUtterance(texto);
      fala.lang = "pt-BR";
      fala.rate = 1.15;
      speechSynthesis.speak(fala);
    } catch (e) {
      /* síntese de voz indisponível */
    }
  }

  // Manda o texto pro leitor de tela via aria-live.
  function anunciar(texto) {
    if (!elAnuncio) return;
    elAnuncio.textContent = "";
    elAnuncio.textContent = texto;
  }

  // O par que o jogo usa o tempo todo: escreve pro leitor de tela E narra.
  function avisar(texto) {
    anunciar(texto);
    narrar(texto);
  }

  // ── APLICAR AS PREFERÊNCIAS NA TELA ─────────────────────
  function aplicar() {
    document.body.classList.toggle("mj-alto-contraste", cfg.altoContraste);
    document.body.classList.toggle("mj-sem-animacao", cfg.reduzirAnimacao);
    if (elLegenda) {
      elLegenda.textContent =
        nomeTecla(cfg.teclas.confirmar) + " confirmar   ·   " +
        nomeTecla(cfg.teclas.proximo) + " próximo" +
        (cfg.teclas.anterior ? "   ·   " + nomeTecla(cfg.teclas.anterior) + " anterior" : "") +
        "   ·   Esc pausar";
    }
  }

  // ── DESENHO DO POPUP ────────────────────────────────────
  let modoPausa = false;
  let capturando = null;   // ação aguardando o jogador apertar uma tecla nova

  function marcarRadios(seletor, valor) {
    document.querySelectorAll(seletor).forEach(function (btn) {
      const ativo = btn.dataset.valor === String(valor);
      btn.classList.toggle("is-on", ativo);
      btn.setAttribute("aria-checked", ativo ? "true" : "false");
    });
  }

  function marcarChave(id, ligado) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle("is-on", !!ligado);
    btn.setAttribute("aria-pressed", ligado ? "true" : "false");
  }

  function desenharTeclas() {
    if (!elTeclas) return;
    const linhas = [
      { acao: "anterior",  rotulo: "Voltar / opção anterior" },
      { acao: "proximo",   rotulo: "Avançar / próxima opção" },
      { acao: "confirmar", rotulo: "Confirmar / agir" }
    ];
    elTeclas.innerHTML = linhas.map(function (l) {
      return '<div class="mj-tecla-linha">' +
               '<span class="mj-tecla-rotulo">' + l.rotulo + "</span>" +
               '<kbd class="mj-tecla-valor">' + nomeTecla(cfg.teclas[l.acao]) + "</kbd>" +
               '<button type="button" class="mj-trocar" data-acao="' + l.acao + '" ' +
                 'aria-label="Trocar a tecla de ' + l.rotulo + '">Trocar</button>' +
             "</div>";
    }).join("");

    elTeclas.querySelectorAll(".mj-trocar").forEach(function (btn) {
      btn.addEventListener("click", function () {
        capturando = btn.dataset.acao;
        btn.textContent = "Aperte…";
        btn.classList.add("is-on");
        avisar("Aperte a tecla que você quer usar.");
      });
    });
  }

  function sincronizar() {
    marcarRadios("[data-campo='tempo']", cfg.tempoExtra);
    marcarRadios("[data-campo='preset']", cfg.preset);
    marcarChave("mj-travar",     cfg.travarAceleracao);
    marcarChave("mj-intervalos", cfg.intervalosLongos);
    marcarChave("mj-contraste",  cfg.altoContraste);
    marcarChave("mj-animacao",   cfg.reduzirAnimacao);
    marcarChave("mj-jumpscare",  cfg.semJumpscare);
    marcarChave("mj-narracao",   cfg.narracao);
    marcarChave("mj-sons",       cfg.sons);
    desenharTeclas();
  }

  // Captura da tecla personalizada. Roda na fase de captura pra pegar a
  // tecla antes de qualquer outro ouvinte.
  document.addEventListener("keydown", function (e) {
    if (!capturando) return;
    if (e.key === "Escape") { capturando = null; sincronizar(); return; }
    e.preventDefault();
    e.stopPropagation();
    cfg.teclas[capturando] = e.key;
    cfg.preset = "custom";
    capturando = null;
    salvar();
    aplicar();
    sincronizar();
    marcarRadios("[data-campo='preset']", "custom");
    avisar("Tecla definida: " + nomeTecla(e.key));
  }, true);

  function ligarControles() {
    document.querySelectorAll("[data-campo='tempo']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        cfg.tempoExtra = parseFloat(btn.dataset.valor);
        salvar();
        sincronizar();
      });
    });

    document.querySelectorAll("[data-campo='preset']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const preset = PRESETS[btn.dataset.valor];
        if (!preset) return;
        cfg.preset = btn.dataset.valor;
        cfg.teclas = { ...preset.teclas };
        salvar();
        aplicar();
        sincronizar();
      });
    });

    // Cada par é [id do botão, campo de cfg que ele liga/desliga].
    const interruptores = [
      ["mj-travar",     "travarAceleracao"],
      ["mj-intervalos", "intervalosLongos"],
      ["mj-contraste",  "altoContraste"],
      ["mj-animacao",   "reduzirAnimacao"],
      ["mj-jumpscare",  "semJumpscare"],
      ["mj-narracao",   "narracao"],
      ["mj-sons",       "sons"]
    ];

    interruptores.forEach(function (par) {
      const btn = document.getElementById(par[0]);
      if (!btn) return;
      btn.addEventListener("click", function () {
        cfg[par[1]] = !cfg[par[1]];
        salvar();
        aplicar();
        sincronizar();
        // Amostra na hora, pro jogador ouvir o que acabou de ligar.
        if (par[1] === "narracao" && cfg.narracao) narrar("Narração ligada.");
        if (par[1] === "sons" && cfg.sons) Jingles.bip(660, 0.09);
      });
    });

    if (btnComecar)  btnComecar.addEventListener("click", function () { fechar(true); });
    if (btnCancelar) btnCancelar.addEventListener("click", function () { fechar(false); });
  }

  // ── ABRIR E FECHAR ──────────────────────────────────────
  // `abrir` devolve uma Promise que resolve com true (começar/continuar) ou
  // false (agora não/sair). Assim o jogo simplesmente dá `await` no popup.
  let resolverModal = null;

  function abrir(pausa) {
    modoPausa = !!pausa;
    sincronizar();
    document.getElementById("mj-config-titulo").textContent =
      modoPausa ? "⏸️ Pausado" : "⚠️ Antes de começar";
    btnComecar.textContent  = modoPausa ? "Continuar" : "Começar";
    btnCancelar.textContent = modoPausa ? "Sair da sessão" : "Agora não";
    modal.hidden = false;
    setTimeout(function () { btnComecar.focus(); }, 30);
    avisar(modoPausa
      ? "Jogo pausado. Ajuste o que quiser e continue."
      : "O Takematsu virou. Ajuste as configurações antes de começar.");
    return new Promise(function (r) { resolverModal = r; });
  }

  function fechar(comecar) {
    modal.hidden = true;
    if (resolverModal) {
      const r = resolverModal;
      resolverModal = null;
      r(comecar);
    }
  }

  // ── INIT ────────────────────────────────────────────────
  carregar();
  aplicar();
  ligarControles();
  // O som só toca se o jogador não tiver desligado no popup.
  Jingles.usarInterruptor(function () { return cfg.sons; });

  return {
    cfg: cfg,                       // lido direto por quem usa
    abrir: abrir,
    aberto: function () { return !modal.hidden; },
    aplicar: aplicar,
    acaoDaTecla: acaoDaTecla,
    nomeTecla: nomeTecla,
    dicaTeclas: dicaTeclas,
    avisar: avisar,
    anunciar: anunciar,
    narrar: narrar
  };
})();
