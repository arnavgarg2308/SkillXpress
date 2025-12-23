const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const generateMentorNote = require("../utils/gemini");
const JOB_REQUIREMENTS = require("./jobback");
const getFullSkills = require("../utils/getFullSkills"); // 👈 function (NO HTTP)

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
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    /* 1️⃣ PROFILE */
    const { data: profile } = await supabase
      .from("profiles")
      .select("github, interests")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      return res.status(400).json({ error: "Profile not found" });
    }

    if (!profile.github || !profile.interests?.length) {
      return res.status(400).json({ error: "Profile incomplete" });
    }

    const primaryRole = profile.interests[0];
    const roleReq = JOB_REQUIREMENTS[primaryRole];

    if (!roleReq) {
      return res.status(400).json({
        error: `Job requirements not found for ${primaryRole}`
      });
    }

    /* 2️⃣ GITHUB USERNAME (SAFE) */
    const githubUsername = profile.github
      .replace(/https?:\/\/(www\.)?github\.com\//, "")
      .replace(/\/$/, "");

    /* 3️⃣ FETCH SKILLS (DIRECT FUNCTION) */
    const userSkills = await getFullSkills(userId, githubUsername);

    if (!userSkills || !Object.keys(userSkills).length) {
      return res.status(400).json({ error: "No skills found" });
    }

    /* 4️⃣ ROADMAP PROGRESS */
    const { data: row } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const month = row?.current_month || 1;

    /* 5️⃣ GAP ANALYSIS */
    const gaps = calculateGaps(userSkills, roleReq).slice(0, 4);

    /* 6️⃣ AI PROMPT */
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

    /* 7️⃣ SAVE ROADMAP */
    await supabase.from("roadmaps").upsert({
      user_id: userId,
      current_month: month + 1,
      months: {
        ...(row?.months || {}),
        [month]: {
          month,
          role: primaryRole,
          content
        }
      }
    });

    return res.json({
      success: true,
      roadmap: {
        month,
        role: primaryRole,
        content
      }
    });

  } catch (err) {
    console.error("ROADMAP ERROR:", err);
    return res.status(500).json({ error: "Roadmap generation failed" });
  }
});

module.exports = router;
