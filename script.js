let allQuestions = [];
let selectedQuestions = [];
let currentQuestion = 0;
let score = 0;
let answers = [];
let essayQuestion = null;

// Obtém parâmetros da URL
const urlParams = new URLSearchParams(window.location.search);
const materia = urlParams.get('materia');
const modo = urlParams.get('modo') || '10'; // '10' ou 'todas'

const OPENAI_API_KEY = ""; // Insira sua chave da OpenAI aqui

// ──────────────────────────────────────────────
// CARREGAMENTO
// ──────────────────────────────────────────────

async function loadQuestions() {
    const questionsFile = `./Materias/${materia}/perguntas.json`;
    try {
        const response = await fetch(questionsFile);
        allQuestions = await response.json();
        await loadEssayQuestion();
        startQuiz();
    } catch (error) {
        console.error("Erro ao carregar perguntas:", error);
    }
}

async function loadEssayQuestion() {
    try {
        const response = await fetch(`./Materias/${materia}/temas.json`);
        const themes = await response.json();
        // Só define essayQuestion se houver temas disponíveis
        if (themes && themes.length > 0) {
            essayQuestion = themes[Math.floor(Math.random() * themes.length)];
        } else {
            essayQuestion = null;
        }
    } catch (error) {
        essayQuestion = null;
        console.error("Erro ao carregar temas dissertativos:", error);
    }
}

// ──────────────────────────────────────────────
// INÍCIO DO QUIZ
// ──────────────────────────────────────────────

function startQuiz() {
    document.getElementById("dissertative-container").classList.add("hidden");
    document.getElementById("bt_restart").classList.add("hidden");

    // Seleciona questões conforme o modo escolhido
    const shuffled = allQuestions.slice().sort(() => 0.5 - Math.random());
    selectedQuestions = modo === 'todas' ? shuffled : shuffled.slice(0, 10);

    // Embaralha as opções de cada questão
    selectedQuestions.forEach(question => {
        question.options = shuffleArray(question.options.slice());
    });

    currentQuestion = 0;
    score = 0;

    // Tamanho do array de respostas: questões + 1 se tiver dissertativa
    const totalSlots = essayQuestion ? selectedQuestions.length + 1 : selectedQuestions.length;
    answers = new Array(totalSlots).fill(null);

    generateNavigation();
    loadQuestion(0);
}

// ──────────────────────────────────────────────
// NAVEGAÇÃO
// ──────────────────────────────────────────────

function generateNavigation() {
    let nav = document.getElementById("question-nav");
    nav.innerHTML = "";

    // Botões numerados para cada questão
    selectedQuestions.forEach((_, index) => {
        let btn = document.createElement("button");
        btn.textContent = index + 1;
        btn.id = `nav-${index}`;
        btn.onclick = () => loadQuestion(index);
        nav.appendChild(btn);
    });

    // Botão Dissertativa — só aparece se houver tema
    if (essayQuestion) {
        let essayBtn = document.createElement("button");
        essayBtn.textContent = "Dissertativa";
        essayBtn.id = "nav-essay";
        essayBtn.classList.add("dissertative-btn");
        essayBtn.onclick = () => loadEssayQuestionUI();
        nav.appendChild(essayBtn);
    }

    // Botão Resposta (resultado) — oculto até finalizar
    let respostaBtn = document.createElement("button");
    respostaBtn.textContent = "Resposta";
    respostaBtn.id = "nav-Resposta";
    respostaBtn.classList.add("dissertative-btn");
    respostaBtn.classList.add("hidden");
    respostaBtn.onclick = () => loadRespostaQuestionUI();
    nav.appendChild(respostaBtn);
}

function updateNavigation() {
    document.querySelectorAll("#question-nav button").forEach((btn, index) => {
        btn.classList.toggle("active", index === currentQuestion);
    });
}

function goHome() {
    window.location.href = "./index.html";
}

// ──────────────────────────────────────────────
// CARREGAMENTO DE QUESTÕES
// ──────────────────────────────────────────────

function loadQuestion(index = 0) {
    currentQuestion = index;
    let q = selectedQuestions[currentQuestion];

    let navBtn = document.getElementById(`nav-${currentQuestion}`);

    // Restaura estado visual da questão se já foi respondida
    if (navBtn && navBtn.classList.contains("answered")) {
        document.getElementById("Correta_dado").classList.remove("hidden");
        if (answers[currentQuestion] && answers[currentQuestion].selected === q.Resposta) {
            document.getElementById("Correta_dado").innerHTML = `Resposta Correta: ${q.Resposta}`;
            document.getElementById("Correta_dado").classList.remove("wrong");
            document.getElementById("Correta_dado").classList.add("correct");
        } else {
            document.getElementById("Correta_dado").innerHTML = `Escolha Incorreta<br>Resposta Correta: ${q.Resposta}`;
            document.getElementById("Correta_dado").classList.remove("correct");
            document.getElementById("Correta_dado").classList.add("wrong");
        }
    } else {
        document.getElementById("Correta_dado").innerHTML = '';
        document.getElementById("Correta_dado").classList.remove("correct", "wrong");
    }

    // Exibe enunciado
    document.getElementById("question").innerHTML = q.question.replace(/\n/g, "<br>");
    document.getElementById("dissertative-container").classList.add("hidden");
    document.getElementById("options").classList.remove("hidden");
    document.getElementById("result-container").classList.add("hidden");
    document.getElementById("quiz-container").classList.remove("hidden");

    // Imagem da questão
    let questionImage = document.getElementById("question-image");
    if (q.imagem) {
        questionImage.src = q.imagem;
        questionImage.style.display = "block";
    } else {
        questionImage.style.display = "none";
    }

    // Monta opções
    let optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";
    q.options.forEach(option => {
        let btn = document.createElement("button");
        btn.innerHTML = option.text;
        btn.onclick = () => checkAnswer(option.text, btn);
        if (answers[currentQuestion] && answers[currentQuestion].selected === option.text) {
            btn.classList.add("selected");
        }
        optionsDiv.appendChild(btn);
    });

    updateNavigation();
}

function loadEssayQuestionUI() {
    if (!essayQuestion) return;
    currentQuestion = selectedQuestions.length;
    document.getElementById("question").innerHTML = essayQuestion.question;
    document.getElementById("Correta_dado").innerHTML = essayQuestion.Resposta;
    document.getElementById("options").classList.add("hidden");
    document.getElementById("Img_t").classList.add("hidden");
    document.getElementById("dissertative-container").classList.remove("hidden");
    document.getElementById("result-container").classList.add("hidden");
    document.getElementById("quiz-container").classList.remove("hidden");
    document.getElementById("Correta_dado").classList.remove("correct", "wrong");
    updateNavigation();
}

function loadRespostaQuestionUI() {
    currentQuestion = selectedQuestions.length + 1;
    document.getElementById("result-container").classList.remove("hidden");
    document.getElementById("quiz-container").classList.add("hidden");
    updateNavigation();
}

// ──────────────────────────────────────────────
// VERIFICAÇÃO DE RESPOSTA
// ──────────────────────────────────────────────

function checkAnswer(option, btn) {
    // Impede reanswer na mesma questão
    if (answers[currentQuestion] !== null) return;

    let isCorrect = option === selectedQuestions[currentQuestion].Resposta;
    answers[currentQuestion] = {
        question: selectedQuestions[currentQuestion].question,
        selected: option,
        correct: isCorrect,
        correctAnswer: selectedQuestions[currentQuestion].Resposta
    };

    let explicacaoEstatica = selectedQuestions[currentQuestion].explicacao;
    let htmlExplicacao = explicacaoEstatica
        ? `<br><br><span class='explicacao-text'><strong>Explicação:</strong> ${explicacaoEstatica}</span>`
        : "";

    if (isCorrect) {
        score++;
        document.getElementById("Correta_dado").innerHTML = `Resposta Correta: ${selectedQuestions[currentQuestion].Resposta}${htmlExplicacao}`;
        document.getElementById("Correta_dado").classList.remove("wrong");
        document.getElementById("Correta_dado").classList.add("correct");
    } else {
        document.getElementById("Correta_dado").innerHTML = `Escolha Incorreta<br>Resposta Correta: ${selectedQuestions[currentQuestion].Resposta}${htmlExplicacao}`;
        document.getElementById("Correta_dado").classList.remove("correct");
        document.getElementById("Correta_dado").classList.add("wrong");
    }

    document.getElementById(`nav-${currentQuestion}`).classList.add("answered");

    document.querySelectorAll("#options button").forEach(button => button.classList.remove("selected"));
    btn.classList.add("selected");

    // Finaliza automaticamente quando todas as questões objetivas forem respondidas
    const totalObjective = selectedQuestions.length;
    const answeredObjective = answers.slice(0, totalObjective).filter(a => a !== null).length;
    if (answeredObjective === totalObjective && !essayQuestion) {
        showResults();
    }
}

// ──────────────────────────────────────────────
// RESULTADOS
// ──────────────────────────────────────────────

function showResults() {
    let list = document.getElementById("answers-list");
    list.innerHTML = "";

    const total = selectedQuestions.length;

    // Preenche respostas não respondidas
    for (let i = 0; i < total; i++) {
        if (!answers[i]) {
            answers[i] = {
                question: selectedQuestions[i].question,
                selected: "Não respondida",
                correct: false,
                correctAnswer: selectedQuestions[i].Resposta
            };
        }
    }

    // Lista todas as respostas
    answers.forEach((a, index) => {
        if (index >= total) return; // ignora slot da dissertativa
        let item = document.createElement("h6");
        item.innerHTML = `${index + 1} - ${a.question}<br><br>Sua resposta: <span class='${a.correct ? "correct" : "wrong"}'>${a.selected}</span>`;
        if (!a.correct) {
            item.innerHTML += ` <br> Resposta correta: <span class='correct'>${a.correctAnswer}</span>`;
        }
        if (index < total - 1) {
            item.innerHTML += `<br><br>-------------------------------------------------------------------------------------------------------------------<br><br>`;
        }
        item.style.cursor = "pointer";
        item.onclick = () => loadQuestion(index);
        list.appendChild(item);
    });

    document.getElementById("score").textContent = `Sua nota: ${score} de ${total}`;
    document.getElementById("bt_start").classList.add("hidden");
    document.getElementById("bt_restart").classList.remove("hidden");

    // Mostra botão de resposta só se existir
    const respostaBtn = document.getElementById("nav-Resposta");
    if (respostaBtn) respostaBtn.classList.remove("hidden");

    loadRespostaQuestionUI();
}

function restartQuiz() {
    document.getElementById("dissertative-container").classList.add("hidden");
    document.getElementById("result-container").classList.add("hidden");
    document.getElementById("quiz-container").classList.remove("hidden");
    document.getElementById("bt_start").classList.remove("hidden");
    startQuiz();
}

// ──────────────────────────────────────────────
// DISSERTATIVA — AVALIAÇÃO VIA ChatGPT
// ──────────────────────────────────────────────

async function avaliarRespostaDissertativa(resposta) {
    const prompt = `Avalie a seguinte resposta para a questão: "${essayQuestion.question}". 
    Dê um feedback objetivo e uma nota de 0 a 10.  
    Resposta do aluno: "${resposta}"`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Erro ao avaliar resposta:", error);
        return "Houve um problema ao avaliar sua resposta. Tente novamente mais tarde.";
    }
}

async function finalizarProva() {
    const respostaAluno = document.getElementById("resposta-dissertativa").value;
    if (respostaAluno.trim() !== "") {
        document.getElementById("loading").style.display = "block";
        const feedbackIA = await avaliarRespostaDissertativa(respostaAluno);
        document.getElementById("feedback-ia").innerText = feedbackIA;
        document.getElementById("loading").style.display = "none";
    }
}

// ──────────────────────────────────────────────
// UTILITÁRIOS
// ──────────────────────────────────────────────

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

window.onload = loadQuestions;
