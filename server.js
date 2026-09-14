const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: });
}

const db = new Database(path.join(dataDir, 'eduera.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    chapter TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    pdf TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS doubts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quiz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    chapter TEXT NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    answer INTEGER NOT NULL,
    explanation TEXT DEFAULT ''
  );
`);

const initialNotes = [
  // HISTORY
  { subject: "History", chapter: "Writing and City Life", title: "Writing & City Life - Quick Notes", body: "• Mesopotamia (Modern Iraq) me world ki pehli urban civilization & writing system shuru hui.\n• Main Cities: Uruk & Ur trade aur religious centers the.\n• Cuneiform Script: Clay tablets par wedge-shaped symbols se likhi jati thi.\n• Importance: Business records aur administration manage karne ke liye writing use hoti thi." },
  { subject: "History", chapter: "An Empire Across Three Continents", title: "Roman Empire - Quick Notes", body: "• Empire Europe, North Africa aur West Asia tak phaila tha.\n• Control: Emperor, Senate, aur Army milkar rule karte the.\n• Economy: Trade network olive oil, wine, aur wheat par depend tha.\n• Labor: Society me slave labor ka bada role tha." },
  { subject: "History", chapter: "Nomadic Empires", title: "Mongol Empire - Quick Notes", body: "• Genghis Khan ne 1206 me nomadic tribes ko unite karke sabse bada land empire banaya.\n• Army Discipline: Strict rules aur Yasa legal code tha.\n• Yam System: Fast courier service communication aur trade connectivity ke liye thi." },
  { subject: "History", chapter: "Changing Cultural Traditions", title: "Renaissance Europe - Quick Notes", body: "• 14th-17th century me Europe me cultural revival (Punarjagran) aaya.\n• Humanism: Blind faith ki jagah logic, science, aur human welfare ko importance mili.\n• Printing Press: Gutenberg ke press se books sasti hui aur knowledge fast spread hui." },
  
  // PSYCHOLOGY
  { subject: "Psychology", chapter: "What is Psychology?", title: "Intro to Psychology - Quick Notes", body: "• Psychology human mind, mental processes aur behavior ki scientific study hai.\n• Mental Processes: Thinking, problem-solving, aur remembering.\n• Behaviors: Overt (Jo bahar dikhe, e.g. actions) & Covert (Jo internal ho, e.g. thoughts)." },
  { subject: "Psychology", chapter: "Methods of Enquiry in Psychology", title: "Research Methods - Quick Notes", body: "• Scientific enquiry ke main tools:\n  1. Observation: Naturally behavior study karna.\n  2. Experimental Method: Cause & effect relation check karna.\n  3. Survey: Interviews/Questionnaires se data collect karna." },
  { subject: "Psychology", chapter: "Human Development", title: "Developmental Stages - Quick Notes", body: "• Life-span growth across physical, cognitive, aur emotional domains.\n• Infancy & Childhood: Motor skills aur language learning.\n• Adolescence: Identity formation, emotional changes, aur peer influence." },
  { subject: "Psychology", chapter: "Sensory, Attentional and Perceptual Processes", title: "Sensation & Perception - Quick Notes", body: "• Sensation: Sense organs se raw signal receive karna.\n• Attention: Specific information par focus karna.\n• Perception: Brain dwara information ko meaningful matlab dena." },

  // SOCIOLOGY
  { subject: "Sociology", chapter: "Sociology and Society", title: "Sociology Basics - Quick Notes", body: "• Society aur individual ke interaction ki systematic study.\n• Sociological Imagination: Personal issues ko broader social structure se connect karke dekhna (C. Wright Mills).\n• Diversity: Indian society me multiculturism & pluralism exist karta hai." },
  { subject: "Sociology", chapter: "Terms, Concepts and their use in Sociology", title: "Sociological Terms - Quick Notes", body: "• Social Groups: Primary (Family/Friends) & Secondary (Formal/Workplace).\n• Social Stratification: Society ka hierarchy (Caste, Class, Gender) me divide hona." },
  { subject: "Sociology", chapter: "Understanding Social Institutions", title: "Social Institutions - Quick Notes", body: "• Pillars of Society: Family, Marriage, Kinship, Work, Politics, & Religion.\n• Family Types: Nuclear vs Joint family; Matrilocal vs Patrilocal setups." },
  { subject: "Sociology", chapter: "Culture and Socialisation", title: "Culture & Socialisation - Quick Notes", body: "• Culture: Norms, beliefs, aur values jo living style decide karte hain.\n• Socialisation: Society ke rules aur behavior seekhne ka continuous process (Family, School, Media se)." }
];

const initialQuiz = [
  { subject: "History", chapter: "Writing and City Life", question: "Which script was used in ancient Mesopotamia?", options: JSON.stringify(["Hieroglyphics", "Cuneiform", "Brahmi", "Devanagari"]), answer: 1, explanation: "Mesopotamia me clay tablets par wedges ki shape me Cuneiform script likhi jati thi." },
  { subject: "Psychology", chapter: "What is Psychology?", question: "Which type of behavior is directly observable by others?", options: JSON.stringify(["Covert Behavior", "Overt Behavior", "Implicit Behavior", "Latent Behavior"]), answer: 1, explanation: "Overt behavior (jaise walking, talking) ko bahar se dekha ja sakta hai, jabki covert behavior internal hota hai." },
  { subject: "Sociology", chapter: "Sociology and Society", question: "Who coined the concept of 'Sociological Imagination'?", options: JSON.stringify(["Karl Marx", "Auguste Comte", "C. Wright Mills", "Max Weber"]), answer: 2, explanation: "C. Wright Mills ne personal problems ko broader society se connect karne ke liye ye term diya tha." }
];

const notesCount = db.prepare('SELECT count(*) as count FROM notes').get();
if (notesCount.count === 0) {
  const insertNote = db.prepare('INSERT INTO notes (subject, chapter, title, body) VALUES (?, ?, ?, ?)');
  const noteTransaction = db.transaction((notes) => {
    for (const n of notes) insertNote.run(n.subject, n.chapter, n.title, n.body);
  });
  noteTransaction(initialNotes);
}

const quizCount = db.prepare('SELECT count(*) as count FROM quiz').get();
if (quizCount.count === 0) {
  const insertQuiz = db.prepare('INSERT INTO quiz (subject, chapter, question, options, answer, explanation) VALUES (?, ?, ?, ?, ?, ?)');
  const quizTransaction = db.transaction((quizzes) => {
    for (const q of quizzes) insertQuiz.run(q.subject, q.chapter, q.question, q.options, q.answer, q.explanation);
  });
  quizTransaction(initialQuiz);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/notes', (req, res) => {
  const notes = db.prepare('SELECT * FROM notes').all();
  res.json(notes);
});

app.get('/api/doubts', (req, res) => {
  const doubts = db.prepare('SELECT * FROM doubts').all();
  res.json(doubts);
});

app.get('/api/quiz', (req, res) => {
  const quiz = db.prepare('SELECT * FROM quiz').all();
  res.json(quiz.map(q => ({ ...q, options: JSON.parse(q.options) })));
});

app.post('/api/doubts', (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
  const info = db.prepare('INSERT INTO doubts (title, body) VALUES (?, ?)').run(title, body);
  res.json({ id: info.lastInsertRowid });
});

app.post('/api/quiz', (req, res) => {
  const { subject, chapter, question, options, answer, explanation } = req.body;
  const info = db.prepare('INSERT INTO quiz (subject, chapter, question, options, answer, explanation) VALUES (?, ?, ?, ?, ?, ?)').run(
    subject, chapter, question, JSON.stringify(options), answer, explanation || ''
  );
  res.json({ id: info.lastInsertRowid });
});

app.post('/api/notes', (req, res) => {
  const { subject, chapter, title, body, pdf } = req.body;
  const info = db.prepare('INSERT INTO notes (subject, chapter, title, body, pdf) VALUES (?, ?, ?, ?, ?)').run(
    subject, chapter, title, body, pdf || ''
  );
  res.json({ id: info.lastInsertRowid });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
