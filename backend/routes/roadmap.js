const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const generateMentorNote = require("../utils/gemini");
const JOB_REQUIREMENTS = require("./jobback");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ===== PHASE SYSTEM (JOB READY – 8 MONTHS) ===== */
const PHASES = [
  { name: "Foundation", months: 2 },
  { name: "Core Skills", months: 3 },
  { name: "Advanced Projects", months: 2 },
  { name: "Job Preparation", months: 1 }
];

function getPhase(month) {
  let total = 0;
  for (let p of PHASES) {
    total += p.months;
    if (month <= total) return p.name;
  }
  return "Completed";
}

/* ===== API ===== */
router.post("/generate-month", async (req, res) => {
  try {
    const { userId } = req.body;

    /* 1️⃣ Fetch roles */
    const { data: profile } = await supabase
      .from("profiles")
      .select("interests")
      .eq("id", userId)
      .single();

    const roles = profile?.interests || [];
    if (!roles.length) {
      return res.status(400).json({ error: "No roles selected" });
    }

    /* 2️⃣ Merge ALL role skills */
    let mergedSkills = {};
    roles.forEach(role => {
      const reqSkills = JOB_REQUIREMENTS[role];
      if (!reqSkills) return;
      Object.entries(reqSkills).forEach(([skill, value]) => {
        mergedSkills[skill] = Math.max(mergedSkills[skill] || 0, value);
      });
    });

    /* 3️⃣ Current month */
    const { data: row } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .single();

    const currentMonth = row?.current_month || 1;
    const phase = getPhase(currentMonth);

    if (phase === "Completed") {
      return res.json({ done: true });
    }

    /* 4️⃣ Skills focus for this month */
    const skillsForMonth = Object.keys(mergedSkills)
      .slice((currentMonth - 1) * 4, currentMonth * 4);

    /* 5️⃣ 🔥 AI PROMPT — FULL ROADMAP */
    const prompt = `
You are a senior career mentor.

Create a DETAILED, PRACTICAL roadmap for ONE MONTH ONLY.

Context:
- Target role(s): ${roles.join(", ")}
- Current month: ${currentMonth}
- Phase: ${phase}
- Skills to focus this month: ${skillsForMonth.join(", ")}

Rules:
- Assume the user is a student
- This is part of a long-term (8 month) job preparation
- Do NOT rush topics unrealistically
- React, backend, data skills take multiple months
- Be honest and job-oriented

Output format (MANDATORY):
1. Month goal (2–3 lines)
2. Week 1: topics + daily practice
3. Week 2: topics + daily practice
4. Week 3: topics + daily practice
5. Week 4: topics + daily practice
6. Mini project for this month
7. How this month moves the user closer to a job

Keep the response under 450 tokens.
No emojis. No filler.
`;

    const aiRoadmap = await generateMentorNote(prompt);

    /* 6️⃣ Save */
    await supabase.from("roadmaps").upsert({
      user_id: userId,
      current_month: currentMonth + 1,
      months: {
        ...(row?.months || {}),
        [currentMonth]: {
          month: currentMonth,
          phase,
          roles,
          skills: skillsForMonth,
          content: aiRoadmap
        }
      }
    });

    /* 7️⃣ Respond */
    res.json({
      success: true,
      roadmap: {
        month: currentMonth,
        phase,
        content: aiRoadmap
      }
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Roadmap failed" });
  }
});

module.exports = router;
