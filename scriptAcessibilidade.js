//==================================================
// ELEMENTOS DO HTML
//==================================================

const btnA11y = document.getElementById("btn-a11y");
const modal = document.getElementById("modal-overlay");
const btnFechar = document.getElementById("btn-modal-cancel");

const btnIncFont = document.getElementById("btn-inc-font");
const btnDecFont = document.getElementById("btn-dec-font");

const btnToggleImages = document.getElementById("btn-toggle-images");

const btnLowSat = document.getElementById("btn-low-sat");
const btnHighSat = document.getElementById("btn-high-sat");

const btnIncSpacing = document.getElementById("btn-inc-spacing");
const btnDecSpacing = document.getElementById("btn-dec-spacing");

const inputTextColor = document.getElementById("input-text-color");
const inputBgColor = document.getElementById("input-bg-color");

const botoes = document.querySelectorAll(".grid-card-btn");


//==================================================
// CONFIGURAÇÕES
//==================================================


let tamanhoFonte = 100;
let espacamento = 0;
let imagensOcultas = false;
let saturacao = "normal";


//==================================================
// LOCAL STORAGE
//==================================================


function salvarConfiguracoes(){

    const dados = {

        tamanhoFonte,
        espacamento,
        imagensOcultas,
        saturacao,

        corTexto:inputTextColor.value,
        corFundo:inputBgColor.value

    };


    localStorage.setItem(
        "takematsuA11Y",
        JSON.stringify(dados)
    );

}



function carregarConfiguracoes(){

    const dados = JSON.parse(
        localStorage.getItem("takematsuA11Y")
    );


    if(!dados) return;


    tamanhoFonte = dados.tamanhoFonte;
    espacamento = dados.espacamento;
    imagensOcultas = dados.imagensOcultas;
    saturacao = dados.saturacao;


    aplicarFonte();
    aplicarEspacamento();
    aplicarSaturacao();


    if(dados.corTexto){

        inputTextColor.value = dados.corTexto;
        alterarCorTexto();

    }


    if(dados.corFundo){

        inputBgColor.value = dados.corFundo;
        alterarCorFundo();

    }


    if(imagensOcultas){

        esconderImagens();

    }

}



//==================================================
// ABRIR E FECHAR MODAL
//==================================================


btnA11y.addEventListener("click",()=>{

    modal.style.display = "flex";

});


btnFechar.addEventListener("click",()=>{

    modal.style.display = "none";

});


modal.addEventListener("click",(e)=>{

    if(e.target === modal){

        modal.style.display = "none";

    }

});



//==================================================
// ARIA PRESSED
//==================================================


botoes.forEach((botao)=>{

    if(!botao.hasAttribute("aria-pressed")){

        botao.setAttribute(
            "aria-pressed",
            "false"
        );

    }


    botao.addEventListener("click",()=>{

        const ativo = botao.classList.toggle(
            "is-active"
        );


        botao.setAttribute(

            "aria-pressed",
            ativo ? "true":"false"

        );

    });

});



//==================================================
// AUMENTAR / DIMINUIR FONTE
//==================================================


function aplicarFonte(){

    document.documentElement.style.fontSize =

        tamanhoFonte + "%";

}



btnIncFont.addEventListener("click",()=>{

    if(tamanhoFonte < 150){

        tamanhoFonte +=10;

    }

    aplicarFonte();
    salvarConfiguracoes();

});


btnDecFont.addEventListener("click",()=>{

    if(tamanhoFonte > 50){

        tamanhoFonte -=10;

    }

    aplicarFonte();
    salvarConfiguracoes();

});




//==================================================
// ESPAÇAMENTO
//==================================================


function aplicarEspacamento(){


    document.body.style.letterSpacing =

        espacamento + "px";


}



btnIncSpacing.addEventListener("click",()=>{

    if(espacamento < 10){

        espacamento++;

    }

    aplicarEspacamento();
    salvarConfiguracoes();

});


btnDecSpacing.addEventListener("click",()=>{


    if(espacamento > -2){

        espacamento--;

    }

    aplicarEspacamento();
    salvarConfiguracoes();

});




//==================================================
// COR DO TEXTO
//==================================================


function alterarCorTexto(){


    const elementos = document.querySelectorAll(

        "h1,h2,h3,h4,h5,h6,p,span,button,input,label,div"

    );


    elementos.forEach((el)=>{

        el.style.color = inputTextColor.value;

    });


    salvarConfiguracoes();

}



inputTextColor.addEventListener(

    "input",
    alterarCorTexto

);




//==================================================
// COR DO FUNDO
//==================================================


function alterarCorFundo(){


    document.body.style.background =

        inputBgColor.value;


    salvarConfiguracoes();

}


inputBgColor.addEventListener(

    "input",
    alterarCorFundo

);




//==================================================
// SATURAÇÃO
//==================================================


function aplicarSaturacao(){


    if(saturacao === "alta"){

        document.documentElement.style.filter =

            "saturate(250%)";

    }


    else if(saturacao === "baixa"){

        document.documentElement.style.filter =

            "saturate(40%)";

    }


    else{

        document.documentElement.style.filter =

            "none";

    }


}



btnHighSat.addEventListener("click",()=>{


    saturacao =

        saturacao === "alta"

        ? "normal"
        : "alta";


    aplicarSaturacao();
    salvarConfiguracoes();


});



btnLowSat.addEventListener("click",()=>{


    saturacao =

        saturacao === "baixa"

        ? "normal"
        : "baixa";


    aplicarSaturacao();
    salvarConfiguracoes();


});




//==================================================
// ESCONDER IMAGENS
//==================================================


function esconderImagens(){


    document.querySelectorAll("img")

    .forEach((img)=>{


        img.dataset.altOriginal = img.alt;

        img.style.visibility = "hidden";


    });


}



function mostrarImagens(){


    document.querySelectorAll("img")

    .forEach((img)=>{


        img.style.visibility = "visible";


    });


}



btnToggleImages.addEventListener("click",()=>{


    imagensOcultas = !imagensOcultas;


    if(imagensOcultas){

        esconderImagens();

    }

    else{

        mostrarImagens();

    }


    salvarConfiguracoes();


});




//==================================================
// TECLA ESC
//==================================================


document.addEventListener("keydown",(e)=>{


    if(e.key === "Escape"){

        modal.style.display = "none";

    }


});




//==================================================
// INICIAR
//==================================================


window.addEventListener("load",()=>{

    carregarConfiguracoes();

});