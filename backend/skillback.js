const express = require("express");
const cors = require("cors");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const app = express();
app.use(cors());
app.use(express.json());

/* ===== ML HELPERS ===== */

function normalize(value, max = 200) {
  return Math.min(100, Math.round((value / max) * 100));
}

function mlScore({ repos, stars, forks, activity }) {
  return (
    repos * 0.4 +
    stars * 0.3 +
    forks * 0.2 +
    activity * 0.1
  );
}

/* ===== API ===== */

app.get("/skills/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const ghRes = await fetch(
      `https://api.github.com/users/${username}/repos`,
      {
        headers: {
          "User-Agent": "SkillXpress",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
        }
      }
    );

    if (!ghRes.ok) {
      return res.status(404).json({ error: "GitHub user not found" });
    }

    const repos = await ghRes.json();
    let skills = {};

    // ✅ CORRECT LOOP (async-safe)
    for (const repo of repos) {
      if (repo.fork) continue;

      const langRes = await fetch(repo.languages_url, {
        headers: {
          "User-Agent": "SkillXpress",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
        }
      });

      const languages = await langRes.json();

      for (const lang of Object.keys(languages)) {
        if (!skills[lang]) {
          skills[lang] = {
            repos: 0,
            stars: 0,
            forks: 0,
            activity: 0
          };
        }

        skills[lang].repos += 1;
        skills[lang].stars += repo.stargazers_count || 0;
        skills[lang].forks += repo.forks_count || 0;

        const daysOld =
          (Date.now() - new Date(repo.updated_at)) /
          (1000 * 60 * 60 * 24);

        skills[lang].activity += Math.max(0, 30 - daysOld);
      }
    }

    let final = {};
    Object.keys(skills).forEach(lang => {
      final[lang] = normalize(mlScore(skills[lang]));
    });

    if (Object.keys(final).length === 0) {
      final = { "Learning": 20 };
    }

    res.json({
      username,
      skills: final,
      generatedAt: new Date()
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GitHub API error" });
  }
});

/* ===== RENDER START ===== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("✅ Skill ML backend LIVE on Render 🚀")
);
