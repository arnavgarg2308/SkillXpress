const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const generateMentorNote = require("../utils/gemini");
const jobRouter = require("./jobback");
const JOB_REQUIREMENTS = jobRouter.JOB_REQUIREMENTS;
console.log("FOUND:", JOB_REQUIREMENTS["Backend Developer"]);
console.log("ALL ROLES:", Object.keys(JOB_REQUIREMENTS));
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
You are an industry senior ${primaryRole} mentor.

Create a VERY CLEAR, PRACTICAL 1-MONTH LEARNING ROADMAP.

User goal: Get job-ready as ${primaryRole}
Month number: ${month}

Current Skills:
${Object.entries(userSkills)
  .map(([k,v]) => `- ${k}: ${v}`)
  .join("\n")}

Required Skills:
${Object.entries(roleReq)
  .map(([k,v]) => `- ${k}: ${v}`)
  .join("\n")}

RULES:
- Simple language
- No motivation talk
- No theory dump
- Daily actionable tasks
- Output must be useful for a beginner/intermediate student

FORMAT STRICTLY:

MONTH OBJECTIVE (2 lines max)

WEEK 1:
Topics:
Daily tasks:

WEEK 2:
Topics:
Daily tasks:

WEEK 3:
Topics:
Daily tasks:

WEEK 4:
Topics:
Daily tasks:

MINI PROJECT:
Problem:
Tech stack:
What student will learn:

End with: "Job readiness impact" (3 bullet points)
`;


    let content = await generateMentorNote(prompt);

if (!content ) {
  console.log("❌ Gemini returned empty / weak content");
  return res.status(503).json({
    success: false,
    error: "AI is warming up. Please try again in a moment."
  });
}


    /* 7️⃣ SAVE ROADMAP */
    await supabase.from("roadmaps").upsert({
      user_id: userId,
     current_month: content ? month + 1 : month,

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
