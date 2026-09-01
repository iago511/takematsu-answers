# TALKING MATSU

> Um bichinho virtual aparentemente normal...

## Sobre o projeto

**Talking Matsu** é um jogo desenvolvido para a disciplina de **Desenvolvimento de Aplicações Dinâmicas (DAD)**, com o objetivo de aplicar conceitos de **JavaScript** na criação de uma aplicação interativa e acessível.

Inspirado em jogos de bichinhos virtuais, como o **Pou**, o projeto coloca como personagem principal o **Takematsu**, integrante da equipe que acabou virando o protagonista do jogo.

Durante a experiência, o jogador pode interagir com o personagem e acompanhar seu estado. Porém, existe uma condição especial:

### Quando o relógio chega às 3:00 AM...

O Takematsu deixa de ser apenas um bichinho virtual e entra em seu **modo terror**. 👻

Essa mudança faz parte da principal mecânica do jogo e utiliza a lógica de programação para alterar dinamicamente o comportamento e a experiência visual da aplicação.

---

## Objetivos

O projeto tem como principais objetivos:

* Aplicar conceitos de **JavaScript** em uma aplicação prática;
* Desenvolver uma experiência interativa para o usuário;
* Trabalhar com manipulação de elementos da página;
* Implementar funcionalidades relacionadas ao tempo;
* Desenvolver recursos de **acessibilidade**;
* Explorar a alteração dinâmica da interface;
* Criar uma experiência divertida e diferente para o usuário.

---

## Funcionamento

O jogador interage com o Takematsu por meio da interface do jogo.

A aplicação possui diferentes elementos e funcionalidades que permitem acompanhar e interagir com o personagem.

O funcionamento do jogo pode ser dividido em dois momentos:

### Modo normal

Durante o período normal, o Takematsu funciona como um bichinho virtual.

O jogador pode interagir com o personagem e utilizar as funcionalidades disponibilizadas pela aplicação.

### Modo 3 AM

Quando o relógio chega às **3:00 AM**, uma condição especial é identificada pelo sistema.

Nesse momento, o jogo muda sua experiência e o Takematsu entra em seu **modo terror**.

Essa mecânica utiliza JavaScript para verificar o horário e realizar alterações na jogabilidade de forma dinâmica.

---

## Modo Sobrevivência

A partir do modo terror, o jogo deixa de ser um simulador de bichinho e vira uma
sessão de **minijogos rápidos no estilo WarioWare**: instruções curtas, poucos
segundos cada, ficando mais rápido a cada onda.

* **4 vidas.** Cada erro custa 1 vida e 20 de HP; cada acerto vale 100 pontos e devolve 5 de HP.
* **5 ondas de 4 minijogos.** A velocidade sobe 15% por onda.
* Ficar sem vidas é a morte do Takematsu. Sobreviver às 5 ondas devolve o controle ao jogador.

### Os minijogos

Cada um simula uma **barreira real de acessibilidade**:

| Minijogo    | Barreira                                                        |
| ----------- | --------------------------------------------------------------- |
| `LEGENDE!`  | Vídeo sem legenda — ative a legenda na hora certa                 |
| `ENXERGUE!` | Contraste insuficiente — ache o único texto que passa nos 4.5:1   |
| `NAVEGUE!`  | Elementos sem rótulo — só um tem nome para o leitor de tela       |
| `ESCUTE!`   | Navegação às cegas — obedeça o leitor de tela sem apoio visual    |
| `DESCREVA!` | Texto alternativo — escolha o `alt` que descreve mesmo a imagem   |
| `RAMPA!`    | Degrau sem rampa — solte a rampa antes de a cadeira chegar        |
| `PAUSE!`    | Conteúdo piscante — pause a animação o mais rápido possível       |

### O ritmo entre rodadas

O ciclo do WarioWare, com o fundo da tela principal nas duas telas:

```
  reação (2,4s)  →  anúncio do próximo (2,4s)  →  minijogo  →  reação  →  …
```

**Reação** — o Takematsu responde ao que acabou de acontecer, com os corações
logo abaixo dele (o que acabou de cair apaga com animação):

| Situação           | Takematsu             | Animação       | Elenco em cena          |
| ------------------ | --------------------- | -------------- | ----------------------- |
| Acertou            | `takematsu-falando-1` | estica/encolhe | quem já tiver aparecido |
| 1º coração perdido | `takematsu-apanhando` | parado         | —                       |
| 2º coração perdido | `takematsu-apanhando` | parado         | **Sophia** entra pela esquerda |
| 3º coração perdido | `takematsu-apanhando` | parado         | Sophia + **Akira** entra pela direita |
| 4º e último        | `takematsu-morto`     | parado         | Sophia + Akira, e o jumpscare |

**Os monstros não vão embora.** Uma vez que aparecem, ficam em todas as
intermissões seguintes — inclusive nas de acerto. Só o recém-chegado faz a
entrada correndo (com a risada); os que já estavam só continuam flutuando, em
ritmos diferentes pra não balançarem em bloco.

**Anúncio** — o `takematsu-falando-2` entra com a animação de estica/encolhe,
e ao mesmo tempo aparecem o verbo do minijogo, a explicação e a tecla.

As duas telas usam a **mesma grade de três linhas**, com o personagem sempre na
linha do meio: ele não muda de lugar na troca, então a sequência parece uma cena
contínua em vez de dois cartões separados.

**Virada de onda** — no lugar do anúncio comum entra a tela de *speed up*:
"MAIS RÁPIDO!", com o personagem animando mais rápido.

**Os personagens dançam no ritmo.** A duração de cada tela é dividida num número
inteiro de passos (perto de 420 ms cada) e escrita na variável `--mj-danca`.
Assim o passo fecha junto com o jingle em vez de flutuar solto. Os dois monstros
usam o mesmo compasso, com meio tempo de defasagem entre eles.

### A aceleração

Cada onda aumenta a velocidade do jogo em 26%:

| Onda | Velocidade | Minijogo | Barra começa em | Música |
| ---- | ---------- | -------- | --------------- | ------ |
| 1    | 1,00×      | 4200 ms  | 100%            | 1,00×  |
| 2    | 1,26×      | 3333 ms  | 79%             | 1,10×  |
| 3    | 1,52×      | 2763 ms  | 66%             | 1,20×  |
| 4    | 1,78×      | 2360 ms  | 56%             | 1,20×  |
| 5    | 2,04×      | 2059 ms  | 49%             | 1,20×  |

Dois detalhes fazem a aceleração ser **vista**, não só medida:

* **A barra de tempo mede tempo absoluto.** Antes ela começava sempre cheia e
  esvaziava na duração da rodada — o desenho ficava idêntico em toda onda e
  escondia o minijogo ficando mais curto. Agora a onda 5 já começa com meia
  barra.
* **A música acompanha só de leve** (`playbackRate` até 1,20×, com
  `preservesPitch = false` pro tom subir junto). Seguir a velocidade cheia
  deixava os jingles esganiçados; quem tem que ficar rápido é o jogo.

### Entrada no modo

O **relógio é o gatilho da cena**:

1. Ele ganha destaque e começa a pulsar, aceso acima de tudo, e o Takematsu
   troca pro frame `pensando-reposta` — ele percebe antes do jogador;
2. Os dígitos embaralham por ~0,7 s e **travam em 03:00:00** (pelo atalho de
   demonstração; às 3h de verdade ele já está lá);
3. No **mesmo instante** em que o relógio crava 3 da manhã, a **risada do
   monstro** entra alta e a tela em volta é **engolida** na
   duração exata do áudio — chat, itens, HUD e o Takematsu somem com desfoque
   enquanto um véu escuro se fecha do centro pra fora, com o relógio ainda
   aceso no meio da escuridão;
4. Aí aparece o popup de configuração. Ao começar, o modo entra de uma vez.

A duração do escurecimento não é um número no CSS: o JS escreve a duração da
risada na variável `--mj-engole`, e a transição a usa. Trocar o arquivo muda a
animação junto.

No fim da sessão (ou se o jogador escolher "Agora não") o véu abre, o relógio
destrava e volta ao horário real, e tudo reaparece.

### Som

Os jingles ficam em `jingles/`, e **a música não para entre uma tela e outra**.

#### Os arquivos têm silêncio no fim

Todo arquivo da pasta traz cerca de **1,3 s de silêncio no fim** (sobra da
exportação). Por isso cada jingle tem duas durações no código:

| Jingle              | Arquivo   | Só o som  |
| ------------------- | --------- | --------- |
| `Intro` / `Jingle`  | 3135 ms   | 1829 ms   |
| `Win` / `Lose`      | 3161 ms   | 1881 ms   |
| `SpeedUp`           | 4885 ms   | 3605 ms   |
| `GameOver`          | 3814 ms   | 2508 ms   |
| `RisadaMonstro`     | 3579 ms   | 2273 ms   |
| `NICE_ONE`          | 27089 ms  | 25783 ms  |
| `doom`              | 167758 ms | 166426 ms |

**As telas usam a coluna "só o som".** Usar a duração do arquivo deixava cada
intervalo parado no mudo por 1,3 s — e nas faixas em loop dava um buraco a cada
volta, então o loop também reinicia no fim do som, não do arquivo.

> Se algum arquivo for trocado, esses números precisam ser remedidos. Frames de
> MP3 Layer III em silêncio gastam quase nenhum bit (`part2_3_length` ≈ 0), então
> dá pra achar o último frame com som varrendo o bitstream. O código avisa no
> console se a duração do arquivo não bater com a tabela.

O truque são os arquivos `_com_`: cada um é o sting de reação já colado no jingle
seguinte, então **um arquivo cobre duas telas**. O jogo toca o emendado e troca de
tela no ponto exato da emenda:

| Arquivo                  | Tela 1 (reação)      | Tela 2                  |
| ------------------------ | -------------------- | ----------------------- |
| `Intro_com_Jingle.mp3`   | abertura ~1,7 s      | 1º anúncio ~3,1 s       |
| `Win_com_Jingle.mp3`     | acerto ~1,75 s       | anúncio ~3,1 s          |
| `Lose_com_Jingle.mp3`    | erro ~1,8 s          | anúncio ~3,1 s          |
| `SpeedUp_com_Win.mp3`    | acerto ~1,7 s        | virada de onda ~4,9 s   |
| `SpeedUp_com_Lose.mp3`   | erro ~1,7 s          | virada de onda ~4,9 s   |

O ponto da emenda **não é um número fixo no código** — sai de uma subtração:

```
emenda = duração(arquivo emendado) − duração(jingle que vem depois)
```

Como as durações são lidas dos próprios arquivos em tempo de execução, reexportar
qualquer jingle reajusta o corte sozinho.

Os arquivos soltos entram onde não existe emendado: `Jingle.mp3` no anúncio logo
após a virada de onda, `Win.mp3`/`Lose.mp3` na última reação da sessão (cortada no
fim do som, sem o silêncio que sobra no arquivo), `GameOver.mp3` na derrota e
`RisadaMonstro.mp3` quando um monstro chega — essa a 30% do volume, pra não
encobrir o resto, e deixada tocar por cima da tela seguinte de propósito.

### As telas de fim

**Vitória** — o Takematsu dança à esquerda com os corações embaixo dele, e o
placar fica à direita: acertos, erros, ondas, pontos e uma **nota** (S a D, pela
proporção de acertos). `NICE_ONE.mp3` toca em loop até o jogador apertar qualquer
tecla ou clicar em qualquer lugar pra voltar à tela inicial.

**Derrota** — depois do `GameOver.mp3`, o jogo volta à tela inicial com o
Takematsu morto e `doom.mp3` fica rodando em loop, até alguém começar outra
sessão.

Abrir o modo e escolher "Agora não" com o Takematsu morto **retoma o `doom`** —
senão a tela inicial ficava muda pra sempre.

Cada jingle toca **uma vez só** por tela. Se o jogador esticou o intervalo (mais
tempo ou "intervalos maiores"), o fim da tela fica em silêncio mesmo — repetir a
música pra preencher ficava pior de ouvir.

### Só três teclas

Todos os minijogos usam **apenas três ações lógicas**: `anterior`, `próximo` e
`confirmar`. Nada de mouse, arrastar ou tecla exclusiva de um jogo. Isso permite
remapear uma vez e valer para a sessão inteira — inclusive no **modo de duas
teclas**, que é como funciona a varredura por acionador (*switch access*) usada
por quem tem mobilidade reduzida.

### Popup de configuração

Antes de a sessão começar (e a qualquer momento com <kbd>Esc</kbd>) aparece um
popup para o jogador ajustar:

* **Tempo** — de 0,75× a 2× a duração de cada minijogo, travar a aceleração entre
  ondas, e **intervalos maiores** (+1,8 s só na tela de explicação, que é a que
  precisa ser lida);
* **Visual** — alto contraste, reduzir animações e desligar os sustos;
* **Teclas** — presets (setas, A/D, duas teclas) ou remapear cada ação individualmente;
* **Áudio** — narrar as instruções com `SpeechSynthesis` em pt-BR e efeitos sonoros.

As preferências ficam salvas no `localStorage`. Pausar **cancela a rodada em
andamento sem contar acerto nem erro** — precisar parar nunca é punido.

> **Para demonstrar sem esperar as 3h:** <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>3</kbd>.

---

## Acessibilidade

A acessibilidade é uma das partes importantes do projeto.

O sistema possui um arquivo específico chamado `scriptAcessibilidade.js`, responsável por concentrar funcionalidades relacionadas à acessibilidade.

A proposta é permitir que diferentes usuários tenham uma experiência mais adequada ao interagir com o jogo.

Entre os aspectos trabalhados estão:

* Melhor adaptação da interface;
* Recursos voltados à acessibilidade;
* Interação facilitada;
* Alterações na apresentação dos elementos;
* Maior preocupação com a experiência do usuário.

---

## Agente

O projeto também possui o arquivo `scriptAgente.js`, relacionado à implementação de um agente dentro da aplicação.

A utilização desse recurso amplia as possibilidades de interação do jogo e demonstra a aplicação de diferentes conceitos de programação dentro do projeto.

---

## Tecnologias utilizadas

### HTML5

Utilizado para estruturar as páginas e os elementos presentes na aplicação.

### CSS

Utilizado para estilizar a interface e definir a apresentação visual do jogo.

### JavaScript

É a principal linguagem utilizada no projeto, sendo responsável pela lógica e pelas interações da aplicação.

Entre os conceitos utilizados estão:

* Variáveis;
* Funções;
* Condicionais;
* Eventos;
* Manipulação do DOM;
* Manipulação de elementos;
* Controle de tempo;
* Alteração dinâmica da interface;
* Lógica de interação com o usuário.

---

## Estrutura do projeto

```text
takematsu-answers/
│
├── imgs/
│   └── Imagens utilizadas no projeto
│
├── .env.example
├── .gitignore
├── LICENSE
├── index.html
├── package.json
├── package-lock.json
│
├── jingles/
│   └── Trilha sonora do modo sobrevivência
│
├── testes/
│   └── rodarTestes.cjs
│
├── script.js
├── scriptAcessibilidade.js
├── scriptAgente.js
│
├── scriptJingles.js          ← modo sobrevivência, camada 1
├── scriptConfigJogo.js       ← camada 2
├── scriptSobrevivencia.js    ← camada 3
├── scriptMinijogos.js        ← camada 4
│
└── README.md
```

### O modo sobrevivência é dividido em camadas

Cada arquivo tem **um trabalho só**, e cada um usa apenas o de cima. Dá pra
ler na ordem, de baixo pra cima:

| Arquivo                  | O que faz                                            | Usa |
| ------------------------ | ---------------------------------------------------- | --- |
| `scriptJingles.js`       | Só toca som. Não sabe o que é onda nem minijogo.      | — |
| `scriptConfigJogo.js`    | Preferências, popup e teclado. Traduz tecla em ação.  | Jingles |
| `scriptSobrevivencia.js` | As telas, a rodada e o loop da sessão.                | Jingles, ConfigJogo |
| `scriptMinijogos.js`     | Os 7 minijogos, que se registram no motor.            | Sobrevivencia |

A ordem das tags `<script>` no `index.html` segue exatamente essa lista.

Cada minijogo recebe um objeto `ctx` com tudo que pode usar — e só com isso.
Nenhum minijogo mexe direto no DOM da página nem no estado da sessão, o que
deixa fácil escrever um novo sem quebrar o resto.

---

## Testes automáticos

O projeto tem uma suíte que abre o `index.html` de verdade num navegador de
mentira (jsdom), **joga sozinha** e confere o resultado:

```bash
npm install
npm test
```

São 10 testes com 67 checagens: carregamento das camadas, abertura do modo,
uma sessão inteira ganhando, uma inteira perdendo, o estado de morte, os itens
pelo teclado, a pausa, a proteção do gradiente do fundo, o menu de
acessibilidade e a montagem dos 7 minijogos.

### Teste de responsividade

O jsdom **não calcula layout** — ele não sabe dizer se algo saiu da tela. Então
há um segundo teste, que abre a página no Chrome (ou Edge) de verdade:

```bash
npm run test:layout
```

Ele mede 8 cenas em 7 tamanhos de tela e reprova se: a página rolar na
horizontal, algum elemento sair da tela, os painéis da tela inicial se
sobrepuserem, ou os blocos de opção ficarem na orientação errada.

> Ao medir o Takematsu, o teste usa só a faixa dos 18% aos 72% da altura da
> imagem: o PNG é 340×733 mas o desenho ocupa pouco mais da metade disso, e
> encostar na parte transparente não é problema. Sem esse cuidado o teste
> mandaria encolher o personagem à toa.

---

## Responsividade

Três pontos de virada, cada um resolvendo um problema diferente:

| Condição              | O que muda                                            |
| --------------------- | ----------------------------------------------------- |
| largura ≤ 900px       | **os minijogos viram na vertical** — as opções passam a ficar uma embaixo da outra, em largura cheia |
| largura ≤ 620px       | a tela inicial se reorganiza: os itens saem da coluna da esquerda e viram uma **linha acima do chat**, e o HUD desce pra não brigar com o relógio |
| altura ≤ 520px        | tudo comprime: reservas, personagens e os textos das telas de transição |

Os dois últimos são independentes de propósito: um **celular deitado** é largo
*e* baixo, e precisa das duas correções ao mesmo tempo. Aliás, nele as opções
**voltam** a ficar lado a lado — sobra largura e falta altura, então empilhar
seria a escolha errada.

### O tamanho do Takematsu

Ele não é um número fixo: o `<main>` reserva por `padding` o espaço do HUD e do
chat, e a altura da imagem sai de um `min()` entre o espaço livre e o teto de
largura. Cresce junto com a tela.

O detalhe que faz diferença é o **×1.5**. Só ~54% do PNG é o desenho — o resto é
margem transparente. Então a *caixa* precisa ser maior que o espaço livre pro
*personagem* ocupá-lo de verdade; a sobra transparente passa por cima do HUD e
do chat, onde não há pixel nenhum pra atrapalhar.

De onde vem o 1.5: a margem é assimétrica (18% em cima, 28% embaixo), então quem
aperta é o topo. Pra cabeça não invadir o HUD, `0,32 · altura ≤ espaço/2`, ou
seja `altura ≤ 1,5625 · espaço`. O 1.5 deixa uma folga.

Resultado medido — antes o personagem ocupava 30% da altura numa tela de 1080p:

| Tela        | Personagem visível |
| ----------- | ------------------ |
| 1920×1080   | 52% da altura      |
| 1366×768    | 40%                |
| 768×1024    | 50%                |
| 390×844     | 32%                |
| 740×360     | 29%                |

As reservas de espaço de cada breakpoint foram **medidas no navegador**, não
chutadas. E a barra de itens no celular é ancorada na altura do chat, não na
reserva — senão uma dependeria da outra e a conta nunca fecharia.

---

## Como executar

### 1. Clone o repositório

```bash
git clone https://github.com/iago511/takematsu-answers.git
```

### 2. Entre na pasta

```bash
cd takematsu-answers
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Execute o projeto

Abra o `index.html` no navegador ou utilize uma extensão como **Live Server** no VS Code.

---

## Principais arquivos

| Arquivo                   | Função                                        |
| ------------------------- | --------------------------------------------- |
| `index.html`              | Estrutura principal da aplicação              |
| `script.js`               | Lógica e funcionamento principal do jogo      |
| `scriptAcessibilidade.js` | Funcionalidades relacionadas à acessibilidade |
| `scriptAgente.js`         | Implementação do agente                       |
| `scriptJingles.js`        | Modo sobrevivência ①: toca a trilha sonora    |
| `scriptConfigJogo.js`     | Modo sobrevivência ②: preferências, popup e teclado |
| `scriptSobrevivencia.js`  | Modo sobrevivência ③: telas, rodada e loop da sessão |
| `scriptMinijogos.js`      | Modo sobrevivência ④: os 7 minijogos          |
| `testes/rodarTestes.cjs`  | Suíte automática (`npm test`)                 |
| `testes/testeLayout.cjs`  | Teste de responsividade (`npm run test:layout`) |
| `imgs/` e `jingles/`      | Imagens e áudio usados na aplicação           |
| `package.json`            | Configurações e dependências do projeto       |

---

## Equipe

Projeto desenvolvido por:

* **Iago**
* **Rafael Takematsu**
* **Sophia Castro**
* **Guilherme Senatore**
* **Henrique Akira**

---

## Projeto acadêmico

Projeto desenvolvido para a disciplina de **Desenvolvimento de Aplicações (DA)**, com foco na aplicação prática de conceitos de desenvolvimento web, JavaScript, interatividade e acessibilidade.

---

## Uma última coisa...
O Talking Matsu pode parecer apenas um simples jogo de bichinho virtual.
Você pode cuidar dele.
Você pode interagir com ele.
Você pode olhar o relógio.
Mas...
### **Não fique acordado até as 3:00 AM.** 
