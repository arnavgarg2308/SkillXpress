// jobback.js (RENDER READY)
const express = require("express");
const cors = require("cors");

const app = express();

// ✅ PROPER CORS CONFIG
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.options("*", cors()); // 👈 IMPORTANT
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
/*
  INPUT:
  {
    skills: { "React": 60, "JavaScript": 70 },
    interests: ["Frontend Developer"]
  }

  OUTPUT:
  {
    success: true,
    jobMatch: {
      "Frontend Developer": 72
    }
  }
*/

app.post("/job-match", (req, res) => {
  const { skills, interests } = req.body;

  if (!skills || !interests || !Array.isArray(interests)) {
    return res.status(400).json({ error: "Invalid input data" });
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
