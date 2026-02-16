const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const generateMentorNote = require("../utils/gemini");
const jobRouter = require("./jobback");
const JOB_REQUIREMENTS = jobRouter.JOB_REQUIREMENTS;
const getFullSkills = require("../utils/getFullSkills");

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
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("github, interests")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
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

    /* 2️⃣ CLEAN GITHUB USERNAME */
    const githubUsername = profile.github
      .replace(/https?:\/\/(www\.)?github\.com\//, "")
      .replace(/\/$/, "");

    /* 3️⃣ FETCH SKILLS */
    const userSkills = await getFullSkills(userId, githubUsername);

    if (!userSkills || !Object.keys(userSkills).length) {
      return res.status(400).json({ error: "No skills found" });
    }

    /* 4️⃣ GET ROADMAP STATE */
    const { data: row } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const month = row?.current_month || 1;

    /* 5️⃣ GAP ANALYSIS */
    const gaps = calculateGaps(userSkills, roleReq).slice(0, 5);

    /* 6️⃣ STRUCTURED PROMPT */
    const prompt = `
You are a strict senior ${primaryRole} hiring mentor.

STEP 1: ANALYZE THE STUDENT

Current Skills:
${Object.entries(userSkills).map(([k,v]) => `- ${k}: ${v}`).join("\n")}

Required Skills:
${Object.entries(roleReq).map(([k,v]) => `- ${k}: ${v}`).join("\n")}

Top Gaps:
${gaps.map(g => `- ${g.skill}: required ${g.required}, current ${g.current}`).join("\n")}

Give:
- Strengths
- Weaknesses
- Job Readiness Score (realistic %)

STEP 2: CREATE A PRACTICAL 1-MONTH ROADMAP

Rules:
- No motivation
- No theory explanation
- Only practical tasks
- Daily breakdown
- Clear weekly progression
- Minimum 800 words

FORMAT STRICTLY:

===== SKILL ANALYSIS =====
Strengths:
Weaknesses:
Job Readiness Score:

===== MONTH ${month} ROADMAP =====

MONTH OBJECTIVE:

WEEK 1:
Topics:
Daily Tasks:

WEEK 2:
Topics:
Daily Tasks:

WEEK 3:
Topics:
Daily Tasks:

WEEK 4:
Topics:
Daily Tasks:

MINI PROJECT:
Problem:
Tech Stack:
What Student Will Build:
Skills Improved:

End with:
Job Readiness Impact:
- Bullet 1
- Bullet 2
- Bullet 3
`;

    /* 7️⃣ CALL GEMINI SAFELY */
    let content;
    try {
      content = await generateMentorNote(prompt);
      console.log("Gemini response length:", content?.length);
    } catch (aiError) {
      console.error("Gemini failed:", aiError);
      return res.status(500).json({ error: "AI generation failed" });
    }

    if (!content || content.trim().length < 200) {
      return res.status(500).json({ error: "AI returned weak content" });
    }

    /* 8️⃣ SAVE SAFELY */
    const { error: saveError } = await supabase
      .from("roadmaps")
      .upsert({
        user_id: userId,
        current_month: month, // FIXED
        months: {
          ...(row?.months || {}),
          [month]: {
            month,
            role: primaryRole,
            content
          }
        }
      });

    if (saveError) {
      console.error("Save error:", saveError);
      return res.status(500).json({ error: "Failed to save roadmap" });
    }

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