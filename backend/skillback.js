const express = require("express");
const cors = require("cors");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { createClient } = require("@supabase/supabase-js");
const microTestRoutes = require("./routes/microTest");
const jobRoutes = require("./routes/jobback");
const roadmapRoutes = require("./routes/roadmap");
const jobsRouter = require("./routes/jobserver");
const opportunitiesRouter = require("./routes/opportunitiesServer");
const fs = require("fs");
const pdf = require("pdf-parse");
const Tesseract = require("tesseract.js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const app = express();
const corsOptions = {
  origin: [
    "https://skill-xpress.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "https://skillxpress.onrender.com" 
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use("/api/micro-test", microTestRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/jobs", jobsRouter);
app.use("/api/opportunities", opportunitiesRouter);
/* ===== ML HELPERS ===== */

function normalize(value, max = 200) {
  return Math.min(100, Math.round((value / max) * 100));
}

function mlScore({ repos, stars, forks, activity }) {
  return (
    repos * 0.4 +
    stars * 0.3 +
    forks * 0.2 +
    activity * 0.1
  );
}

/* ===== API ===== */

app.get("/full-skills/:userId/:username", async (req, res) => {
  const { userId, username } = req.params;

  try {
    let skills = {};

    /* ===== 1️⃣ GITHUB ANALYSIS ===== */
    const ghRes = await fetch(
      `https://api.github.com/users/${username}/repos`,
      {
        headers: {
          "User-Agent": "SkillXpress",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
        }
      }
    );
const repos = await ghRes.json();
    for (const repo of repos) {
  if (repo.fork) continue;

  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const size = repo.size || 0; // KB
  const lastPush = new Date(repo.pushed_at);
  const daysAgo = (Date.now() - lastPush) / (1000 * 60 * 60 * 24);

  // Activity weight
  let activity = 1;
  if (daysAgo < 30) activity = 5;
  else if (daysAgo < 90) activity = 3;

  // Repo base score
  const repoScore =
  (Math.log(stars + 1) * 5) +
  (forks * 1.2) +
  (size / 500) +
  activity;
  
  const langRes = await fetch(repo.languages_url, {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
  });

  const languages = await langRes.json();
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);

  for (const [lang, bytes] of Object.entries(languages)) {
    const percent = bytes / totalBytes;
    const scoreToAdd = repoScore * percent;

    skills[lang] = (skills[lang] || 0) + scoreToAdd;
  }
}

    /* ===== 2️⃣ SUPABASE UPLOADS FETCH ===== */
    const { data: uploads } = await supabase
      .from("uploads")
      .select("type, description")
      .eq("user_id", userId);
const skillMap = {
    "REACT": ["react", "reactjs"],
  "NODE.JS": ["nodejs", "express"],
  "HTML": ["html"],
  "CSS": ["css", "tailwind", "bootstrap"],
  "JAVASCRIPT": ["javascript", " js "],
  "TYPESCRIPT": ["typescript", " ts "],
  "PYTHON": ["python", "django", "flask"],
  "JAVA": ["java", "spring"],
  "MONGODB": ["mongodb", "mongo"],
  "SQL": ["sql", "mysql", "postgres", "postgresql"],
  "FIREBASE": ["firebase"],
  "AWS": ["aws", "ec2", "s3"],
  "DOCKER": ["docker"],
  "GIT": ["git", "github"],
  "DSA": ["dsa", "data structure", "algorithm"],
  "OOP": ["oop", "object oriented", "class", "inheritance"],
  "PROGRAMMING": ["programming", "coding"],
  
  "EXPRESS": ["express"],
  "APIS": ["api", "rest", "restful"],
  "DEBUGGING": ["debug", "bug fix", "error fix"],

  "EXCEL": ["excel", "spreadsheet"],
  "DATA_ANALYSIS": ["data analysis", "analysis"],
  "STATISTICS": ["statistics"],

  "LINUX": ["linux", "ubuntu"],
  "CICD": ["ci/cd", "github actions", "jenkins"],
  "NETWORKING": ["network", "tcp", "http"],

  "TESTING": ["testing", "test cases"],
  "AUTOMATION": ["automation"],

  "FIGMA": ["figma"],
  "UI_DESIGN": ["ui design"],
  "UX_RESEARCH": ["ux research"],

  "MACHINE_LEARNING": ["machine learning", "ml"],
  "MODEL_DEPLOYMENT": ["deployment", "model serving"]
  };

    uploads.forEach(item => {

      // 🎓 Certificates
      if (item.type === "certificate" && item.description) {

  const t = item.description.toLowerCase();

  Object.entries(skillMap).forEach(([skill, keywords]) => {

    let total = 0;

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = t.match(regex);
      if (matches) total += matches.length;
    });

    if (total > 0) {
      skills[skill] = (skills[skill] || 0) + (total * 1.5); // cert weight lower
    }

  });
}

     // 🛠 Projects
if (item.type === "project" && item.description) {
  const t = item.description.toLowerCase();

  
  Object.entries(skillMap).forEach(([skill, keywords]) => {
    if (keywords.some(k => t.includes(k))) {
      skills[skill] = (skills[skill] || 0) + 3;
    }
  });
}

      // 📄 Resume (basic boost)
      if (item.type === "resume" && item.description) {

  const t = item.description.toLowerCase();

  Object.entries(skillMap).forEach(([skill, keywords]) => {

    let total = 0;

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = t.match(regex);
      if (matches) total += matches.length;
    });

    if (total > 0) {
      skills[skill] = (skills[skill] || 0) + (total * 2); // resume weight 2x
    }

  });
}
    });

    /* ===== NORMALIZE ===== */
    Object.keys(skills).forEach(k => {
      skills[k] = Math.min(100, skills[k]);
    });

    res.json({ skills });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Skill analysis failed" });
  }
});


/* ===== RENDER START ===== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("✅ Skill ML backend LIVE on Render 🚀")
);
