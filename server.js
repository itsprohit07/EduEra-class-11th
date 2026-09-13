
const express = require("express");
const Database = require("better-sqlite3");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
cons
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me-now";
fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });

const db = new Database(path.join(__dirname, "data", "study.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  answer INTEGER NOT NULL,
  explanation TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS doubts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  pdf TEXT DEFAULT ''
);
`);

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

const seedNotes = [
  {
    subject:"Psychology", chapter:"What is Psychology?", title:"Quick Revision",
    body:"Psychology ko simple words mein human behaviour aur mental processes ki scientific study samajh sakte hain. Is chapter mein behaviour, mental processes, psychology ke goals aur everyday understanding ke difference ko samjho."
  },
  {
    subject:"Sociology", chapter:"Sociology and Society", title:"Quick Revision",
    body:"Sociology society aur social relationships ka systematic study hai. Isme hum groups, institutions, culture aur social change ko observe aur analyse karte hain."
  },
  {
    subject:"History", chapter:"Writing and City Life", title:"Quick Revision",
    body:"Is chapter mein early urban societies, writing ke development, Mesopotamia aur cities ke growth ko samjha jata hai. Revision ke liye city, trade, writing aur administration ke connection par focus karo."
  }
];

if (db.prepare("SELECT COUNT(*) AS c FROM notes").get().c === 0) {
  const insert = db.prepare("INSERT INTO notes(subject,chapter,title,body) VALUES (?,?,?,?)");
  const tx = db.transaction(() => seedNotes.forEach(n => insert.run(n.subject,n.chapter,n.title,n.body)));
  tx();
}

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "public")));

function admin(req,res,next){
  const key = req.headers["x-admin-password"];
  if (!key || key !== ADMIN_PASSWORD) return res.status(401).json({error:"Admin authentication required"});
  next();
}

app.get("/api/subjects",(req,res)=>res.json(subjects));

app.get("/api/notes",(req,res)=>{
  const rows = db.prepare("SELECT * FROM notes ORDER BY id DESC").all();
  res.json(rows);
});

app.get("/api/doubts",(req,res)=>{
  res.json(db.prepare("SELECT * FROM doubts ORDER BY id DESC").all());
});

app.post("/api/doubts",admin,(req,res)=>{
  const {title,body} = req.body;
  if(!title || !body) return res.status(400).json({error:"Title and body are required"});
  const info = db.prepare("INSERT INTO doubts(title,body) VALUES (?,?)").run(title,body);
  res.json({id:info.lastInsertRowid});
});

app.get("/api/quiz",(req,res)=>{
  const rows = db.prepare("SELECT * FROM quizzes ORDER BY id DESC").all();
  res.json(rows.map(r=>({...r, options:JSON.parse(r.options)})));
});

app.post("/api/quiz",admin,(req,res)=>{
  const {subject,chapter,question,options,answer,explanation=""} = req.body;
  if(!subject||!chapter||!question||!Array.isArray(options)||answer===undefined)
    return res.status(400).json({error:"Invalid quiz data"});
  const info=db.prepare(
    "INSERT INTO quizzes(subject,chapter,question,options,answer,explanation) VALUES (?,?,?,?,?,?)"
  ).run(subject,chapter,question,JSON.stringify(options),Number(answer),explanation);
  res.json({id:info.lastInsertRowid});
});

const uploadDir = path.join(__dirname,"public","uploads");
fs.mkdirSync(uploadDir,{recursive:true});
const upload = multer({dest:uploadDir, limits:{fileSize:10*1024*1024}});

app.post("/api/notes",admin,upload.single("pdf"),(req,res)=>{
  const {subject,chapter,title,body=""}=req.body;
  if(!subject||!chapter||!title) return res.status(400).json({error:"Subject, chapter and title are required"});
  const pdf = req.file ? "/uploads/"+req.file.filename : "";
  const info=db.prepare("INSERT INTO notes(subject,chapter,title,body,pdf) VALUES (?,?,?,?,?)")
    .run(subject,chapter,title,body,pdf);
  res.json({id:info.lastInsertRowid});
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`Study Portal running on http://localhost:${PORT}`));
