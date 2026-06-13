const botaoFixo = document.getElementById("btn-fixed-action");
const caixa = document.getElementById("modal-overlay");
const botao_fechar = document.getElementById("btn-modal-cancel");
const botoes = document.querySelectorAll(".grid-card-btn");

const crescer_fonte = document.getElementById("btn-inc-font");
const disminuir_fonte = document.getElementById("btn-dec-font");
const cor_texto = document.getElementById("input-text-color");
const tirar_imagens = document.getElementById("btn-toggle-images");
const btnBaixaSat = document.getElementById('btn-low-sat');
const btnAltaSat = document.getElementById('btn-high-sat');
const espacamento_alto = document.getElementById("btn-inc-spacing");
const espacamento_baixo = document.getElementById("btn-dec-spacing");
const cor_fundo = document.getElementById("label-bg-color");

botaoFixo.addEventListener('click', function() {
    caixa.style.display = "flex";
});

botao_fechar.addEventListener('click', function() {
    caixa.style.display = "none";
});

botoes.forEach(button => {
    if (!button) return;
    if (!button.hasAttribute("aria-pressed")) {
        button.setAttribute("aria-pressed", "false");
    }
    button.addEventListener("click", () => {
        const isActive = button.classList.toggle("is-active");
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
});

function aumentar_fonte() {
    const texto = document.querySelector('.text-content');
    if (!texto) return;
    if (crescer_fonte.classList.contains("is-active")) {
        texto.style.fontSize = "1.5rem";
        console.log("Aumentando fonte");

        if (disminuir_fonte.classList.contains("is-active")) {
            disminuir_fonte.classList.remove("is-active");
            disminuir_fonte.setAttribute("aria-pressed", "false");
        }
    } else {
        texto.style.fontSize = "1.125rem";
        console.log("Normalizando fonte");
    }
}

function diminui_fonte() {
    const texto = document.querySelector('.text-content');
    if (!texto) return;

    if (disminuir_fonte.classList.contains("is-active")) {
        texto.style.fontSize = "1rem";
        console.log("Diminuindo fonte");

        if (crescer_fonte.classList.contains("is-active")) {
            crescer_fonte.classList.remove("is-active");
            crescer_fonte.setAttribute("aria-pressed", "false");
        }
    } else {
        texto.style.fontSize = "1.125rem";
        console.log("Normalizando fonte");
    }
}

function toggle_imagens() {
    const imagem = document.getElementById('img-content');
    const textoSubstituto = document.getElementById('texto-substituto');

    if (imagem) {
        const pai = imagem.parentNode;
        const novoTexto = document.createElement('span');

        novoTexto.id = 'texto-substituto';
        novoTexto.innerHTML = `<strong>${imagem.title}</strong>: ${imagem.alt}`;
        novoTexto.dataset.src = imagem.src;
        novoTexto.dataset.alt = imagem.alt;
        novoTexto.dataset.title = imagem.title;
        pai.replaceChild(novoTexto, imagem);
    }
    else if (textoSubstituto) {
        const pai = textoSubstituto.parentNode;
        const novaImagem = document.createElement('img');
        novaImagem.id = 'img-content';
        novaImagem.src = textoSubstituto.dataset.src;
        novaImagem.alt = textoSubstituto.dataset.alt;
        novaImagem.title = textoSubstituto.dataset.title;
        pai.replaceChild(novaImagem, textoSubstituto);
    }
}

function mudar_cor_texto() {
    const inputCor = document.getElementById('input-text-color');
    const textos = document.querySelectorAll('.text-content');
    const textos2 = document.querySelectorAll('.card-label');

    textos.forEach(texto => {
        texto.style.color = inputCor.value;
    });
    textos2.forEach(label => {
        label.style.color = inputCor.value;
    });
}

function aumentar_satu() {
    const html = document.querySelector('html');
    if (btnAltaSat.classList.contains("is-active")) {
        html.style.filter = "saturate(300%)";

        if (btnBaixaSat.classList.contains("is-active")) {
            btnBaixaSat.classList.remove("is-active");
            btnBaixaSat.setAttribute("aria-pressed", "false");
        }
    } else {
        html.style.filter = "none";
    }
}

function diminuir_satu() {
    const html = document.querySelector('html');
    if (btnBaixaSat.classList.contains("is-active")) {
        html.style.filter = "saturate(50%)";

        if (btnAltaSat.classList.contains("is-active")) {
            btnAltaSat.classList.remove("is-active");
            btnAltaSat.setAttribute("aria-pressed", "false");
        }
    } else {
        html.style.filter = "none";
    }
}

function aumentar_espacamento() {
    const texto = document.querySelector('.text-content');
    if (!texto) return;

    if (espacamento_alto.classList.contains("is-active")) {
        texto.style.wordSpacing = "15px";
        console.log("Aumentando espaço");

        if (espacamento_baixo.classList.contains("is-active")) {
            espacamento_baixo.classList.remove("is-active");
            espacamento_baixo.setAttribute("aria-pressed", "false");
        }
    } else {
        texto.style.wordSpacing = "normal";
        console.log("Normalizando espaço");
    }
}

function diminuir_espacamento() {
    const texto = document.querySelector('.text-content');
    if (!texto) return;

    if (espacamento_baixo.classList.contains("is-active")) {
        texto.style.wordSpacing = "3px";
        console.log("Diminuindo espaço");

        if (espacamento_alto.classList.contains("is-active")) {
            espacamento_alto.classList.remove("is-active");
            espacamento_alto.setAttribute("aria-pressed", "false");
        }
    } else {
        texto.style.wordSpacing = "normal";
        console.log("Normalizando espaço");
    }
}

function mudar_cor_fundo() {
    const inputCor = document.getElementById('input-bg-color');
    const fundo = document.querySelector('body');

    if (fundo && inputCor) {
        fundo.style.backgroundColor = inputCor.value;
    }
}

cor_fundo.addEventListener('input', mudar_cor_fundo);
espacamento_baixo.addEventListener('click', diminuir_espacamento);
espacamento_alto.addEventListener('click', aumentar_espacamento);
btnBaixaSat.addEventListener('click', diminuir_satu);
btnAltaSat.addEventListener('click', aumentar_satu);
cor_texto.addEventListener('input', mudar_cor_texto);
tirar_imagens.addEventListener('click', toggle_imagens);
crescer_fonte.addEventListener('click', aumentar_fonte);
disminuir_fonte.addEventListener('click', diminui_fonte);
