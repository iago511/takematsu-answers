const takematsu = document.getElementById("takematsu")
const comida = document.getElementById("comida")

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let estaEstapeando = false;


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
});

async function estapear(){
    if (estaEstapeando) return;
    takematsu.classList.remove('flutuando');
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