const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const generateMentorNote = require("../utils/gemini");
const JOB_REQUIREMENTS = require("./jobback");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ---------- helpers ---------- */

function normalizeSkill(s) {
  return s.toLowerCase().replace(/\W/g, "");
}

function calculateGaps(userSkills, roleReqs) {
  const u = {};
  Object.entries(userSkills).forEach(([k, v]) => {
    u[normalizeSkill(k)] = v;
  });

  return Object.entries(roleReqs)
    .map(([skill, required]) => {
      const current = u[normalizeSkill(skill)] || 0;
      return { skill, current, required, gap: required - current };
    })
    .filter(x => x.gap > 0)
    .sort((a, b) => b.gap - a.gap);
}

/* ---------- API ---------- */

router.post("/generate-month", async (req, res) => {
  try {
    const { userId, userSkills } = req.body;
    if (!userId || !userSkills)
      return res.status(400).json({ error: "Missing data" });

    /* roles */
    const { data: profile } = await supabase
      .from("profiles")
      .select("interests")
      .eq("id", userId)
      .single();

    const roles = profile?.interests || [];
    if (!roles.length)
      return res.status(400).json({ error: "No roles selected" });

    const primaryRole = roles[0];
    const secondaryRoles = roles.slice(1);

    const roleReq = JOB_REQUIREMENTS[primaryRole];
    if (!roleReq)
      return res.status(400).json({
        error: `Job requirements not found for role: ${primaryRole}`
      });

    /* progress */
    const { data: row } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .single();

    const month = row?.current_month || 1;

    /* gap analysis */
    const gaps = calculateGaps(userSkills, roleReq).slice(0, 4);

    /* AI PROMPT (GOOD ONE) */
    const prompt = `
You are a senior software career mentor.

Target role: ${primaryRole}
Secondary roles: ${secondaryRoles.join(", ") || "None"}
Month number: ${month}

Skill gaps:
${JSON.stringify(gaps, null, 2)}

Create a PRACTICAL ONE-MONTH roadmap.

FORMAT:
Month Goal (2 lines)

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
- Stack
- Outcome

Explain how this month moves the user closer to a job.

No filler. Be realistic.`;

    const content = await generateMentorNote(prompt);

    /* save */
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

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Roadmap failed" });
  }
});

module.exports = router;
