/* =========================================================================
 * MINIJOGOS DO MODO SOBREVIVÊNCIA
 * =========================================================================
 * Cada minijogo simula uma barreira real de acessibilidade. Todos usam só
 * as três ações lógicas do motor (anterior · proximo · confirmar) e nada de
 * mouse, então funcionam igual com setas, com WASD ou no modo de duas teclas.
 *
 * Formato de um minijogo:
 *   {
 *     id: "identificador",
 *     instrucao: "VERBO!",          // o que aparece gigante na tela
 *     dica: "frase curta",          // explicação, mostrada e narrada
 *     duracao: 4000,                // ms na velocidade 1 (o motor acelera)
 *     iniciar(ctx) { ... }          // monta o palco e chama ctx.venceu()/perdeu()
 *   }
 *
 * A dificuldade escala por ctx.nivel (0 a 4, um por onda), não pela rodada:
 * o motor já encurta a duração de cada rodada onda a onda, então somar as
 * duas coisas deixava os últimos minijogos impossíveis. ctx.nivel também
 * fica travado em 0 se o jogador marcou "travar a aceleração".
 * ========================================================================= */

(function () {
  "use strict";

  // ── SELETOR COMPARTILHADO ───────────────────────────────
  // Cursor que anda pelos elementos .mj-opcao do palco. É o mesmo padrão da
  // varredura por acionador: avança, volta e confirma — nada mais.
  function seletor(ctx, aoEscolher) {
    const opcoes = ctx.els(".mj-opcao");
    let i = 0;

    // Toda cena de escolha ganha a barrinha de teclas do jogador.
    const cena = ctx.el(".mj-cena");
    if (cena) cena.insertAdjacentHTML("beforeend", ctx.dicaTeclas(["anterior", "proximo", "confirmar"]));

    function marcar(falar) {
      opcoes.forEach(function (el, n) {
        el.classList.toggle("mj-selecionado", n === i);
        el.setAttribute("aria-selected", n === i ? "true" : "false");
      });
      if (falar) {
        const leitura = opcoes[i].dataset.leitura || opcoes[i].textContent;
        ctx.avisar(leitura.trim() + ". Opção " + (i + 1) + " de " + opcoes.length + ".");
      }
    }

    marcar(true);

    ctx.aoAcao(function (acao) {
      if (acao === "proximo") {
        i = (i + 1) % opcoes.length;
        ctx.bip(520, 0.05);
        marcar(true);
      } else if (acao === "anterior") {
        i = (i - 1 + opcoes.length) % opcoes.length;
        ctx.bip(440, 0.05);
        marcar(true);
      } else if (acao === "confirmar") {
        aoEscolher(i, opcoes[i]);
      }
    });
  }

  // Badge grande de "aperte tal tecla", pros minijogos de tempo.
  function badgeConfirmar(ctx, texto) {
    return '<p class="mj-badge-tecla">' + texto +
           ' <kbd class="mj-kbd mj-kbd-grande">' + ctx.teclaDe("confirmar") + "</kbd></p>";
  }

  // ── CONTRASTE (WCAG 2.1) ────────────────────────────────
  function luminancia(hex) {
    const n = parseInt(hex.slice(1), 16);
    const canais = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
  }

  function razaoContraste(corA, corB) {
    const a = luminancia(corA);
    const b = luminancia(corB);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  // =======================================================================
  // 1. LEGENDE! — o áudio já começou, ative a legenda na hora certa.
  // =======================================================================
  Sobrevivencia.registrar({
    id: "legende",
    instrucao: "LEGENDE!",
    dica: "Confirme quando o marcador estiver dentro da faixa verde.",
    duracao: 4200,
    iniciar: function (ctx) {
      const d = ctx.nivel;
      const largura = Math.max(20, 34 - d * 3.5);
      const inicio  = ctx.aleatorio(8, Math.floor(90 - largura));
      const fim     = inicio + largura;

      ctx.html(
        '<div class="mj-cena">' +
          '<p class="mj-fala">🔊 “…………”<span class="mj-sem-legenda">[áudio sem legenda]</span></p>' +
          '<div class="mj-trilha" role="presentation">' +
            '<div class="mj-zona" style="left:' + inicio + '%;width:' + largura + '%"><span>CC</span></div>' +
            '<div class="mj-marcador"></div>' +
          "</div>" +
          badgeConfirmar(ctx, "Na faixa verde, aperte") +
        "</div>"
      );

      const marcador = ctx.el(".mj-marcador");
      const passo = 0.8 + d * 0.15;
      let pos = 0;
      let direcao = 1;
      let estavaDentro = false;

      function dentroDaZona() { return pos >= inicio && pos <= fim; }

      const animacao = setInterval(function () {
        if (ctx.pausado()) return;
        pos += direcao * passo;
        if (pos >= 100) { pos = 100; direcao = -1; }
        if (pos <= 0)   { pos = 0;   direcao = 1;  }
        marcador.style.left = pos + "%";

        // Pista sonora e visual pra quem não está olhando fixo na trilha.
        const dentro = dentroDaZona();
        if (dentro !== estavaDentro) {
          estavaDentro = dentro;
          marcador.classList.toggle("mj-na-zona", dentro);
          ctx.el(".mj-zona").classList.toggle("mj-zona-ativa", dentro);
          ctx.bip(dentro ? 780 : 300, 0.04);
        }
      }, 16);

      ctx.aoLimpar(function () { clearInterval(animacao); });

      ctx.aoAcao(function (acao) {
        if (acao !== "confirmar") return;
        if (dentroDaZona()) ctx.venceu();
        else ctx.perdeu();
      });
    }
  });

  // =======================================================================
  // 2. ENXERGUE! — escolha o único texto que passa nos 4.5:1 da WCAG.
  // =======================================================================
  Sobrevivencia.registrar({
    id: "contraste",
    instrucao: "ENXERGUE!",
    dica: "Escolha o único texto que dá pra ler de verdade.",
    duracao: 5400,
    iniciar: function (ctx) {
      const FUNDOS = ["#1a0330", "#2b0a45", "#0b0016", "#3d1160"];
      const TEXTOS = ["#e8d5f5", "#f6ecff", "#ce93d8", "#9b59b6",
                      "#7b1fa2", "#4a0072", "#5b2a78", "#e040fb", "#341052"];

      // Nas últimas ondas as opções chegam mais perto do limite da norma.
      const apertado = ctx.nivel >= 3;
      const minBom  = apertado ? 4.5 : 7;
      const maxRuim = apertado ? 3.4 : 2.4;

      const bons = [];
      const ruins = [];
      FUNDOS.forEach(function (fundo) {
        TEXTOS.forEach(function (texto) {
          const razao = razaoContraste(fundo, texto);
          if (razao >= minBom) bons.push({ fundo: fundo, texto: texto });
          else if (razao <= maxRuim) ruins.push({ fundo: fundo, texto: texto });
        });
      });

      const bom = ctx.embaralhar(bons)[0];
      const dois = ctx.embaralhar(ruins).slice(0, 2);
      const cartas = ctx.embaralhar([bom].concat(dois));

      ctx.html(
        '<div class="mj-cena">' +
          '<div class="mj-opcoes mj-opcoes-larga" role="listbox" aria-label="Amostras de contraste">' +
            cartas.map(function (c, i) {
              return '<div class="mj-opcao mj-amostra" role="option" aria-selected="false" ' +
                       'data-boa="' + (c === bom) + '" ' +
                       'data-leitura="Amostra ' + (i + 1) + '" ' +
                       'style="background:' + c.fundo + ";color:" + c.texto + '">' +
                       "ACESSÍVEL" +
                     "</div>";
            }).join("") +
          "</div>" +
        "</div>"
      );

      seletor(ctx, function (indice, el) {
        if (el.dataset.boa === "true") ctx.venceu();
        else ctx.perdeu();
      });
    }
  });

  // =======================================================================
  // 3. NAVEGUE! — só um elemento tem rótulo. Os outros são div sem nome.
  // =======================================================================
  Sobrevivencia.registrar({
    id: "navegue",
    instrucao: "NAVEGUE!",
    dica: "Só um elemento tem rótulo. Confirme nele.",
    duracao: 5400,
    iniciar: function (ctx) {
      const ROTULOS = ["Pular para o conteúdo", "Menu principal", "Enviar formulário",
                       "Fechar aviso", "Buscar no site", "Voltar ao topo"];
      const MUDOS = ["&lt;div&gt;", "???", "🖼️", "&lt;span&gt;", "▢", "🔘"];

      const total = Math.min(6, 3 + ctx.nivel);
      const alvo  = ctx.aleatorio(0, total - 1);
      const rotulo = ctx.embaralhar(ROTULOS)[0];
      const mudos  = ctx.embaralhar(MUDOS);

      let html = "";
      for (let i = 0; i < total; i++) {
        if (i === alvo) {
          html += '<div class="mj-opcao mj-elemento mj-rotulado" role="option" aria-selected="false" ' +
                    'data-alvo="true" data-leitura="Botão: ' + rotulo + '">' +
                    '<span class="mj-el-tipo">botão</span>' + rotulo +
                  "</div>";
        } else {
          html += '<div class="mj-opcao mj-elemento mj-mudo" role="option" aria-selected="false" ' +
                    'data-leitura="Elemento sem rótulo">' +
                    '<span class="mj-el-tipo">sem rótulo</span>' + mudos[i % mudos.length] +
                  "</div>";
        }
      }

      ctx.html(
        '<div class="mj-cena">' +
          '<p class="mj-legenda-cena">Você só tem o teclado. Quem tem rótulo?</p>' +
          '<div class="mj-opcoes" role="listbox" aria-label="Elementos da página">' + html + "</div>" +
        "</div>"
      );

      seletor(ctx, function (indice, el) {
        if (el.dataset.alvo === "true") ctx.venceu();
        else ctx.perdeu();
      });
    }
  });

  // =======================================================================
  // 4. ESCUTE! — sem visual nenhum: obedeça o leitor de tela.
  // =======================================================================
  Sobrevivencia.registrar({
    id: "escute",
    instrucao: "ESCUTE!",
    dica: "A tela apagou. Aperte a tecla que o leitor de tela mandar.",
    duracao: 5600,
    iniciar: function (ctx) {
      const NOMES = { anterior: "VOLTAR", proximo: "AVANÇAR", confirmar: "CONFIRMAR" };
      const TONS  = { anterior: 330, proximo: 494, confirmar: 660 };

      // No modo de duas teclas não existe "voltar", então ele sai do sorteio.
      const disponiveis = ["proximo", "confirmar"];
      if (ctx.cfg.teclas.anterior) disponiveis.push("anterior");

      const tamanho = 1 + Math.min(2, Math.floor(ctx.nivel / 2));
      const sequencia = [];
      for (let i = 0; i < tamanho; i++) {
        sequencia.push(disponiveis[ctx.aleatorio(0, disponiveis.length - 1)]);
      }

      ctx.html(
        '<div class="mj-cena mj-escuro">' +
          '<p class="mj-escuro-aviso">🕶️ SEM VISUAL</p>' +
          '<p class="mj-comando" id="mj-comando"></p>' +
          '<p class="mj-badge-tecla">aperte <kbd class="mj-kbd mj-kbd-grande" id="mj-comando-tecla"></kbd></p>' +
          '<p class="mj-passo" id="mj-passo"></p>' +
        "</div>"
      );

      const elComando = ctx.el("#mj-comando");
      const elTecla   = ctx.el("#mj-comando-tecla");
      const elPasso   = ctx.el("#mj-passo");
      let atual = 0;

      function mostrar() {
        const acao = sequencia[atual];
        elComando.textContent = NOMES[acao];
        elTecla.textContent = ctx.teclaDe(acao);
        elPasso.textContent = (atual + 1) + " / " + sequencia.length;
        ctx.avisar("O leitor de tela diz: " + NOMES[acao]);
        ctx.bip(TONS[acao], 0.12, "sine", 0.06);
      }

      mostrar();

      ctx.aoAcao(function (acao) {
        if (acao !== sequencia[atual]) { ctx.perdeu(); return; }
        atual++;
        if (atual >= sequencia.length) ctx.venceu();
        else mostrar();
      });
    }
  });

  // =======================================================================
  // 5. DESCREVA! — escolha o texto alternativo que descreve a imagem.
  // =======================================================================
  Sobrevivencia.registrar({
    id: "descreva",
    instrucao: "DESCREVA!",
    dica: "Escolha o texto alternativo que realmente descreve a imagem.",
    duracao: 5600,
    iniciar: function (ctx) {
      const FIGURAS = [
        { emoji: "🍣", bom: "Sushis para Takematsu" },
        { emoji: "🚿", bom: "Chuveiro ligado" },
        { emoji: "🧑‍🦽", bom: "Pessoa em cadeira de rodas" },
        { emoji: "📢", bom: "Alto-falante anunciando" },
        { emoji: "🐦", bom: "Pássaro vermelho parado" },
        { emoji: "⛩️", bom: "Portal torii japonês" },
        { emoji: "🕐", bom: "Relógio marcando uma hora" },
        { emoji: "👻", bom: "Fantasma branco linguarudo" }
      ];
      const RUINS = ["imagem", "clique aqui", "IMG_0421.png", "foto",
                     "spacer.gif", "gráfico", "sem descrição", "img"];

      const figura = ctx.embaralhar(FIGURAS)[0];
      const ruins  = ctx.embaralhar(RUINS).slice(0, 2);
      const alternativas = ctx.embaralhar([
        { texto: figura.bom, bom: true },
        { texto: ruins[0], bom: false },
        { texto: ruins[1], bom: false }
      ]);

      ctx.html(
        '<div class="mj-cena">' +
          '<div class="mj-emoji" role="img" aria-label="Imagem sem descrição">' + figura.emoji + "</div>" +
          '<div class="mj-opcoes" role="listbox" aria-label="Textos alternativos">' +
            alternativas.map(function (a) {
              return '<div class="mj-opcao mj-alt" role="option" aria-selected="false" ' +
                       'data-boa="' + a.bom + '">alt="' + a.texto + '"</div>';
            }).join("") +
          "</div>" +
        "</div>"
      );

      seletor(ctx, function (indice, el) {
        if (el.dataset.boa === "true") ctx.venceu();
        else ctx.perdeu();
      });
    }
  });

  // =======================================================================
  // 6. RAMPA! — solte a rampa antes da cadeira de rodas bater no degrau.
  // =======================================================================
  Sobrevivencia.registrar({
    id: "rampa",
    instrucao: "RAMPA!",
    dica: "Confirme dentro da faixa verde, logo antes do degrau.",
    duracao: 4600,
    iniciar: function (ctx) {
      const d = ctx.nivel;
      const degrau = ctx.aleatorio(62, 84);
      const zona   = Math.max(12, 26 - d * 3);
      const inicioZona = degrau - zona;

      ctx.html(
        '<div class="mj-cena">' +
          '<div class="mj-pista" role="presentation">' +
            '<div class="mj-zona-rampa" style="left:' + inicioZona + '%;width:' + zona + '%"></div>' +
            '<div class="mj-degrau" style="left:' + degrau + '%">▛</div>' +
            '<div class="mj-pessoa">🧑‍🦽</div>' +
          "</div>" +
          '<p class="mj-legenda-cena">Degrau sem rampa à frente.</p>' +
          badgeConfirmar(ctx, "Na faixa verde, aperte") +
        "</div>"
      );

      const pessoa = ctx.el(".mj-pessoa");
      const passo = 0.35 + d * 0.12;
      let pos = 0;
      let avisou = false;

      const animacao = setInterval(function () {
        if (ctx.pausado()) return;
        pos += passo;
        pessoa.style.left = pos + "%";

        if (!avisou && pos >= inicioZona) {
          avisou = true;
          pessoa.classList.add("mj-na-zona");
          ctx.el(".mj-zona-rampa").classList.add("mj-zona-ativa");
          ctx.bip(780, 0.05);
        }
        if (pos > degrau) {
          clearInterval(animacao);
          ctx.avisar("Bateu no degrau.");
          ctx.perdeu();
        }
      }, 16);

      ctx.aoLimpar(function () { clearInterval(animacao); });

      ctx.aoAcao(function (acao) {
        if (acao !== "confirmar") return;
        if (pos >= inicioZona && pos <= degrau) ctx.venceu();
        else ctx.perdeu();
      });
    }
  });

  // =======================================================================
  // 7. PAUSE! — conteúdo piscante na tela: pause o quanto antes.
  // =======================================================================
  Sobrevivencia.registrar({
    id: "pisca",
    instrucao: "PAUSE!",
    dica: "Espere o aviso aparecer e só então confirme, o mais rápido que der.",
    duracao: 4400,
    iniciar: function (ctx) {
      // A espera e a janela saem da duração da rodada, senão em ondas
      // rápidas o cronômetro estouraria antes do aviso aparecer.
      const espera = ctx.aleatorio(350, Math.max(500, Math.floor(ctx.duracao * 0.35)));
      const base   = Math.max(500, 950 - ctx.nivel * 90);
      const janela = Math.max(380, Math.min(base, ctx.duracao - espera - 120));
      let liberado = false;

      ctx.html(
        '<div class="mj-cena">' +
          '<div class="mj-alerta" id="mj-alerta">' +
            '<span class="mj-alerta-espera">aguarde o aviso…</span>' +
          "</div>" +
          badgeConfirmar(ctx, "Quando aparecer, aperte") +
        "</div>"
      );

      const alerta = ctx.el("#mj-alerta");
      let prazo = null;

      const disparo = setTimeout(function () {
        liberado = true;
        alerta.classList.add("mj-alerta-ativo");
        // Com "reduzir animações" ligado o cartão não estrobosca: só troca
        // pro estado de alerta, que é justamente o que a WCAG pede.
        if (!ctx.cfg.reduzirAnimacao) alerta.classList.add("mj-alerta-piscando");
        alerta.innerHTML = "⚡ CONTEÚDO PISCANTE";
        ctx.avisar("Pause agora!");
        ctx.bip(990, 0.1);

        prazo = setTimeout(function () {
          ctx.avisar("Demorou demais.");
          ctx.perdeu();
        }, janela);
      }, espera);

      ctx.aoLimpar(function () {
        clearTimeout(disparo);
        clearTimeout(prazo);
      });

      ctx.aoAcao(function (acao) {
        if (acao !== "confirmar") return;
        if (!liberado) {
          ctx.avisar("Cedo demais.");
          ctx.perdeu();
        } else {
          ctx.venceu();
        }
      });
    }
  });
})();
