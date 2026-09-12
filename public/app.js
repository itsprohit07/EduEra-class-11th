const subjects = {
  History: [
    "Writing and City Life",
    "An Empire Across Three Continents",
    "Nomadic Empires",
    "The Three Orders",
    "Changing Cultural Traditions",
    "Displacing Indigenous Peoples",
    "Paths to Modernisation"
  ],

  Psychology: [
    "What is Psychology?",
    "Methods of Enquiry in Psychology",
    "Human Development",
    "Sensory, Attentional and Perceptual Processes",
    "Learning",
    "Human Memory",
    "Thinking",
    "Motivation and Emotion"
  ],

  Sociology: [
    "Sociology and Society",
    "Terms, Concepts and their Use in Sociology",
    "Understanding Social Institutions",
    "Culture and Socialisation",
    "Doing Sociology: Research Methods"
  ]
};

// Demo content — later we can expand every NCERT chapter.
let notes = [
  {
    subject: "History",
    chapter: "Writing and City Life",
    title: "Urbanisation & Writing",
    body: "Mesopotamia mein cities ka development hua. Writing ka use records, trade aur administration ke liye important tha."
  },
  {
    subject: "Psychology",
    chapter: "What is Psychology?",
    title: "Psychology kya hai?",
    body: "Psychology human behaviour aur mental processes ka scientific study hai. Isme thinking, emotions, learning aur behaviour ko samjha jata hai."
  },
  {
    subject: "Sociology",
    chapter: "Sociology and Society",
    title: "Sociology ka meaning",
    body: "Sociology society, social relationships aur social behaviour ka systematic study hai."
  }
];

let doubts = [
  {
    title: "Aaj ka Doubt",
    body: "History mein civilisation aur empire mein kya difference hota hai?"
  }
];

let quizzes = [
  {
    subject: "History",
    chapter: "Writing and City Life",
    question: "Writing ka early use kis purpose ke liye important tha?",
    options: [
      "Record keeping",
      "Only entertainment",
      "Only poetry",
      "Sports"
    ],
    answer: 0,
    explanation: "Early writing ka major use records, trade aur administration ko manage karne mein hota tha."
  },
  {
    subject: "Psychology",
    chapter: "What is Psychology?",
    question: "Psychology mainly kis cheez ka scientific study hai?",
    options: [
      "Only physical health",
      "Behaviour and mental processes",
      "Only history",
      "Only society"
    ],
    answer: 1,
    explanation: "Psychology human behaviour aur mental processes ka scientific study hai."
  },
  {
    subject: "Sociology",
    chapter: "Sociology and Society",
    question: "Sociology ka main focus kya hai?",
    options: [
      "Stars",
      "Chemical reactions",
      "Society and social relationships",
      "Computer programming"
    ],
    answer: 2,
    explanation: "Sociology society aur logon ke social relationships ko study karta hai."
  }
];

const $ = id => document.getElementById(id);

function saveData() {
  localStorage.setItem("eduEraNotes", JSON.stringify(notes));
  localStorage.setItem("eduEraDoubts", JSON.stringify(doubts));
  localStorage.setItem("eduEraQuizzes", JSON.stringify(quizzes));
}

function loadData() {
  try {
    notes = JSON.parse(localStorage.getItem("eduEraNotes")) || notes;
    doubts = JSON.parse(localStorage.getItem("eduEraDoubts")) || doubts;
    quizzes = JSON.parse(localStorage.getItem("eduEraQuizzes")) || quizzes;
  } catch (e) {
    console.log("Data load error");
  }
}

function renderSubjects() {
  const container = $("subjectCards");
  container.innerHTML = "";

  Object.entries(subjects).forEach(([subject, chapters]) => {
    const card = document.createElement("div");
    card.className = "subject";

    card.innerHTML = `
      <div style="font-size:32px">
        ${subject === "History" ? "📜" : subject === "Psychology" ? "🧠" : "👥"}
      </div>
      <h3>${subject}</h3>
      <p>${chapters.length} NCERT chapters</p>
    `;

    container.appendChild(card);
  });
}

function fillSubjects() {
  const filters = [
    $("subjectFilter"),
    $("qSubject"),
    $("nSubject")
  ];

  filters.forEach(select => {
    if (!select) return;

    select.innerHTML = "";

    Object.keys(subjects).forEach(subject => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      select.appendChild(option);
    });
  });

  updateChapters("qSubject", "qChapter");
  updateChapters("nSubject", "nChapter");
}

function updateChapters(subjectId, chapterId) {
  const subject = $(subjectId);
  const chapter = $(chapterId);

  if (!subject || !chapter) return;

  chapter.innerHTML = "";

  (subjects[subject.value] || []).forEach(ch => {
    const option = document.createElement("option");
    option.value = ch;
    option.textContent = ch;
    chapter.appendChild(option);
  });
}

function renderNotes() {
  const container = $("notes");
  const filter = $("subjectFilter")?.value || "";

  const filtered = filter
    ? notes.filter(n => n.subject === filter)
    : notes;

  if (!filtered.length) {
    container.innerHTML = "<p>No notes available yet.</p>";
    return;
  }

  container.innerHTML = filtered.map(note => `
    <article class="note">
      <span class="tag">${note.subject}</span>
      <h3>${escapeHTML(note.title)}</h3>
      <small>${escapeHTML(note.chapter)}</small>
      <p>${escapeHTML(note.body)}</p>
      ${
        note.pdf
          ? `<a href="${note.pdf}" target="_blank">📄 Open PDF</a>`
          : ""
      }
    </article>
  `).join("");
}

function renderDoubts() {
  const container = $("doubts");

  container.innerHTML = doubts.map(d => `
    <div class="note">
      <h3>💡 ${escapeHTML(d.title)}</h3>
      <p>${escapeHTML(d.body)}</p>
    </div>
  `).join("");
}

function renderQuiz() {
  const container = $("quiz");

  if (!quizzes.length) {
    container.innerHTML = "<p>No quiz available yet.</p>";
    return;
  }

  container.innerHTML = quizzes.map((q, index) => `
    <div class="question">
      <span class="tag">${escapeHTML(q.subject)}</span>
      <h3>Q${index + 1}. ${escapeHTML(q.question)}</h3>

      <div id="options-${index}">
        ${q.options.map((option, i) => `
          <button
            class="option"
            onclick="checkAnswer(${index}, ${i})"
          >
            ${String.fromCharCode(65 + i)}. ${escapeHTML(option)}
          </button>
        `).join("")}
      </div>

      <div id="result-${index}"></div>
    </div>
  `).join("");
}

function checkAnswer(questionIndex, selected) {
  const q = quizzes[questionIndex];
  const result = $(`result-${questionIndex}`);
  const buttons = document.querySelectorAll(
    `#options-${questionIndex} .option`
  );

  buttons.forEach((button, i) => {
    button.disabled = true;

    if (i === q.answer) {
      button.classList.add("correct");
    }

    if (i === selected && selected !== q.answer) {
      button.classList.add("wrong");
    }
  });

  if (selected === q.answer) {
    result.innerHTML = `
      <p><strong>✅ Correct!</strong></p>
      <p>${escapeHTML(q.explanation)}</p>
    `;
  } else {
    result.innerHTML = `
      <p><strong>❌ Incorrect</strong></p>
      <p>${escapeHTML(q.explanation)}</p>
    `;
  }
}

function openAdmin() {
  $("adminModal").classList.remove("hidden");
}

function closeAdmin() {
  $("adminModal").classList.add("hidden");
}

function saveAdmin() {
  // Temporary client-side password.
  // Real authentication should be moved to the backend later.
  const password = $("adminPass").value;

  if (password === "EduEra@2026") {
    $("adminArea").classList.remove("hidden");
    $("adminPass").value = "";
  } else {
    alert("Wrong password");
  }
}

function addDoubt() {
  const title = $("doubtTitle").value.trim();
  const body = $("doubtBody").value.trim();

  if (!title || !body) {
    alert("Title aur doubt dono likho.");
    return;
  }

  doubts.unshift({
    title,
    body
  });

  saveData();
  renderDoubts();

  $("doubtTitle").value = "";
  $("doubtBody").value = "";

  alert("Daily doubt published! ✅");
}

function addQuiz() {
  const subject = $("qSubject").value;
  const chapter = $("qChapter").value;
  const question = $("qText").value.trim();

  const options = [
    $("o0").value.trim(),
    $("o1").value.trim(),
    $("o2").value.trim(),
    $("o3").value.trim()
  ];

  const answer = Number($("qAnswer").value);
  const explanation = $("qExplanation").value.trim();

  if (
    !question ||
    options.some(x => !x) ||
    answer < 0 ||
    answer > 3
  ) {
    alert("Question, 4 options aur correct answer complete karo.");
    return;
  }

  quizzes.push({
    subject,
    chapter,
    question,
    options,
    answer,
    explanation
  });

  saveData();
  renderQuiz();

  $("qText").value = "";
  $("o0").value = "";
  $("o1").value = "";
  $("o2").value = "";
  $("o3").value = "";
  $("qAnswer").value = "";
  $("qExplanation").value = "";

  alert("Quiz question added! ✅");
}

function addNote() {
  const subject = $("nSubject").value;
  const chapter = $("nChapter").value;
  const title = $("nTitle").value.trim();
  const body = $("nBody").value.trim();
  const pdf = $("nPdf").files[0];

  if (!title || !body) {
    alert("Note title aur content likho.");
    return;
  }

  // Browser localStorage cannot reliably store large PDFs.
  // For now we save text notes.
  notes.unshift({
    subject,
    chapter,
    title,
    body
  });

  saveData();
  renderNotes();

  $("nTitle").value = "";
  $("nBody").value = "";
  $("nPdf").value = "";

  if (pdf) {
    alert(
      "Text note save ho gaya. PDF ke liye next step mein proper server upload system banayenge."
    );
  } else {
    alert("Note added! ✅");
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Events
$("adminBtn")?.addEventListener("click", openAdmin);

$("subjectFilter")?.addEventListener("change", renderNotes);

$("qSubject")?.addEventListener("change", () => {
  updateChapters("qSubject", "qChapter");
});

$("nSubject")?.addEventListener("change", () => {
  updateChapters("nSubject", "nChapter");
});

// Start app
loadData();
renderSubjects();
fillSubjects();
renderNotes();
renderDoubts();
renderQuiz();
