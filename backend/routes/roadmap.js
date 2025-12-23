const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const generateMentorNote = require("../utils/gemini");
const JOB_REQUIREMENTS = require("./jobback");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ===== GAP CALC ===== */
function calculateGaps(userSkills, roleReq) {
  return Object.entries(roleReq)
    .map(([skill, reqVal]) => {
      const current = userSkills[skill] || 0;
      return { skill, current, required: reqVal, gap: reqVal - current };
    })
    .filter(x => x.gap > 0)
    .sort((a, b) => b.gap - a.gap);
}

/* ===== API ===== */
router.post("/generate-month", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    /* 1️⃣ profile */
    const { data: profile } = await supabase
      .from("profiles")
      .select("github, interests")
      .eq("id", userId)
      .single();

    if (!profile?.github || !profile?.interests?.length) {
      return res.status(400).json({ error: "Profile incomplete" });
    }

    const primaryRole = profile.interests[0];
    if (!JOB_REQUIREMENTS[primaryRole]) {
      return res.status(400).json({
        error: `Job requirements not found for role: ${primaryRole}`
      });
    }

    /* 2️⃣ fetch skills (SAME AS JOB MATCH) */
    const githubUsername = profile.github
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "")
      .split("github.com/")[1]
      .replace("/", "");

    const skillRes = await fetch(
      `https://skillxpress.onrender.com/full-skills/${userId}/${githubUsername}`
    );
    const skillData = await skillRes.json();
    const userSkills = skillData.skills || {};

    if (!Object.keys(userSkills).length) {
      return res.status(400).json({ error: "No skills found" });
    }

    /* 3️⃣ progress */
    const { data: row } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .single();

    const month = row?.current_month || 1;

    /* 4️⃣ gap-based focus */
    const gaps = calculateGaps(userSkills, JOB_REQUIREMENTS[primaryRole]).slice(0, 4);

    /* 5️⃣ AI PROMPT */
    const prompt = `
You are a senior career mentor.

Target role: ${primaryRole}
Month: ${month}

Skill gaps:
${JSON.stringify(gaps, null, 2)}

Create a REALISTIC one-month roadmap.

FORMAT:
Month Goal

Week 1:
- Topics
- Daily practice

Week 2:
- Topics
- Daily practice

Week 3:
- Topics
- Daily practice

Week 4:
- Topics
- Daily practice

Mini Project:
- Idea
- Tech stack
- Outcome

Explain how this month improves job readiness.

No filler. Practical. Job-oriented.
`;

    const content = await generateMentorNote(prompt);

    /* 6️⃣ save */
    await supabase.from("roadmaps").upsert({
      user_id: userId,
      current_month: month + 1,
      months: {
        ...(row?.months || {}),
        [month]: { month, role: primaryRole, content }
      }
    });

    res.json({
      success: true,
      roadmap: { month, role: primaryRole, content }
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Roadmap failed" });
  }
});

module.exports = router;
