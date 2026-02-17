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

    /* PROFILE */
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("github, interests")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile)
      return res.status(400).json({ error: "Profile not found" });

    if (!profile.github || !profile.interests?.length)
      return res.status(400).json({ error: "Profile incomplete" });

    const primaryRole = profile.interests[0];
    const roleReq = JOB_REQUIREMENTS[primaryRole];

    if (!roleReq)
      return res.status(400).json({ error: "Invalid job role" });

    /* GITHUB USERNAME CLEAN */
    const githubUsername = profile.github
      .replace(/https?:\/\/(www\.)?github\.com\//, "")
      .replace(/\/$/, "");

    /* FETCH SKILLS */
    const userSkills = await getFullSkills(userId, githubUsername);

    if (!userSkills || !Object.keys(userSkills).length)
      return res.status(400).json({ error: "No skills found" });

    /* ROADMAP STATE */
    const { data: row } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const month = row?.current_month || 1;

    /* GAP ANALYSIS */
    const gaps = calculateGaps(userSkills, roleReq).slice(0, 5);

    /* PROMPT */
    const prompt = `
You are a strict senior ${primaryRole} hiring mentor.

First analyze the student. Then create a practical 1-month roadmap.

Current Skills:
${Object.entries(userSkills).map(([k,v]) => `- ${k}: ${v}`).join("\n")}

Required Skills:
${Object.entries(roleReq).map(([k,v]) => `- ${k}: ${v}`).join("\n")}

Top Gaps:
${gaps.map(g => `- ${g.skill}: required ${g.required}, current ${g.current}`).join("\n")}

Rules:
- Only practical steps
- Daily breakdown
- No theory
- Clear structure
- Minimum 600 words

Format:

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
Outcome:

Job Readiness Impact:
- Point 1
- Point 2
- Point 3
`;

    /* CALL AI */
    let content = "";
    try {
      content = await generateMentorNote(prompt);
      console.log("AI length:", content?.length);
    } catch (err) {
      console.error("Gemini error:", err);
      return res.status(500).json({ error: "AI generation failed" });
    }

    /* VALIDATION (No 500 for weak content) */
    if (!content || !content.includes("WEEK 1")) {
      return res.status(200).json({
        success: false,
        error: "AI response incomplete. Try again."
      });
    }

    /* SAVE */
    const { error: saveError } = await supabase
      .from("roadmaps")
      .upsert({
        user_id: userId,
        current_month: month,
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
      return res.status(500).json({ error: "Database save failed" });
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
    return res.status(500).json({ error: "Unexpected server error" });
  }
});

module.exports = router;