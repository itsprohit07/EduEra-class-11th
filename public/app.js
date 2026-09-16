// COMPLETE CLASS 11 HUMANITIES SYLLABUS
const SUBJECTS = {
  History: [
    "Writing and City Life",
    "An Empire Across Three Continents",
    "Nomadic Empires",
    "Changing Cultural Traditions",
    "Displacing Indigenous Peoples",
    "Paths to Modernisation"
  ],
  "Political Science": [
    "Constitution: Why and How?",
    "Rights in the Indian Constitution",
    "Election and Representation",
    "Executive",
    "Legislature",
    "Judiciary",
    "Federalism",
    "Local Governments",
    "Political Theory: An Introduction",
    "Freedom",
    "Equality",
    "Social Justice",
    "Rights",
    "Citizenship",
    "Nationalism",
    "Secularism"
  ],
  Geography: [
    "Geography as a Discipline",
    "The Origin and Evolution of the Earth",
    "Interior of the Earth",
    "Oceans and Continents",
    "Landforms and their Evolution",
    "Composition and Structure of Atmosphere",
    "Solar Radiation, Heat Balance and Temperature",
    "Water in the Atmosphere",
    "World Climate and Climate Change",
    "Water (Oceans)",
    "Movements of Ocean Water",
    "India - Location",
    "Structure and Physiography",
    "Drainage System",
    "Climate",
    "Natural Vegetation"
  ],
  Sociology: [
    "Sociology and Society",
    "Terms, Concepts and Their Use in Sociology",
    "Understanding Social Institutions",
    "Culture and Socialisation",
    "Doing Sociology: Research Methods",
    "Social Structure, Stratification and Social Processes",
    "Social Change and Social Order in Rural and Urban Society",
    "Environment and Society",
    "Introducing Western Sociologists",
    "Indian Sociologists"
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
  Economics: [
    "Concept of Economics and Significance of Statistics in Economics",
    "Collection of Data",
    "Organisation of Data",
    "Presentation of Data",
    "Measures of Central Tendency",
    "Correlation",
    "Index Numbers",
    "Introduction to Microeconomics",
    "Consumer's Equilibrium",
    "Demand and Price Elasticity of Demand",
    "Producer Behaviour and Supply",
    "Forms of Market and Price Determination"
  ]
};

let allNotes = [];
let allQuiz = [];
let allDoubts = [];

function getCompletedChapters() {
  return JSON.parse(localStorage.getItem('completedChapters')) || [];
}

function toggleComplete(e, chapter) {
  e.stopPropagation();
  let completed = getCompletedChapters();
  if (completed.includes(chapter)) {
    completed = completed.filter(c => c !== chapter);
  } else {
    completed.push(chapter);
  }
  localStorage.setItem('completedChapters', JSON.stringify(completed));
  renderDashboard();
}

async function init() {
  renderDashboard();
  populateDropdowns();
  await loadData();
}

// MAIN PAGE DIRECTORY VIEW
function renderDashboard() {
  const container = document.getElementById('subjectCards');
  if (!container) return;
  const completed = getCompletedChapters();

  container.innerHTML = Object.entries(SUBJECTS).map(([subject, chapters]) => `
    <div class="subject-card">
      <h3>📖 ${subject}</h3>
      <ul class="chapter-list">
        ${chapters.map(ch => {
          const isDone = completed.includes(ch);
          return `
            <li class="chapter-item" onclick="openChapterDetails('${subject}', '${ch}')">
              <span class="chapter-title">${ch}</span>
              <div class="chapter-actions">
                <button class="btn-open">View Page ➔</button>
                <button class="btn-check ${isDone ? 'active' : ''}" onclick="toggleComplete(event, '${ch}')">
                  ${isDone ? '✅' : '◯'}
                </button>
              </div>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `).join('');
}

async function loadData() {
  try {
    const [notesRes, doubtsRes, quizRes] = await Promise.all([
      fetch('/api/notes'),
      fetch('/api/doubts'),
      fetch('/api/quiz')
    ]);

    allNotes = await notesRes.json();
    allDoubts = await doubtsRes.json();
    allQuiz = await quizRes.json();

    renderAdminNotesList();
  } catch (err) {
    console.error('Error loading API data:', err);
  }
}

// OPEN DEDICATED CHAPTER PAGE WITH SMOOTH ANIMATION
function openChapterDetails(subject, chapter) {
  const modal = document.getElementById('chapterModal');
  
  document.getElementById('chapterModalTitle').innerText = chapter;
  document.getElementById('chapterModalSub').innerText = `${subject} • Chapter Details`;

  // Filter Notes
  const cNotes = allNotes.filter(n => n.subject === subject && n.chapter === chapter);
  const notesBox = document.getElementById('chapterNotesContainer');
  notesBox.innerHTML = cNotes.length === 0
    ? '<p style="color:#94a3b8; font-size:0.9rem;">No notes uploaded yet for this chapter.</p>'
    : cNotes.map(n => `
        <div style="background:var(--bg-primary); padding:14px; border-radius:10px; margin-bottom:12px; border:1px solid var(--bg-accent);">
          <h4 style="color:#f8fafc; margin-bottom:6px;">${n.title}</h4>
          <pre>${n.body}</pre>
          ${n.pdf ? `<a href="${n.pdf}" target="_blank" style="display:inline-block; margin-top:8px; padding:6px 12px; background:#3b82f6; color:#fff; border-radius:6px; text-decoration:none; font-weight:600; font-size:0.85rem;">📄 Open / View PDF</a>` : ''}
        </div>
      `).join('');

  // Filter Quiz
  const cQuiz = allQuiz.filter(q => q.subject === subject && q.chapter === chapter);
  const quizBox = document.getElementById('chapterQuizContainer');
  quizBox.innerHTML = cQuiz.length === 0
    ? '<p style="color:#94a3b8; font-size:0.9rem;">No quiz added for this chapter yet.</p>'
    : cQuiz.map((q, idx) => `
        <div style="background:var(--bg-primary); padding:14px; border-radius:10px; margin-bottom:12px; border:1px solid var(--bg-accent);">
          <p><strong>Q${idx + 1}. ${q.question}</strong></p>
          <div style="display:grid; gap:8px; margin-top:10px;">
            ${q.options.map((opt, oIdx) => `
              <button class="btn-check" style="text-align:left; padding:10px; border-radius:8px;" onclick="checkAnswer(this, ${oIdx}, ${q.answer}, '${q.explanation.replace(/'/g, "\\'")}')">
                ${opt}
              </button>
            `).join('')}
          </div>
          <div class="explanation hidden" style="margin-top:10px; font-size:0.85rem; color:#60a5fa;"></div>
        </div>
      `).join('');

  // Filter Doubts
  const cDoubts = allDoubts.filter(d => d.subject === subject && d.chapter === chapter);
  const doubtsBox = document.getElementById('chapterDoubtsContainer');
  doubtsBox.innerHTML = cDoubts.length === 0
    ? '<p style="color:#94a3b8; font-size:0.9rem;">No doubts/solutions added yet for this chapter.</p>'
    : cDoubts.map(d => `
        <div style="background:var(--bg-primary); padding:14px; border-radius:10px; margin-bottom:12px; border:1px solid var(--bg-accent);">
          <h5 style="color:#f8fafc;">💡 ${d.title}</h5>
          <p style="color:#94a3b8; font-size:0.9rem; margin-top:4px;">${d.body}</p>
        </div>
      `).join('');

  modal.classList.remove('hidden');
  modal.querySelector('.modal-content').scrollTop = 0;
}

function closeChapterModal() {
  document.getElementById('chapterModal').classList.add('hidden');
}

function checkAnswer(btn, selected, correct, explanation) {
  const parent = btn.parentElement;
  const buttons = parent.querySelectorAll('button');
  const expBox = parent.nextElementSibling;

  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === correct) b.style.background = '#10b981';
    else if (i === selected) b.style.background = '#ef4444';
  });

  if (explanation && expBox) {
    expBox.innerHTML = `<strong>Explanation:</strong> ${explanation}`;
    expBox.classList.remove('hidden');
  }
}

function populateDropdowns() {
  ['qSubject', 'nSubject', 'dSubject'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = Object.keys(SUBJECTS).map(s => `<option value="${s}">${s}</option>`).join('');
    el.addEventListener('change', () => {
      const chapId = id === 'qSubject' ? 'qChapter' : (id === 'nSubject' ? 'nChapter' : 'dChapter');
      updateChapters(id, chapId);
    });
  });

  updateChapters('qSubject', 'qChapter');
  updateChapters('nSubject', 'nChapter');
  updateChapters('dSubject', 'dChapter');
}

function updateChapters(subId, chapId) {
  const sub = document.getElementById(subId)?.value;
  const chapEl = document.getElementById(chapId);
  if (!sub || !chapEl) return;
  chapEl.innerHTML = SUBJECTS[sub].map(c => `<option value="${c}">${c}</option>`).join('');
}

function openAdminModal() { document.getElementById('adminModal').classList.remove('hidden'); }
function closeAdmin() { document.getElementById('adminModal').classList.add('hidden'); }

function saveAdmin() {
  const pass = document.getElementById('adminPass').value;
  if (pass === 'EduEra@2026') {
    document.getElementById('adminArea').classList.remove('hidden');
    renderAdminNotesList();
  } else {
    alert('Incorrect Admin Password!');
  }
}

async function addNote() {
  const pass = document.getElementById('adminPass').value;
  const subject = document.getElementById('nSubject').value;
  const chapter = document.getElementById('nChapter').value;
  const title = document.getElementById('nTitle').value;
  const body = document.getElementById('nBody').value;
  const pdf = document.getElementById('nPdf').value;

  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, chapter, title, body, pdf, adminPass: pass })
  });

  if (res.ok) {
    alert('Note uploaded successfully!');
    location.reload();
  } else {
    alert('Error uploading note.');
  }
}

async function addQuiz() {
  const pass = document.getElementById('adminPass').value;
  const subject = document.getElementById('qSubject').value;
  const chapter = document.getElementById('qChapter').value;
  const question = document.getElementById('qText').value;
  const options = [
    document.getElementById('a0').value,
    document.getElementById('a1').value,
    document.getElementById('a2').value,
    document.getElementById('a3').value
  ];
  const answer = parseInt(document.getElementById('qAnswer').value);
  const explanation = document.getElementById('qExplanation').value;

  const res = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, chapter, question, options, answer, explanation, adminPass: pass })
  });

  if (res.ok) {
    alert('Quiz added successfully!');
    location.reload();
  }
}

async function addDoubt() {
  const pass = document.getElementById('adminPass').value;
  const subject = document.getElementById('dSubject').value;
  const chapter = document.getElementById('dChapter').value;
  const title = document.getElementById('doubtTitle').value;
  const body = document.getElementById('doubtBody').value;

  const res = await fetch('/api/doubts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, chapter, title, body, adminPass: pass })
  });

  if (res.ok) {
    alert('Doubt added successfully!');
    location.reload();
  }
}

function renderAdminNotesList() {
  const container = document.getElementById('adminNotesList');
  if (!container) return;
  container.innerHTML = `<h4>Uploaded Items Count: ${allNotes.length} Notes</h4>`;
}

document.addEventListener('DOMContentLoaded', init);
