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

  if (profileError || !data || data.length === 0) {
  console.error(profileError);
  return;
}

const profile = data[0];

  document.getElementById("username").innerText = data.username || "-";
  document.getElementById("college").innerText = data.college || "-";
  document.getElementById("course").innerText = data.course || "-";
  document.getElementById("year").innerText = data.year || "-";
  document.getElementById("branch").innerText = data.branch || "-";
  document.getElementById("age").innerText = data.age || "-";
  document.getElementById("github").innerText = data.github || "-";
  document.getElementById("leetcode").innerText = data.leetcode || "-";
  document.getElementById("codechef").innerText = data.codechef || "-";
  document.getElementById("hackerrank").innerText = data.hackerrank || "-";
}

loadUserProfile();
