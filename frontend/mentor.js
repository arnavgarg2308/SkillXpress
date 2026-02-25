async function loadMentors() {

  const { data, error } = await supabaseClient
    .from('mentors')
    .select('*');

  if (error) {
    console.log(error);
    return;
  }

  const container = document.getElementById("mentorList");
  container.innerHTML = "";

  data.forEach(mentor => {

    container.innerHTML += `
      <div class="col-md-4">
        <div class="card p-3 shadow text-center">

          <img src="${mentor.photo}"
            width="80"
            class="rounded-circle mx-auto mb-2">

          <h4>${mentor.name}</h4>

          <p class="text-muted">${mentor.description}</p>

          <button class="btn btn-primary w-100"
            onclick="openChat('${mentor.id}')">
            Chat
          </button>

        </div>
      </div>
    `;
  });
}

function openChat(mentorId){
  window.location.href = `chat.html?mentor=${mentorId}`;
}

loadMentors();