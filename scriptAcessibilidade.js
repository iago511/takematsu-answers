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

const btnRestaurar = document.getElementById("btn-restaurar");

const botoes = document.querySelectorAll(".grid-card-btn");

// Onde a cor do texto é aplicada — o mesmo lugar para aplicar e para limpar.
const SELETOR_TEXTO = "h1,h2,h3,h4,h5,h6,p,span,button,input,label,div";


//==================================================
// CONFIGURAÇÕES
//==================================================


let tamanhoFonte = 100;
let espacamento = 0;
let imagensOcultas = false;
let saturacao = "normal";


// Um <input type="color"> vale "#000000" enquanto ninguém mexe nele.
// Sem estas travas, qualquer clique no menu (mudar fonte, espaçamento…)
// salvava as duas cores como preto, e no recarregamento o preto virava
// style inline no body — apagando o gradiente roxo e deixando todo o
// texto preto no preto. Só guardamos a cor que o usuário escolheu.
let corTextoDefinida = false;
let corFundoDefinida = false;


const VERSAO_CONFIG = 2;


//==================================================
// LOCAL STORAGE
//==================================================


function salvarConfiguracoes(){

    const dados = {

        versao:VERSAO_CONFIG,

        tamanhoFonte,
        espacamento,
        imagensOcultas,
        saturacao

    };


    if(corTextoDefinida){

        dados.corTexto = inputTextColor.value;

    }


    if(corFundoDefinida){

        dados.corFundo = inputBgColor.value;

    }


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


    // Configuração salva pela versão antiga: as cores lá dentro não foram
    // escolhidas por ninguém, eram o preto padrão do seletor. Descarta,
    // senão o fundo continuaria preto pra quem já tem isso salvo.
    if(dados.versao !== VERSAO_CONFIG){

        delete dados.corTexto;
        delete dados.corFundo;

    }


    // Com "??" pra aguentar configuração antiga ou incompleta: sem isso um
    // campo faltando virava "undefined%" no font-size.
    tamanhoFonte = dados.tamanhoFonte ?? 100;
    espacamento = dados.espacamento ?? 0;
    imagensOcultas = dados.imagensOcultas ?? false;
    saturacao = dados.saturacao ?? "normal";


    aplicarFonte();
    aplicarEspacamento();
    aplicarSaturacao();


    if(dados.corTexto){

        corTextoDefinida = true;
        inputTextColor.value = dados.corTexto;
        alterarCorTexto();

    }


    if(dados.corFundo){

        corFundoDefinida = true;
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
// ESTADO VISUAL DOS BOTÕES
//==================================================
//
// Os cartões do menu são de DOIS tipos, e antes eram tratados como um só:
//
//   AÇÃO   — fonte e espaçamento. Cada clique muda um valor; não existe
//            "ligado". Acender isso não quer dizer nada.
//   ESTADO — esconder imagens e as duas saturações. Ligam/desligam algo,
//            então podem (e devem) acender.
//
// O código antigo tinha UM listener que acendia todos no clique, sem olhar
// o valor real. Isso causava quatro problemas de uma vez:
//   • "Alta" e "Baixa" saturação ficavam acesas ao mesmo tempo, mesmo com
//     só uma valendo (a variável `saturacao` guarda um valor só);
//   • os botões de ação piscavam a cada clique sem significado — e o
//     aria-pressed mentia pro leitor de tela;
//   • ao recarregar a página, o efeito voltava aplicado mas nenhum botão
//     acendia (o estado vinha do localStorage, sem clique nenhum);
//   • os seletores de cor são <label>, não botão, e ganhavam aria-pressed.
//
// A correção é ter UMA função que pinta os botões a partir do estado real,
// chamada depois de qualquer mudança. A tela nunca inventa: ela só reflete.


const BOTOES_ESTADO = [

    { el: btnToggleImages, ligado: ()=> imagensOcultas },
    { el: btnHighSat,      ligado: ()=> saturacao === "alta" },
    { el: btnLowSat,       ligado: ()=> saturacao === "baixa" }

];


function sincronizarBotoes(){


    // Apaga tudo primeiro: assim os cartões de ação e os <label> de cor
    // nunca ficam com sobra de estado.
    botoes.forEach((botao)=>{

        botao.classList.remove("is-active");
        botao.removeAttribute("aria-pressed");

    });


    // E acende só o que está realmente ligado.
    BOTOES_ESTADO.forEach(({ el, ligado })=>{

        if(!el) return;

        const on = ligado();

        el.classList.toggle("is-active", on);
        el.setAttribute("aria-pressed", on ? "true" : "false");

    });


}



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


    const elementos = document.querySelectorAll(SELETOR_TEXTO);


    elementos.forEach((el)=>{

        el.style.color = inputTextColor.value;

    });


    salvarConfiguracoes();

}



inputTextColor.addEventListener(

    "input",
    ()=>{

        corTextoDefinida = true;
        alterarCorTexto();

    }

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
    ()=>{

        corFundoDefinida = true;
        alterarCorFundo();

    }

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



// As duas saturações mexem na MESMA variável, então são naturalmente
// exclusivas: escolher "alta" já desliga "baixa". Quem garante que a tela
// mostra isso é o sincronizarBotoes().

btnHighSat.addEventListener("click",()=>{


    saturacao =

        saturacao === "alta"

        ? "normal"
        : "alta";


    aplicarSaturacao();
    sincronizarBotoes();
    salvarConfiguracoes();


});



btnLowSat.addEventListener("click",()=>{


    saturacao =

        saturacao === "baixa"

        ? "normal"
        : "baixa";


    aplicarSaturacao();
    sincronizarBotoes();
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


    sincronizarBotoes();
    salvarConfiguracoes();


});




//==================================================
// RESTAURAR PADRÃO
//==================================================
//
// As preferências ficam no localStorage, que é preso ao endereço do site —
// então elas sobrevivem a reiniciar o Live Server, fechar o navegador e
// até trocar de dia. Isso é de propósito (ninguém quer reconfigurar a
// acessibilidade toda vez), mas sem uma saída o jogador ficava preso: era
// só isso que faltava.


function limparCorTexto(){

    document.querySelectorAll(SELETOR_TEXTO)

    .forEach((el)=>{ el.style.color = ""; });

}



function restaurarPadrao(){


    tamanhoFonte = 100;
    espacamento = 0;
    imagensOcultas = false;
    saturacao = "normal";

    corTextoDefinida = false;
    corFundoDefinida = false;


    aplicarFonte();
    aplicarEspacamento();
    aplicarSaturacao();
    mostrarImagens();

    limparCorTexto();
    document.body.style.background = "";   // o gradiente da classe volta

    inputTextColor.value = "#000000";
    inputBgColor.value = "#000000";


    sincronizarBotoes();


    try{

        localStorage.removeItem("takematsuA11Y");

    }
    catch(e){

        console.warn("Não deu pra limpar as configurações salvas.", e);

    }


}



if(btnRestaurar){

    btnRestaurar.addEventListener("click", restaurarPadrao);

}




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

    // Pinta os botões conforme o que foi carregado. Sem isto, o efeito
    // voltava aplicado mas os botões apareciam todos apagados.
    sincronizarBotoes();

});