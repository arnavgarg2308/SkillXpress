const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* =====================================================
   1️⃣ PROJECT FEED (GLOBAL)
   ===================================================== */
app.get("/projects", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        profiles (
          id,
          username,
          email
        ),
        project_likes (
          user_id
        ),
        project_comments (
          id,
          comment,
          user_id,
          created_at
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      projects: data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* =====================================================
   2️⃣ PROJECTS BY USER (PROFILE PAGE)
   ===================================================== */
app.get("/projects/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        project_likes(user_id),
        project_comments(id, comment, user_id, created_at)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      projects: data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* =====================================================
   3️⃣ SEND TEAM REQUEST
   ===================================================== */
app.post("/team-request", async (req, res) => {
  const { project_id, from_user, to_user } = req.body;

  const { error } = await supabase
    .from("project_team_requests")
    .insert({ project_id, from_user, to_user });

  if (error) {
    return res.status(500).json({ success: false });
  }

  res.json({ success: true });
});

/* =====================================================
   4️⃣ ACCEPT TEAM REQUEST
   ===================================================== */
app.post("/team-accept", async (req, res) => {
  const { request_id, project_id, user_id } = req.body;

  await supabase
    .from("project_team_requests")
    .update({ status: "accepted" })
    .eq("id", request_id);

  await supabase
    .from("project_team")
    .insert({ project_id, user_id });

  res.json({ success: true });
});

/* =====================================================
   5️⃣ CHAT: SEND MESSAGE
   ===================================================== */
app.post("/chat/send", async (req, res) => {
  const { from_user, to_user, message } = req.body;

  const { error } = await supabase
    .from("chats")
    .insert({
      from_user,
      to_user,
      message
    });

  if (error) {
    return res.status(500).json({ success: false });
  }

  res.json({ success: true });
});

/* =====================================================
   6️⃣ CHAT: FETCH MESSAGES BETWEEN TWO USERS
   ===================================================== */
app.get("/chat/:userA/:userB", async (req, res) => {
  const { userA, userB } = req.params;

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .or(
      `and(from_user.eq.${userA},to_user.eq.${userB}),
       and(from_user.eq.${userB},to_user.eq.${userA})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    return res.status(500).json({ success: false });
  }

  res.json({
    success: true,
    messages: data
  });
});

/* =====================================================
   SERVER START (RENDER)
   ===================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ SkillXpress backend LIVE on Render");
});
