import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const PORT = 5000;

/* ======================
   CODING CONTESTS (LIVE)
   Source: Codeforces API
====================== */
async function fetchCodingContests() {
  const res = await fetch("https://codeforces.com/api/contest.list");
  const data = await res.json();

  return data.result
    .filter(c => c.phase === "BEFORE")
    .slice(0, 30)
    .map(c => ({
      category: "Coding Contest",
      title: c.name,
      timeline: new Date(c.startTimeSeconds * 1000).toDateString(),
      link: "https://codeforces.com/contests"
    }));
}

/* ======================
   HACKATHON PLATFORMS
   (LIVE REDIRECTION)
====================== */
function fetchHackathonPlatforms() {
  return [
    { name: "Devpost", link: "https://devpost.com/hackathons" },
    { name: "Major League Hacking (MLH)", link: "https://mlh.io/seasons/current/events" },
    { name: "Devfolio", link: "https://devfolio.co/hackathons" },
    { name: "Unstop", link: "https://unstop.com/hackathons" },
    { name: "HackerEarth", link: "https://www.hackerearth.com/challenges/" },
    { name: "HackerRank", link: "https://www.hackerrank.com/contests" },
    { name: "Kaggle", link: "https://www.kaggle.com/competitions" },
    { name: "Google Developer Events", link: "https://developers.google.com/events" },
    { name: "Microsoft Learn Events", link: "https://learn.microsoft.com/events" },
    { name: "IEEE Student Competitions", link: "https://students.ieee.org/competitions/" },
    { name: "ACM ICPC", link: "https://icpc.global" },
    { name: "Smart India Hackathon", link: "https://www.sih.gov.in" },
    { name: "Hack2Skill", link: "https://hack2skill.com/hackathons" },
    { name: "TechGig", link: "https://www.techgig.com/challenges" },
    { name: "Coding Ninjas Events", link: "https://www.codingninjas.com/events" }
  ].map(p => ({
    category: "Hackathon",
    title: `${p.name} – Live Hackathons`,
    timeline: "Ongoing",
    link: p.link
  }));
}

/* ======================
   COURSES (FREE + PAID)
   OFFICIAL PLATFORMS
====================== */
function fetchCourses() {
  return [
    { title: "AWS Skill Builder", link: "https://explore.skillbuilder.aws" },
    { title: "freeCodeCamp", link: "https://www.freecodecamp.org" },
    { title: "GeeksforGeeks Courses", link: "https://www.geeksforgeeks.org/courses" },
    { title: "HackerRank Certifications", link: "https://www.hackerrank.com/skills-verification" },
    { title: "CodeChef Learning", link: "https://www.codechef.com/learn" },
    { title: "LeetCode Study Plans", link: "https://leetcode.com/studyplan" },
    { title: "Google Cloud Skills Boost", link: "https://www.cloudskillsboost.google" }
  ].map(c => ({
    category: "Course",
    title: c.title,
    timeline: "Self-paced",
    link: c.link
  }));
}

/* ======================
   PROGRAMS
====================== */
function fetchPrograms() {
  return [
    {
      category: "Program",
      title: "Google Summer of Code (GSoC)",
      timeline: "Feb – April",
      link: "https://summerofcode.withgoogle.com"
    },
    {
      category: "Program",
      title: "Outreachy Internship",
      timeline: "May–Aug / Dec–Mar",
      link: "https://www.outreachy.org"
    }
  ];
}

/* ======================
   MAIN API
====================== */
app.get("/api/opportunities", async (req, res) => {
  try {
    const contests = await fetchCodingContests();
    const hackathons = fetchHackathonPlatforms();
    const courses = fetchCourses();
    const programs = fetchPrograms();

    res.json({
      total:
        contests.length +
        hackathons.length +
        courses.length +
        programs.length,
      opportunities: [
        ...contests,
        ...hackathons,
        ...courses,
        ...programs
      ]
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to load opportunities" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Opportunities Engine running on http://localhost:${PORT}`)
);