const express = require("express");
const axios = require("axios");

const router = express.Router();
const REMOTIVE_API = "https://remotive.com/api/remote-jobs";

/* ===============================
   JOBS & INTERNSHIPS API
================================ */
router.get("/", async (req, res) => {
  try {
    const response = await axios.get(REMOTIVE_API, {
      headers: { "User-Agent": "SkillXpress" }
    });

    let jobs = response.data.jobs.map(job => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || "Remote",
      type: job.job_type || "Job",
      category: job.category || "Other",
      applyLink: job.url,
      isRemote: true
    }));

    /* 🔝 PRIORITY LOGIC
       1. Remote (India / Worldwide)
       2. Internships
       3. Other jobs / freelance
    */
    jobs.sort((a, b) => {
      if (a.location.toLowerCase().includes("india")) return -1;
      if (b.location.toLowerCase().includes("india")) return 1;
      return 0;
    });

    // 🔢 Minimum 200+ jobs
    const finalJobs = jobs.slice(0, 250);

    res.json({ jobs: finalJobs });

  } catch (error) {
    console.error("Remotive fetch failed:", error.message);
    res.status(500).json({ jobs: [] });
  }
});


module.exports = router;