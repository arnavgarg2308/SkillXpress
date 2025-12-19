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

  document.getElementById("username").innerText = profile.username || "-";
document.getElementById("college").innerText = profile.college || "-";
document.getElementById("course").innerText = profile.course || "-";
document.getElementById("year").innerText = profile.year || "-";
document.getElementById("branch").innerText = profile.branch || "-";
document.getElementById("age").innerText = profile.age || "-";
document.getElementById("github").innerText = profile.github || "-";
document.getElementById("leetcode").innerText = profile.leetcode || "-";
document.getElementById("codechef").innerText = profile.codechef || "-";
document.getElementById("hackerrank").innerText = profile.hackerrank || "-";

}

loadUserProfile();
