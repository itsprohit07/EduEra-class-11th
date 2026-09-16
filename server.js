const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = 'EduEra@2026';

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
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

// Middleware for Admin Pass Verification
const checkAdmin = (req, res, next) => {
  const { adminPass } = req.body;
  if (adminPass === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Incorrect Admin Password' });
  }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Public GET Routes (Everyone can read)
app.get('/api/notes', (req, res) => {
  res.json(db.prepare('SELECT * FROM notes').all());
});

app.get('/api/doubts', (req, res) => {
  res.json(db.prepare('SELECT * FROM doubts').all());
});

app.get('/api/quiz', (req, res) => {
  const quiz = db.prepare('SELECT * FROM quiz').all();
  res.json(quiz.map(q => ({ ...q, options: JSON.parse(q.options) })));
});

// Protected POST/DELETE Routes (Only Admin can add/delete)
app.post('/api/notes', checkAdmin, (req, res) => {
  const { subject, chapter, title, body, pdf } = req.body;
  const info = db.prepare('INSERT INTO notes (subject, chapter, title, body, pdf) VALUES (?, ?, ?, ?, ?)').run(
    subject, chapter, title, body, pdf || ''
  );
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/notes/:id', checkAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  res.json({ success: true, message: 'Note deleted successfully' });
});

app.post('/api/doubts', checkAdmin, (req, res) => {
  const { title, body } = req.body;
  const info = db.prepare('INSERT INTO doubts (title, body) VALUES (?, ?)').run(title, body);
  res.json({ id: info.lastInsertRowid });
});

app.post('/api/quiz', checkAdmin, (req, res) => {
  const { subject, chapter, question, options, answer, explanation } = req.body;
  const info = db.prepare('INSERT INTO quiz (subject, chapter, question, options, answer, explanation) VALUES (?, ?, ?, ?, ?, ?)').run(
    subject, chapter, question, JSON.stringify(options), answer, explanation || ''
  );
  res.json({ id: info.lastInsertRowid });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
