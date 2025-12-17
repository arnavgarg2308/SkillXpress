async function loadUserProfile() {
  const { data: { session }, error } =
    await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.user;   // ✅ YAHAN define kiya

  const { data, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error(profileError);
    return;
  }

  document.getElementById("username").innerText = data.username || "-";
  document.getElementById("college").innerText = data.college || "-";
  document.getElementById("course").innerText = data.course || "-";
  document.getElementById("branch").innerText = data.branch || "-";
  document.getElementById("age").innerText = data.age || "-";
}

loadUserProfile();
