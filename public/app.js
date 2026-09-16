const SUBJECTS = {
  History: [
    "Writing and City Life",
    "An Empire Across Three Continents",
    "Nomadic Empires",
    "Changing Cultural Traditions"
  ],
  Psychology: [
    "What is Psychology?",
    "Methods of Enquiry in Psychology",
    "Human Development",
    "Sensory, Attentional and Perceptual Processes"
  ],
  Sociology: [
    "Sociology and Society",
    "Terms, Concepts and their use in Sociology",
    "Understanding Social Institutions",
    "Culture and Socialisation"
  ]
};

let allNotes = [];
let allQuiz = [];

function getCompletedChapters() {
  return JSON.parse(localStorage.getItem('completedChapters')) || [];
}

function toggleComplete(chapter) {
  let completed = getCompletedChapters();
  if (completed.includes(chapter)) {
    completed = completed.filter(c => c !== chapter);
  } else {
    completed.push(chapter);
  }
  localStorage.setItem('completedChapters', JSON.stringify(completed));
  renderSubjectCards();
  renderNotes();
}

async function init() {
  renderSubjectCards();
  populateDropdowns();
  await loadData();
}

function renderSubjectCards() {
  const container = document.getElementById('subjectCards');
  if (!container) return;
  const completed = getCompletedChapters();

  container.innerHTML = Object.entries(SUBJECTS).map(([subject, chapters]) => `
    <div class="card">
      <h3>${subject}</h3>
      <ul>
        ${chapters.map(ch => {
          const isDone = completed.includes(ch);
          return `
            <li class="chapter-item ${isDone ? 'done' : ''}">
              <span>${ch}</span>
              <button class="tick-btn ${isDone ? 'active' : ''}" onclick="toggleComplete('${ch}')">
                ${isDone ? '✅ Done' : '◯ Mark Done'}
              </button>
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
    renderNotes();
    renderAdminNotesList();

    const doubts = await doubtsRes.json();
    renderDoubts(doubts);

    allQuiz = await quizRes.json();
    renderQuiz();
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

// Format PDF link to open in Google Drive viewer or new tab properly
function formatPdfUrl(url) {
  if (!url) return '';
  if (url.includes('drive.google.com') && url.includes('/view')) {
    return url;
  }
  return url.startsWith('http') ? url : `https://${url}`;
}

function renderNotes() {
  const container = document.getElementById('notes');
  if (!container) return;
  const filter = document.getElementById('subjectFilter')?.value || '';
  const completed = getCompletedChapters();

  const filtered = filter ? allNotes.filter(n => n.subject === filter) : allNotes;

  container.innerHTML = filtered.map(n => {
    const isDone = completed.includes(n.chapter);
    const pdfUrl = formatPdfUrl(n.pdf);
    return `
      <div class="note-card ${isDone ? 'note-done' : ''}">
        <div class="note-header">
          <span class="badge">${n.subject} • ${n.chapter}</span>
          <button class="tick-btn ${isDone ? 'active' : ''}" onclick="toggleComplete('${n.chapter}')">
            ${isDone ? '✅ Completed' : 'Mark as Done'}
          </button>
        </div>
        <h4>${n.title}</h4>
        <pre>${n.body}</pre>
        ${pdfUrl ? `
          <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" 
             style="display:inline-block; margin-top:10px; padding:8px 14px; background:#3b82f6; color:#ffffff; border-radius:6px; text-decoration:none; font-weight:bold;">
            📄 Open / View PDF
          </a>` : ''}
      </div>
    `;
  }).join('');
}

function renderAdminNotesList() {
  const container = document.getElementById('adminNotesList');
  if (!container) return;

  if (allNotes.length === 0) {
    container.innerHTML = '<p style="color:#aaa;">No uploaded notes currently.</p>';
    return;
  }

  container.innerHTML = `
    <h4>🗑️ Manage & Delete Uploaded Notes</h4>
    <div style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
      ${allNotes.map(n => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div>
            <strong>[${n.subject}] ${n.title}</strong>
            <div style="font-size: 0.8em; opacity: 0.7;">${n.chapter}</div>
          </div>
          <button class="tick-btn" style="border-color: #ef4444; color: #ef4444;" onclick="deleteNote(${n.id})">
            🗑️ Delete
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

async function deleteNote(id) {
  const pass = document.getElementById('adminPass').value;
  if (confirm('Are you sure you want to delete this note?')) {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPass: pass })
    });
    if (res.ok) {
      alert('Note deleted successfully!');
      await loadData();
    } else {
      alert('Error: Incorrect Admin Password!');
    }
  }
}

function renderDoubts(doubts) {
  const container = document.getElementById('doubts');
  if (!container) return;
  container.innerHTML = doubts.map(d => `
    <div class="doubt-card">
      <h4>💡 ${d.title}</h4>
      <p>${d.body}</p>
    </div>
  `).join('');
}

function renderQuiz() {
  const container = document.getElementById('quiz');
  if (!container) return;
  container.innerHTML = allQuiz.map((q, idx) => `
    <div class="quiz-card">
      <span class="badge">${q.subject} • ${q.chapter}</span>
      <p class="quiz-q"><strong>Q${idx + 1}. ${q.question}</strong></p>
      <div class="options">
        ${q.options.map((opt, oIdx) => `
          <button class="opt-btn" onclick="checkAnswer(this, ${oIdx}, ${q.answer}, '${q.explanation.replace(/'/g, "\\'")}')">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div class="explanation hidden"></div>
    </div>
  `).join('');
}

function checkAnswer(btn, selected, correct, explanation) {
  const parent = btn.closest('.quiz-card');
  const buttons = parent.querySelectorAll('.opt-btn');
  const expBox = parent.querySelector('.explanation');

  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === correct) b.classList.add('correct');
    else if (i === selected) b.classList.add('wrong');
  });

  if (explanation) {
    expBox.innerHTML = `<strong>💡 Explanation:</strong> ${explanation}`;
    expBox.classList.remove('hidden');
  }
}

function populateDropdowns() {
  const subFilter = document.getElementById('subjectFilter');
  if (subFilter) {
    subFilter.innerHTML = '<option value="">All Subjects</option>' +
      Object.keys(SUBJECTS).map(s => `<option value="${s}">${s}</option>`).join('');
    subFilter.addEventListener('change', renderNotes);
  }

  ['qSubject', 'nSubject'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = Object.keys(SUBJECTS).map(s => `<option value="${s}">${s}</option>`).join('');
    el.addEventListener('change', () => updateChapters(id, id === 'qSubject' ? 'qChapter' : 'nChapter'));
  });

  updateChapters('qSubject', 'qChapter');
  updateChapters('nSubject', 'nChapter');
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

async function addDoubt() {
  const pass = document.getElementById('adminPass').value;
  const title = document.getElementById('doubtTitle').value;
  const body = document.getElementById('doubtBody').value;
  if (!title || !body) return alert('Fill all fields');

  const res = await fetch('/api/doubts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, adminPass: pass })
  });

  if (res.ok) {
    location.reload();
  } else {
    alert('Failed to add. Incorrect Admin Password!');
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
    location.reload();
  } else {
    alert('Failed to add. Incorrect Admin Password!');
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
    location.reload();
  } else {
    alert('Failed to upload note. Incorrect Admin Password!');
  }
}

document.addEventListener('DOMContentLoaded', init);
