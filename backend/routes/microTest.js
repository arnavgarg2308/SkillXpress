 const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ================= SUBMIT MICRO TEST ================= */
router.post("/submit", async (req, res) => {
  try {
    const { user_id, answers, time_taken_seconds } = req.body;

    const { data: questions, error: qErr } = await supabase
      .from("micro_test_questions")
      .select("id, section, correct_option");

    if (qErr) throw qErr;

    let scores = {
      attention: 0,
      memory: 0,
      logic: 0,
      decision: 0,
      behaviour: 0
    };

    let correct = 0;

    questions.forEach(q => {
      if (answers[q.id] !== undefined) {
        if (answers[q.id] === q.correct_option) {
          correct++;
          scores[q.section]++;
        }
      }
    });

   const totalQuestions = questions.length;


    const brainEfficiency =
      totalQuestions === 0
        ? 0
        : Math.round((correct / totalQuestions) * 100);
    const { error: insertErr } = await supabase
      .from("micro_test_results")
      .insert([
        {
          user_id,
          attention_score: scores.attention,
          memory_score: scores.memory,
          logic_score: scores.logic,
          decision_score: scores.decision,
          behaviour_score: scores.behaviour,
          brain_efficiency: brainEfficiency,
          total_questions: totalQuestions,
          correct_answers: correct,
          time_taken_seconds
        }
      ]);

    if (insertErr) throw insertErr;

    res.json({ success: true, brainEfficiency, scores });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Micro test submit failed" });
  }
});
/* ================= GET LATEST ANALYSIS ================= */
router.get("/analysis/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("micro_test_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis fetch failed" });
  }
});


module.exports = router;
