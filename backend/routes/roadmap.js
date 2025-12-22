const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const generateMentorNote = require("../utils/gemini");
const JOB_REQUIREMENTS = require("./jobback");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ===== PHASE SYSTEM ===== */
const PHASES = [
  { name: "Foundation", months: 2 },
  { name: "Core Skills", months: 3 },
  { name: "Advanced Projects", months: 2 },
  { name: "Job Preparation", months: 1 }
];

function getPhase(month) {
  let sum = 0;
  for (let p of PHASES) {
    sum += p.months;
    if (month <= sum) return p.name;
  }
  return "Completed";
}

/* ===== HELPERS ===== */
function normalizeRole(role) {
  return role.trim().toUpperCase();
}

function calculateGaps(userSkills, roleReqs) {
  return Object.entries(roleReqs)
    .map(([skill, required]) => ({
      skill,
      current: userSkills[skill] || 0,
      required,
      gap: required - (userSkills[skill] || 0)
    }))
    .filter(s => s.gap > 0)
    .sort((a, b) => b.gap - a.gap);
}

/* ===== API ===== */
router.post("/generate-month", async (req, res) => {
  try {
    const { userId, userSkills = {} } = req.body;

    /* Roles */
    const { data: profile } = await supabase
      .from("profiles")
      .select("interests")
      .eq("id", userId)
      .single();

    const roles = profile?.interests || [];
    if (!roles.length) {
      return res.status(400).json({ error: "No roles selected" });
    }

    const primaryRoleRaw = roles[0];
    const primaryRole = normalizeRole(primaryRoleRaw);
    const secondaryRoles = roles.slice(1).map(normalizeRole);

    if (!JOB_REQUIREMENTS[primaryRole]) {
      return res.status(400).json({
        error: "Job requirements not found for role: " + primaryRoleRaw
      });
    }

    /* Progress */
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

    /* Gap-based focus */
    const gaps = calculateGaps(
      userSkills,
      JOB_REQUIREMENTS[primaryRole]
    );

    const focusSkills = gaps.slice(0, 3);

    /* AI PROMPT */
    const prompt = `
You are a senior career mentor.

Primary role: ${primaryRoleRaw}
Secondary roles: ${secondaryRoles.join(", ") || "None"}

Month: ${currentMonth}
Phase: ${phase}

User skills:
${JSON.stringify(userSkills, null, 2)}

Skill gaps (priority):
${JSON.stringify(focusSkills, null, 2)}

Create a DETAILED ONE-MONTH ROADMAP.

FORMAT:
Month Objective
Week 1 (topics, daily practice, outcome)
Week 2
Week 3
Week 4
Mini Project (idea, stack, proof)
Explain how this month moves user closer to ${primaryRoleRaw}.

Practical. Honest. Job-ready.
`;

    const content = await generateMentorNote(prompt);

    /* Save */
    await supabase.from("roadmaps").upsert({
      user_id: userId,
      current_month: currentMonth + 1,
      months: {
        ...(row?.months || {}),
        [currentMonth]: {
          month: currentMonth,
          phase,
          primaryRole: primaryRoleRaw,
          content
        }
      }
    });

    res.json({
      success: true,
      roadmap: {
        month: currentMonth,
        phase,
        content
      }
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Roadmap failed" });
  }
});

module.exports = router;
