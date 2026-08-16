// ── ELEMENTS ──────────────────────────────────────────────
const takematsuWrap = document.getElementById("takematsu-wrap");
const takematsuImg  = document.getElementById("takematsu-img");
const chatMiniImg   = document.getElementById("chat-mini-img");
const comida        = document.getElementById("comida");
const chuveiro      = document.getElementById("chuveiro");
const barFomeFill   = document.getElementById("bar-fome-fill");
const barFomeTrack  = document.getElementById("bar-fome-track");
const barSujoFill   = document.getElementById("bar-sujo-fill");
const barVidaFill   = document.getElementById("bar-vida-fill");
const barVidaTrack  = document.getElementById("bar-vida-track");
const barSujoTrack  = document.getElementById("bar-sujo-track");
const balao         = document.getElementById("balao");
const chatMessages  = document.getElementById("chat-messages");
const chatInput     = document.getElementById("chat-input");
const chatSend      = document.getElementById("chat-send");

// ── IMAGES MAP ────────────────────────────────────────────
const IMGS = {
  default1:  "imgs/takematsu-falando-1.png",
  default2:  "imgs/takematsu-falando-2.png",
  apanhando: "imgs/takematsu-apanhando.png",
  pensando:  "imgs/pensando-reposta.png",
  banho:     "imgs/modo-banho-quando-chuveiro.png",
  poucoFome: "imgs/pouco-faminto.png",
  muitoFome: "imgs/muito-faminto.png",
  morto:     "imgs/takematsu-morto.png"
};

const ELES = {
  sophia: "imgs/sophia.png",
  akira: "imgs/akira.png",
  iago: "imgs/iago.png"
};

// ── STATE ─────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

let fome          = 100;
let limpeza       = 100;
let vida         = 100;
let estaSlapando  = false;
let estaBanhando  = false;
let estaPensando  = false;
let balaoTimer    = null;
let idleFlip      = true;

const som = new Audio('imgs/som.mp3');

// ── IMAGE CONTROLLER ──────────────────────────────────────
function setImg(key) {
  const src = IMGS[key] || IMGS.default1;
  takematsuImg.src = src;
  if (chatMiniImg) chatMiniImg.src = src;
}
// ── Reloginho ─────────────────────────────────────────────────
// O modo sobrevivência trava o relógio nas 3 da manhã na abertura, então
// ele precisa poder ser congelado num horário fixo.
let relogioTravado = null;

function travarRelogio(texto) { relogioTravado = texto; atualizarRelogio(); }
function destravarRelogio()   { relogioTravado = null;  atualizarRelogio(); }

function atualizarRelogio() {
      if (relogioTravado) {
        document.getElementById('relogio').textContent = relogioTravado;
        return;
      }

      const agora = new Date();
      let horas = agora.getHours().toString().padStart(2, '0');
      let minutos = agora.getMinutes().toString().padStart(2, '0');
      let segundos = agora.getSeconds().toString().padStart(2, '0');

      document.getElementById('relogio').textContent = `${horas}:${minutos}:${segundos}`;
    }

    setInterval(atualizarRelogio, 1000);
    atualizarRelogio();
// ── MODO TERROR ─────────────────────────────────────────────
function spawnarEles() {
  document.getElementById('sophia').style.display = 'block';
  document.getElementById('akira').style.display = 'block';
}
function esconderEles() {
  document.getElementById('sophia').style.display = 'none';
  document.getElementById('akira').style.display = 'none';
}
async function jumpscare(){
  // O jogador pode desligar os sustos no popup dos minijogos.
  if (typeof Sobrevivencia !== "undefined" && Sobrevivencia.semJumpscare()) return;
  som.play();
  document.getElementById('iago').style.display = 'block';
  await sleep(1000);
  document.getElementById('iago').style.display = 'none';
}
function terrorTime() {
    hora = new Date().getHours();
    if (hora >= 3 && hora < 4) {
      // Antes daqui saía um classList.remove("background") que nunca era
      // desfeito: passava das 3h e o gradiente do fundo sumia pro resto da
      // sessão. Quem escurece a tela agora é a própria entrada do modo
      // sobrevivência, que devolve tudo ao normal no fim.
      // Também dá pra chamar na mão com Ctrl + Shift + 3.
      Sobrevivencia.iniciar();
}
}
    setInterval(terrorTime, 10000);
    terrorTime();

// Trava a expressão num frame específico (o modo sobrevivência usa isso
// pra deixar o Takematsu com cara de "pensando" durante a abertura).
let expressaoTravada = false;

function travarExpressao(chave) { expressaoTravada = true; setImg(chave); }
function destravarExpressao()   { expressaoTravada = false; updateIdleImg(); }

function updateIdleImg() {
  if (expressaoTravada || estaSlapando || estaBanhando || estaPensando) return;
  if (vida <= 0) { setImg("morto"); return; }
  if (fome <= 30) { setImg("muitoFome"); return; }
  if (fome <= 60) { setImg("poucoFome"); return; }
  idleFlip = !idleFlip;
  setImg(idleFlip ? "default1" : "default2");
}

// ── BARS ──────────────────────────────────────────────────
function updateBarFome() {
  barFomeFill.style.width = fome + "%";
  barFomeTrack.setAttribute("aria-valuenow", fome);
  if (fome > 60)      barFomeFill.style.background = "#f9a825";
  else if (fome > 30) barFomeFill.style.background = "#fdd835";
  else                barFomeFill.style.background = "#ef5350";
}

function updateBarSujo() {
  barSujoFill.style.width = limpeza + "%";
  barSujoTrack.setAttribute("aria-valuenow", limpeza);
  if (limpeza > 60)      barSujoFill.style.background = "#4fc3f7";
  else if (limpeza > 30) barSujoFill.style.background = "#ffb74d";
  else                   barSujoFill.style.background = "#ef5350";
}

let jaMorreu = false;

// Morto = nada de interagir: nem tapa, nem itens, nem chat.
function estaMorto() { return vida <= 0; }

function aplicarEstadoMorto(morto) {
  document.body.classList.toggle("takematsu-morto", morto);
  takematsuWrap.setAttribute("aria-disabled", morto ? "true" : "false");
  takematsuWrap.setAttribute("tabindex", morto ? "-1" : "0");
  takematsuWrap.setAttribute("aria-label",
    morto ? "Takematsu morto" : "Takematsu, clique para dar um tapa");
  [comida, chuveiro].forEach(item => {
    item.setAttribute("draggable", morto ? "false" : "true");
    item.setAttribute("aria-disabled", morto ? "true" : "false");
    item.setAttribute("tabindex", morto ? "-1" : "0");
  });
  chatInput.disabled = morto;
  chatSend.disabled  = morto;
  chatInput.placeholder = morto ? "O Takematsu não responde mais..." : "Manda uma pergunta...";
}

function updateBarVida() {
  barVidaFill.style.width = vida + "%";
  barVidaTrack.setAttribute("aria-valuenow", vida);
  aplicarEstadoMorto(vida <= 0);

  if (vida <= 0) {
    // Só assusta na hora que ele morre. Sem essa trava, todo dano tomado
    // com a vida já zerada disparava um jumpscare novo.
    if (!jaMorreu) {
      jaMorreu = true;
      jumpscare();
      showBalao("Ih, morri... socorro 😭", 3000);
    }
    barVidaFill.style.background = "#f44336";
    setImg("morto");
    return;
  }

  jaMorreu = false;

  if (vida > 0 && !expressaoTravada) {
    setImg("default1");
  }

  if (vida > 60) {
    barVidaFill.style.background = "#4caf50";
    esconderEles();
  } else if (vida > 30) {
    barVidaFill.style.background = "#ffeb3b";
    spawnarEles();
  } else {
    barVidaFill.style.background = "#f44336";
  }
}

// ── SPEECH BUBBLE ─────────────────────────────────────────
function showBalao(text, duration = 4000) {
  if (balaoTimer) clearTimeout(balaoTimer);
  balao.textContent = text;
  balao.classList.add("visible");
  if (duration < 99999) {
    balaoTimer = setTimeout(() => balao.classList.remove("visible"), duration);
  }
}

function hideBalao() {
  if (balaoTimer) clearTimeout(balaoTimer);
  balao.classList.remove("visible");
}

// ── SLAP ──────────────────────────────────────────────────
takematsuWrap.addEventListener("click", async () => {
  if (estaMorto() || estaSlapando) return;
  estaSlapando = true;

  setImg("apanhando");
  takematsuImg.classList.add("slap-anim");

  const star = document.createElement("div");
  star.className = "star-fx";
  star.textContent = "💥";
  takematsuWrap.appendChild(star);
  setTimeout(() => star.remove(), 500);

  const slapLines = [
    "AH, PARA COM ISSO!!",
    "Irmão, que foi isso?! 😤",
    "Mano eu tô trabalhando aqui!!",
    "Isso aí foi paia demais, tá??",
    "O QUE?? KKKKK não acredito",
    "Ih, fui de base...",
    "MANO! Respeito né??"
  ];
  showBalao(slapLines[Math.floor(Math.random() * slapLines.length)], 2500);

  await sleep(450);
  takematsuImg.classList.remove("slap-anim");
  estaSlapando = false;
  updateIdleImg();
});

takematsuWrap.addEventListener("keydown", e => {
  if (estaMorto()) return;
  if (e.key === "Enter" || e.key === " ") takematsuWrap.click();
});

// ── ITENS (sushi e chuveiro) ──────────────────────────────
// A mesma função serve pro arrastar-e-soltar e pro teclado: os itens têm
// role="button", então precisam responder a Enter e Espaço de verdade.
async function usarItem(id) {
  if (estaMorto() || estaBanhando || estaSlapando) return;

  if (id === "comida") {
    fome = Math.min(100, fome + 25);
    updateBarFome();
    updateIdleImg();
    const eatLines = [
      "UOU isso é genial, tô cheio agora! 🍣",
      "Mano, sushi sempre salva!",
      "Tipo... tava com muita fome mesmo, tá?",
      "Obrigado! Voltei à vida kkkk",
      "Ah sim, isso aí amassei!"
    ];
    showBalao(eatLines[Math.floor(Math.random() * eatLines.length)], 2500);
  }

  if (id === "chuveiro") {
    estaBanhando = true;
    setImg("banho");
    showBalao("Ah sim, hora do banho ✨", 3500);

    for (let i = 0; i < 8; i++) {
      const drop = document.createElement("div");
      drop.className = "water-drop";
      drop.textContent = "💧";
      drop.style.left  = (30 + Math.random() * 140) + "px";
      drop.style.top   = (20 + Math.random() * 60)  + "px";
      drop.style.animationDelay = (i * 0.08) + "s";
      takematsuWrap.appendChild(drop);
      setTimeout(() => drop.remove(), 900);
    }

    const steps = 10;
    const gain  = (100 - limpeza) / steps;
    for (let s = 0; s < steps; s++) {
      limpeza = Math.min(100, limpeza + gain);
      updateBarSujo();
      await sleep(120);
    }
    limpeza = 100;
    updateBarSujo();
    await sleep(800);
    estaBanhando = false;
    updateIdleImg();
  }
}

[comida, chuveiro].forEach(item => {
  const id = item.id;

  item.addEventListener("dragstart", e => {
    if (estaMorto()) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    item.setAttribute("aria-grabbed", "true");
  });
  item.addEventListener("dragend", () => item.setAttribute("aria-grabbed", "false"));

  // Alternativas ao arrastar: clicar ou apertar Enter/Espaço.
  item.addEventListener("click", () => usarItem(id));
  item.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); usarItem(id); }
  });
});

// ── DROP ZONE ─────────────────────────────────────────────
takematsuWrap.addEventListener("dragover", e => {
  if (estaMorto()) return;
  e.preventDefault();                     // sem isso o navegador recusa o drop
  e.dataTransfer.dropEffect = "move";
});

takematsuWrap.addEventListener("drop", e => {
  e.preventDefault();
  usarItem(e.dataTransfer.getData("text/plain"));
});

// ── DRAIN TIMERS ──────────────────────────────────────────
setInterval(() => {
  fome = Math.max(0, fome - 1);
  updateBarFome();
  updateIdleImg();
  if (fome === 0) showBalao("Ih, tô morrendo de fome aqui... socorro 😭", 3000);
}, 8000);

setInterval(() => {
  limpeza = Math.max(0, limpeza - 2);
  updateBarSujo();
  if (limpeza === 0 && !estaBanhando) showBalao("Cara, tô precisando de banho tá?? vergonharato 😅", 3000);
}, 15000);

setInterval(updateIdleImg, 5000);

// ── CONEXÃO COM O BACK-END (API LOCAL) ────────────────────
async function askTakematsu(question) {
  const response = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pergunta: question })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.resposta || "ih, travei aqui... tenta de novo tá?";
}

function addMsg(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}
// ── SOM TIPO ANIMAL CROSSING ──────────────────────────────
let audioCtx = null;

function playTakematsuVoice(text) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  const chars = text.length;

  // Tempo total baseado na quantidade de caracteres
  const duration = Math.min(
    Math.max(chars * 35, 800), // mínimo 0.8s
    12000                      // máximo 12s
  );

  const start = audioCtx.currentTime;
  const end = start + duration / 1000;

  let t = start;

  while (t < end) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "square"; // square lembra mais Animal Crossing

    // Frequência aleatória
    osc.frequency.value = 550 + Math.random() * 300;

    gain.gain.setValueAtTime(0.02, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.04);

    // Intervalo entre os "bips"
    t += 0.055 + Math.random() * 0.02;
  }
}

async function sendChat() {
  if (estaMorto()) return;
  const q = chatInput.value.trim();
  if (!q) return;
  chatInput.value = "";
  chatSend.disabled = true;

  addMsg(q, "user");

  const thinkingDiv = addMsg("pensando...", "bot thinking");
  estaPensando = true;
  setImg("pensando");
  showBalao("Deixa eu pensar...", 99999);

  try {
    const answer = await askTakematsu(q);
    thinkingDiv.remove();
    addMsg(answer, "bot");
    showBalao(answer.slice(0, 140), 5000);

    playTakematsuVoice(answer);

    setImg("default2");
    await sleep(600);
    setImg("default1");
    await sleep(600);
    setImg("default2");
  } catch (err) {
    thinkingDiv.remove();
    const errMsg = "ih, tive um problema técnico aqui... tenta de novo tá?";
    addMsg(errMsg, "bot");
    showBalao(errMsg, 3000);
    console.error("Erro na API:", err);
  } finally {
    estaPensando = false;
    chatSend.disabled = false;
    updateIdleImg();
    chatInput.focus();
  }
}

chatSend.addEventListener("click", sendChat);
chatInput.addEventListener("keydown", e => { if (e.key === "Enter") sendChat(); });

// ── INIT ──────────────────────────────────────────────────
updateBarFome();
updateBarSujo();
updateBarVida();
updateIdleImg();