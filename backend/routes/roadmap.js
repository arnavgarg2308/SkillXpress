const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const generateMentorNote = require("../utils/gemini");
const jobRouter = require("./jobback");
const JOB_REQUIREMENTS = jobRouter.JOB_REQUIREMENTS;
const getFullSkills = require("../utils/getFullSkills");
const generateAndUploadPDF = require("../utils/generateRoadmapPDF");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* GAP CALC */
function calculateGaps(userSkills, roleReq) {
  return Object.entries(roleReq)
    .map(([skill, reqVal]) => {
      const current = userSkills[skill] || 0;
      return { skill, current, required: reqVal, gap: reqVal - current };
    })
    .sort((a, b) => b.gap - a.gap);
}

/* API */
router.post("/generate-month", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ error: "userId required" });

    /* PROFILE */
    const { data: profile } = await supabase
      .from("profiles")
      .select("github, interests")
      .eq("id", userId)
      .maybeSingle();

    if (!profile)
      return res.status(400).json({ error: "Profile not found" });

    if (!profile.github || !profile.interests?.length)
      return res.status(400).json({ error: "Profile incomplete" });

    const primaryRole = profile.interests[0];
    const roleReq = JOB_REQUIREMENTS[primaryRole];

    if (!roleReq)
      return res.status(400).json({ error: "Invalid job role" });

    /* SKILLS */
    const { data: skillRow } = await supabase
  .from("user_skill_snapshot")
  .select("skills")
  .eq("user_id", userId)
  .maybeSingle();

const userSkills = skillRow?.skills;

    if (!userSkills || !Object.keys(userSkills).length)
      return res.status(400).json({ error: "No skills found" });

    /* ROADMAP STATE */
    const { data: row } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let month = 1;

if (row) {
  month = row.current_month || 1;
}

    /* ONLY TOP GAPS */
    const gaps = calculateGaps(userSkills, roleReq).slice(0, 5);

    /* SIMPLIFIED PROMPT */
    const prompt = `
You are a senior ${primaryRole} mentor.

Create a detailed 1-month roadmap to improve these weak skills:

${gaps.map(g =>
  `- ${g.skill} (required ${g.required}, current ${g.current})`
).join("\n")}

Requirements:
- 600-900 words
- Practical tasks only
- Daily breakdown
- Clear WEEK 1, WEEK 2, WEEK 3, WEEK 4 headings

Structure:

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

Mini Project:
Tech Stack:
Outcome:
`;

    /* AI CALL */
    let content;
    let pdfUrl;
    try {
      content = await generateMentorNote(prompt);
     pdfUrl = await generateAndUploadPDF(
  supabase,
  content,
  userId,
  month
);
      console.log("AI length:", content?.length);
    } catch (err) {
      console.error("Gemini error:", err);
      return res.status(500).json({ error: "AI generation failed" });
    }

    /* SOFT VALIDATION */
    if (!content || content.length < 250) {
      return res.status(200).json({
        success: false,
        error: "AI response too short. Please try again."
      });
    }
const nextMonth = month + 1;
    /* SAVE */
    const { error: saveError } = await supabase
      .from("roadmaps")
      .upsert({
        user_id: userId,
        current_month: nextMonth,
        months: {
          ...(row?.months || {}),
          [month]: {
            month,
            role: primaryRole,
            content,
            pdf_url: pdfUrl
          }
        }
      });

    if (saveError)
      return res.status(500).json({ error: "Database save failed" });

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
router.post("/complete-month", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId)
      return res.status(400).json({ error: "userId required" });

    const { data: row } = await supabase
      .from("roadmaps")
      .select("current_month")
      .eq("user_id", userId)
      .single();

    if (!row)
      return res.status(400).json({ error: "Roadmap not found" });

    const nextMonth = row.current_month + 1;

    const { error } = await supabase
      .from("roadmaps")
      .update({ current_month: nextMonth })
      .eq("user_id", userId);

    if (error)
      return res.status(500).json({ error: "Update failed" });

    res.json({
      success: true,
      current_month: nextMonth
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
router.get("/download-pdf/:userId/:month", async (req, res) => {
  try {
    const { userId, month } = req.params;

    const filePath = `${userId}/roadmap-month-${month}.pdf`;

    const { data, error } = await supabase.storage
      .from("roadmaps")   // 👈 bucket name
      .createSignedUrl(filePath, 60); // 60 sec valid

    if (error) {
      return res.status(400).json({ error: "File not found" });
    }

    res.json({ url: data.signedUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Download failed" });
  }
});
module.exports = router;