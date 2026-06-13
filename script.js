const takematsu = document.getElementById("takematsu")
const comida = document.getElementById("comida")
const barraFome = document.getElementById("barra-fome")

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let estaEstapeando = false;
let fome = 100;

function atualizarBarra() {
    barraFome.style.width = fome + "%";
    if (fome > 60) {
        barraFome.style.backgroundColor = "orange";
    } else if (fome > 30) {
        barraFome.style.backgroundColor = "#e0a000";
    } else {
        barraFome.style.backgroundColor = "red";
    }
}

setInterval(() => {
    fome = Math.max(0, fome - 1);
    atualizarBarra();
}, 5000);

comida.addEventListener('dragstart', (evento) => {
    evento.dataTransfer.setData('text/plain', evento.target.id);
});

takematsu.addEventListener('dragover', (evento) => {
    evento.preventDefault();
});

takematsu.addEventListener('drop', (evento) => {
    evento.preventDefault();
    const idElemento = evento.dataTransfer.getData('text/plain');
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
    takematsu.style.backgroundColor= "red";
    estaEstapeando = false;
}

function flutuar(){
    if (estaEstapeando) return;
    takematsu.style.backgroundColor = "green";
    takematsu.classList.add('flutuando');
}

function flutuarOff(){
    if (estaEstapeando) return;
    takematsu.style.backgroundColor = "red";
    console.log("Off");
    takematsu.classList.remove('flutuando');
}

takematsu.addEventListener("mouseover", flutuar);
takematsu.addEventListener("mouseout", flutuarOff);
takematsu.addEventListener("click", estapear)
