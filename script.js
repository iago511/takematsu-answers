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

// ── QTE ─────────────────────────────────────────────────
let qteActive = false;
let requiredKey = 'f';
let qteTimeout, countdownInterval;
let timeLeft = 2.0;

function startQTE() {
    document.getElementById('qte-container').style.display = 'block';
    qteActive = true;
    timeLeft = 2.0;

    document.getElementById('target-key').innerText = requiredKey.toUpperCase();
    document.getElementById('timer').innerText = timeLeft.toFixed(1);

    // Atualiza o visor do tempo a cada 100ms
    countdownInterval = setInterval(() => {
        timeLeft -= 0.1;
        if (timeLeft > 0) {
            document.getElementById('timer').innerText = timeLeft.toFixed(1);
        }
    }, 100);

    // Tempo limite total (2 segundos)
    qteTimeout = setTimeout(() => {
        endQTE(false, 'Tempo esgotado! Você perdeu.');
        vida = Math.max(0, vida - 20);
        updateBarVida();
    }, 2000);
}

document.addEventListener('keydown', (event) => {
    if (!qteActive) return;

    if (event.key.toLowerCase() === requiredKey) {
        endQTE(true, 'Sucesso! Você agiu a tempo.');
        vida = Math.max(0, vida + 10);
        updateBarVida();
    } else {
        endQTE(false, 'Tecla errada! Você perdeu.');
        vida = Math.max(0, vida - 20);
        updateBarVida();
    }
});

function endQTE(success, message) {
    qteActive = false;
    clearTimeout(qteTimeout);
    clearInterval(countdownInterval);

    document.getElementById('qte-container').style.display = 'none';
}

// ── IMAGE CONTROLLER ──────────────────────────────────────
function setImg(key) {
  const src = IMGS[key] || IMGS.default1;
  takematsuImg.src = src;
  if (chatMiniImg) chatMiniImg.src = src;
}
// ── Reloginho ─────────────────────────────────────────────────
function atualizarRelogio() {
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
  som.play();
  document.getElementById('iago').style.display = 'block';
  await sleep(1000);
  document.getElementById('iago').style.display = 'none';
}
function terrorTime() {
    hora = new Date().getHours();
    if (hora >= 3 && hora < 4) {
      document.body.classList.remove("background");
      startQTE();
}
}
    setInterval(terrorTime, 10000);
    terrorTime();

function updateIdleImg() {
  if (estaSlapando || estaBanhando || estaPensando) return;
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

function updateBarVida() {
  barVidaFill.style.width = vida + "%";
  barVidaTrack.setAttribute("aria-valuenow", vida);

  if (vida <= 0) {
    jumpscare();
    barVidaFill.style.background = "#f44336";
    setImg("morto");
    showBalao("Ih, morri... socorro 😭", 3000);
    return;
  }

  if (vida > 0) {
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
  if (estaSlapando) return;
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
  if (e.key === "Enter" || e.key === " ") takematsuWrap.click();
});

// ── DRAG & DROP – FOOD ────────────────────────────────────
comida.addEventListener("dragstart", e => {
  e.dataTransfer.setData("text/plain", "comida");
  comida.setAttribute("aria-grabbed", "true");
});
comida.addEventListener("dragend", () => comida.setAttribute("aria-grabbed", "false"));

// ── DRAG & DROP – SHOWER ──────────────────────────────────
chuveiro.addEventListener("dragstart", e => {
  e.dataTransfer.setData("text/plain", "chuveiro");
  chuveiro.setAttribute("aria-grabbed", "true");
});
chuveiro.addEventListener("dragend", () => chuveiro.setAttribute("aria-grabbed", "false"));

// ── DROP ZONE ─────────────────────────────────────────────
takematsuWrap.addEventListener("dragover", e => e.preventDefault());

takematsuWrap.addEventListener("drop", async e => {
  e.preventDefault();
  const id = e.dataTransfer.getData("text/plain");

  if (id === "comida") {
    if (estaBanhando || estaSlapando) return;
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
    if (estaBanhando || estaSlapando) return;
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