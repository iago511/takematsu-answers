const takematsu = document.getElementById("takematsu")
const comida = document.getElementById("comida")
const barraFome = document.getElementById("barra-fome")
const barraFomeFundo = document.getElementById("barra-fome-fundo")
const chuveiro = document.getElementById("chuveiro")

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let estaEstapeando = false;
let fome = 100;
let sujo = false;
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

function limpar() {
    sujo = false;
    takematsu.style.backgroundColor = "red";
    takematsu.setAttribute("aria-label", "Takematsu limpo, clique para interagir");
}

setInterval(() => {
    fome = Math.max(0, fome - 1);
    atualizarBarra();
}, 8000);

setInterval(() => {
    if (!sujo) ficarSujo();
}, 20000);

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
        if (!sujo || limpando) return;
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
    estaEstapeando = true;
    takematsu.style.backgroundColor= "blue";
    console.log("Iniciou...");
    await sleep(300);
    console.log("Continuou após 2 segundos!");
    takematsu.style.backgroundColor = sujo ? "brown" : "red";
    estaEstapeando = false;
}

function flutuar(){
    if (estaEstapeando) return;
    takematsu.style.backgroundColor = "green";
    takematsu.classList.add('flutuando');
}

function flutuarOff(){
    if (estaEstapeando) return;
    takematsu.style.backgroundColor = sujo ? "brown" : "red";
    console.log("Off");
    takematsu.classList.remove('flutuando');
}

takematsu.addEventListener("mouseover", flutuar);
takematsu.addEventListener("mouseout", flutuarOff);
takematsu.addEventListener("click", estapear);
takematsu.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") estapear();
});