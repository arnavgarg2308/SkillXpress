const express = require("express");
const cors = require("cors");

// node-fetch fix
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
        }
      }
    );

    if (!ghRes.ok) {
      return res.status(404).json({ error: "GitHub user not found" });
    }

    const repos = await ghRes.json();

    let skills = {};

    repos.forEach(repo => {
      if (!repo.language) return;

      if (!skills[repo.language]) {
        skills[repo.language] = {
          repos: 0,
          stars: 0,
          forks: 0,
          activity: 0
        };
      }

      skills[repo.language].repos++;
      skills[repo.language].stars += repo.stargazers_count || 0;
      skills[repo.language].forks += repo.forks_count || 0;

      const daysOld =
        (Date.now() - new Date(repo.updated_at)) /
        (1000 * 60 * 60 * 24);

      skills[repo.language].activity += Math.max(0, 30 - daysOld);
    });

    let final = {};
    Object.keys(skills).forEach(lang => {
      final[lang] = normalize(mlScore(skills[lang]));
    });

    if (Object.keys(final).length === 0) {
      return res.json({
        username,
        skills: { "No Data": 0 },
        generatedAt: new Date()
      });
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
