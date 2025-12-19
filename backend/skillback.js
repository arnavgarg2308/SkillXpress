const express = require("express");
const cors = require("cors");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const app = express();
app.use(cors());
app.use(express.json());

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

      const langRes = await fetch(repo.languages_url, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      });
      const languages = await langRes.json();

      for (const lang of Object.keys(languages)) {
        skills[lang] = (skills[lang] || 0) + 15;
      }
    }

    /* ===== 2️⃣ SUPABASE UPLOADS FETCH ===== */
    const { data: uploads } = await supabase
      .from("uploads")
      .select("type, description")
      .eq("user_id", userId);

    uploads.forEach(item => {

      // 🎓 Certificates
      if (item.type === "certificate") {
        skills["Learning"] = (skills["Learning"] || 0) + 10;
      }

      // 🛠 Projects
      if (item.type === "project" && item.description) {
        const t = item.description.toLowerCase();
        if (t.includes("react")) skills["React"] = (skills["React"] || 0) + 20;
        if (t.includes("node")) skills["Node.js"] = (skills["Node.js"] || 0) + 20;
        if (t.includes("html")) skills["HTML"] = (skills["HTML"] || 0) + 10;
        if (t.includes("css")) skills["CSS"] = (skills["CSS"] || 0) + 10;
      }

      // 📄 Resume (basic boost)
      if (item.type === "resume") {
        skills["Professional Readiness"] =
          (skills["Professional Readiness"] || 0) + 15;
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
// jobback.js (RENDER SAFE & STABLE)
const express = require("express");

const app = express();

/* ================================
   FORCE CORS (MOST RELIABLE)
   ================================ */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

/* ================================
   JOB REQUIREMENTS CONFIG
   ================================ */

const JOB_REQUIREMENTS = {
  "Frontend Developer": {
    HTML: 80,
    CSS: 70,
    JavaScript: 85,
    React: 75
  },
  "Backend Developer": {
    "Node.js": 80,
    Express: 70,
    SQL: 75,
    MongoDB: 70
  },
  "Full Stack Developer": {
    HTML: 70,
    CSS: 60,
    JavaScript: 80,
    React: 70,
    "Node.js": 75,
    SQL: 70
  },
  "Data Analyst": {
    Python: 80,
    SQL: 75,
    Excel: 70
  }
};

/* ================================
   JOB MATCH API
   ================================ */
app.post("/job-match", (req, res) => {
  const { skills, interests } = req.body;

  if (!skills || !interests || !Array.isArray(interests)) {
    return res.status(400).json({
      success: false,
      error: "Invalid input data"
    });
  }

  let jobMatch = {};

  interests.forEach(job => {
    const requiredSkills = JOB_REQUIREMENTS[job];
    if (!requiredSkills) return;

    let total = 0;
    let matched = 0;

    Object.entries(requiredSkills).forEach(([skill, requiredValue]) => {
      total += requiredValue;
      matched += Math.min(skills[skill] || 0, requiredValue);
    });

    jobMatch[job] = Math.round((matched / total) * 100);
  });

  res.json({
    success: true,
    jobMatch
  });
});

/* ================================
   RENDER SERVER START
   ================================ */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Job Match backend LIVE on Render");
});
