const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const generateMentorNote = require("../utils/gemini");
const JOB_REQUIREMENTS = require("./jobRequirements");

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

    /* 2️⃣ Merge ALL roles */
    let mergedSkills = {};
    roles.forEach(role => {
      const req = JOB_REQUIREMENTS[role];
      if (!req) return;
      Object.entries(req).forEach(([skill, value]) => {
        mergedSkills[skill] = Math.max(mergedSkills[skill] || 0, value);
      });
    });

    /* 3️⃣ Roadmap progress */
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

    /* 4️⃣ Month roadmap */
    const skills = Object.keys(mergedSkills)
      .slice((currentMonth - 1) * 4, currentMonth * 4);

    const roadmap = {
      month: currentMonth,
      phase,
      focus: phase,
      skills,
      tasks: [
        "Daily practice",
        "Hands-on coding",
        "Weekly revision"
      ],
      project:
        phase === "Foundation"
          ? "Mini practice project"
          : phase === "Core Skills"
          ? "Role-specific mini project"
          : phase === "Advanced Projects"
          ? "Major real-world project"
          : "Resume + mock interviews",
      ai_mentor_note: ""
    };

    /* 5️⃣ AI mentor note (≤450 tokens) */
    const prompt = `
Explain this ONE month roadmap briefly in mentor tone.
Max 2–3 lines. Do NOT add new topics.

${JSON.stringify(roadmap)}
    `;
    roadmap.ai_mentor_note = await generateMentorNote(prompt);

    /* 6️⃣ Save */
    await supabase.from("roadmaps").upsert({
      user_id: userId,
      current_month: currentMonth + 1,
      months: {
        ...(row?.months || {}),
        [currentMonth]: roadmap
      }
    });

    res.json({ success: true, roadmap });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Roadmap failed" });
  }
});

module.exports = router;
