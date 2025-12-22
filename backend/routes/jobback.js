// jobback.js — FINAL JOB MATCH BACKEND

const express = require("express");
const router = express.Router();
const JOB_REQUIREMENTS = require("../data/jobRequirements");

// const cors = require("cors");

// const app = express();

/* ================================
   MIDDLEWARE
   ================================ */
// app.use(cors());
// app.use(express.json());

/* ================================
   JOB CONFIG (STATIC DATA)
   ================================ */


/* ================================
   1️⃣ GET ALL JOB ROLES
   ================================ */
router.get("/jobs", (req, res) => {
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

router.post("/job-match", (req, res) => {
  const { skills, interests } = req.body;

  if (!skills || typeof skills !== "object") {
    return res.status(400).json({ success:false, error:"Skills required" });
  }

  const selectedJobs =
  interests && interests.length
    ? Object.keys(JOB_REQUIREMENTS).filter(job =>
        interests.includes(job)
      )
    : [];



  let results = {};

  selectedJobs.forEach(job => {
    const requirements = JOB_REQUIREMENTS[job];
    if (!requirements) return;

    let total = 0, matched = 0;

    Object.entries(requirements).forEach(([skill, reqVal]) => {
      total += reqVal;
      matched += Math.min(skills[skill] || 0, reqVal);
    });

    results[job] = Math.round((matched / total) * 100);
  });

  res.json({ success:true, results });
});


/* ================================
   SERVER START
   ================================ */

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log("✅ Job Match backend LIVE on Render");
// });
module.exports = router;
