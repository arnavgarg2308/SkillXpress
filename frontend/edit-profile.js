async function loadProfileForEdit() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const { data } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  username.value = data.username || "";
  college.value = data.college || "";
  course.value = data.course || "";
  branch.value = data.branch || "";
  age.value = data.age || "";
}

loadProfileForEdit();
async function updateProfile() {
  const { data: { user } } = await supabaseClient.auth.getUser();

   const { error } = await supabaseClient
    .from("profiles")
    .update({
      username: username.value,
      college: college.value,
      year: year.value,
      course: course.value,
      branch: branch.value,
      age: age.value,
    })
    .eq("id", user.id);

  alert("Profile updated successfully");
  window.location.href = "main.html";
}
