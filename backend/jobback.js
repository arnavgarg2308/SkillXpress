// jobback.js — FINAL JOB MATCH BACKEND

const express = require("express");
const cors = require("cors");

const app = express();

/* ================================
   MIDDLEWARE
   ================================ */
app.use(cors());
app.use(express.json());

/* ================================
   JOB CONFIG (STATIC DATA)
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
   1️⃣ GET ALL JOB ROLES
   ================================ */
app.get("/jobs", (req, res) => {
  res.json({
    success: true,
    jobs: Object.keys(JOB_REQUIREMENTS)
  });
});

/* ================================
   2️⃣ JOB MATCH CALCULATION
   ================================ */
/*
INPUT:
{
  "skills": { "HTML":60, "CSS":50 },
  "jobs": ["Frontend Developer","Backend Developer"]
}

OUTPUT:
{
  "success": true,
  "results": {
    "Frontend Developer": 71,
    "Backend Developer": 32
  }
}
*/

app.post("/job-match", (req, res) => {
  const { skills, jobs } = req.body;

  if (!skills || typeof skills !== "object") {
    return res.status(400).json({
      success: false,
      error: "Skills object required"
    });
  }

  const selectedJobs = jobs && jobs.length
    ? jobs
    : Object.keys(JOB_REQUIREMENTS);

  let results = {};

  selectedJobs.forEach(job => {
    const requirements = JOB_REQUIREMENTS[job];
    if (!requirements) return;

    let totalRequired = 0;
    let matchedScore = 0;

    Object.entries(requirements).forEach(([skill, requiredValue]) => {
      totalRequired += requiredValue;
      matchedScore += Math.min(skills[skill] || 0, requiredValue);
    });

    results[job] = Math.round((matchedScore / totalRequired) * 100);
  });

  res.json({
    success: true,
    results
  });
});

/* ================================
   SERVER START
   ================================ */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Job Match backend LIVE on Render");
});
