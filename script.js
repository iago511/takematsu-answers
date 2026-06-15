import { responder } from './scriptAgente.js';

const submitButton = document.getElementById("submit-button")
const takematsu = document.getElementById("takematsu")
const comida = document.getElementById("comida")
const barraFome = document.getElementById("barra-fome")
const barraFomeFundo = document.getElementById("barra-fome-fundo")
const chuveiro = document.getElementById("chuveiro")
const resposta = document.getElementById("answer")
const questionContainer = document.getElementById("question-container")
const input = document.querySelector("input.question")


submitButton.addEventListener("click", async () => {
    resposta.classList.remove("invisivel");
    resposta.textContent = "Takematsu está pensando...";
    const respostaGerada = document.createElement("p");
    respostaGerada.textContent = await responder(input.value);
    resposta.textContent = "";
    resposta.appendChild(respostaGerada);
    input.value = "";
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let estaEstapeando = false;
let fome = 100;
let sujo = false;
let muitoSujo = false;
let limpando = false;

function atualizarBarra() {
    barraFome.style.width = fome + "%";
    barraFomeFundo.setAttribute("aria-valuenow", fome);
    if (fome > 60) {
        barraFome.style.backgroundColor = "orange";
    } else if (fome > 30) {
        barraFome.style.backgroundColor = "#e0a000";
    } else {
        barraFome.style.backgroundColor = "red";
    }
}

function ficarSujo() {
    sujo = true;
    takematsu.style.backgroundColor = "brown";
    takematsu.setAttribute("aria-label", "Takematsu sujo, arraste o chuveiro para limpar");
}
function ficarMuitoSujo() {
    muitoSujo = true;
    takematsu.style.backgroundColor = "purple";
    takematsu.setAttribute("aria-label", "Takematsu muito sujo, arraste o chuveiro para limpar");
}

function limpar() {
    sujo = false;
    muitoSujo = false;
    takematsu.style.backgroundColor = "red";
    takematsu.setAttribute("aria-label", "Takematsu limpo, clique para interagir");
}

setInterval(() => {
    fome = Math.max(0, fome - 1);
    atualizarBarra();
}, 8000);

setInterval(() => {
    if (!sujo && !muitoSujo) ficarSujo();
}, 20000);
setInterval(() => {
    if (sujo && !muitoSujo) ficarMuitoSujo();
}, 30000);
comida.addEventListener('dragstart', (evento) => {
    evento.dataTransfer.setData('text/plain', evento.target.id);
    comida.setAttribute("aria-grabbed", "true");
});

comida.addEventListener('dragend', () => {
    comida.setAttribute("aria-grabbed", "false");
});

chuveiro.addEventListener('dragstart', (evento) => {
    evento.dataTransfer.setData('text/plain', "chuveiro");
    chuveiro.setAttribute("aria-grabbed", "true");
});

chuveiro.addEventListener('dragend', () => {
    chuveiro.setAttribute("aria-grabbed", "false");
});

takematsu.addEventListener('dragover', (evento) => {
    evento.preventDefault();
});

takematsu.addEventListener('drop', async (evento) => {
    evento.preventDefault();
    const idElemento = evento.dataTransfer.getData('text/plain');

    if (idElemento === "chuveiro") {
        if (!sujo && !muitoSujo || limpando ) return;
        limpando = true;
        takematsu.style.transition = "background-color 0.4s ease";
        const cores = ["#8B4513", "#A0522D", "#cd853f", "#DEB887", "#f5deb3", "red"];
        for (const cor of cores) {
            takematsu.style.backgroundColor = cor;
            await sleep(200);
        }
        limpar();
        takematsu.style.transition = "";
        limpando = false;
        return;
    }

    console.log(`O Takematsu comeu o elemento: ${idElemento}`);
    fome = Math.min(100, fome + 25);
    atualizarBarra();
});

async function estapear(){
    if (estaEstapeando) return;
    takematsu.classList.remove('flutuando');
    estaEstapeando = true;
    takematsu.style.backgroundColor= "blue";
    console.log("Iniciou...");
    await sleep(300);
    console.log("Continuou após 2 segundos!");
    if (sujo && !muitoSujo) {
        takematsu.style.backgroundColor = "brown";
    }
    else if (sujo && muitoSujo) {
        takematsu.style.backgroundColor = "purple";
    }
    else {
        takematsu.style.backgroundColor = "red";
    }
    estaEstapeando = false;
}

function flutuar(){
    if (estaEstapeando) return;
    takematsu.style.backgroundColor = "green";
    takematsu.classList.add('flutuando');
}

function flutuarOff(){
    if (estaEstapeando) return;
    if (sujo && !muitoSujo) {
        takematsu.style.backgroundColor = "brown";
    }
    else if (sujo && muitoSujo) {
        takematsu.style.backgroundColor = "purple";
    }
    else {
        takematsu.style.backgroundColor = "red";
    }
    console.log("Off");
    takematsu.classList.remove('flutuando');
}


takematsu.addEventListener("mouseover", flutuar);
takematsu.addEventListener("mouseout", flutuarOff);
takematsu.addEventListener("click", estapear);
takematsu.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") estapear();
});