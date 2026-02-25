let mentor;
let selectedUser = null;
let chatChannel = null;

async function init(){

  const { data } = await supabaseClient.auth.getUser();

  if(!data.user){
    window.location.href="index.html";
    return;
  }

  mentor = data.user;
  await supabaseClient
  .from("profiles")
  .update({
    is_online:true,
    last_seen:new Date()
  })
  .eq("id", mentor.id);

  await loadUsers();
}

/* LOAD USERS */
async function loadUsers(){

  const { data } = await supabaseClient
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", mentor.id);
    

  const uniqueUsers = [...new Set((data || []).map(x => x.sender_id))];

  if(uniqueUsers.length === 0){
    document.getElementById("userList").innerHTML =
      "<div class='p-3 text-muted'>No chats yet</div>";
    return;
  }

  // 🔥 profiles table se username lao
  const { data: users } = await supabaseClient
    .from("profiles")
   .select("id,username,is_online")
    .in("id", uniqueUsers);

  const list = document.getElementById("userList");
  list.innerHTML = "";

  uniqueUsers.forEach(userId => {

    // 🔥 id match karke user nikalo
    const user = users.find(u => u.id === userId);

    list.innerHTML += `
      <div class="user-item p-3 border-bottom"
        onclick="openChat('${userId}')">
        👤 ${user ? user.username : "User"}
${user?.is_online ? "🟢 Online" : "⚫ Offline"}
      </div>
    `;
  });
}

/* OPEN CHAT */
async function openChat(userId){

  selectedUser = userId;

  document.getElementById("chatUserName")
    .innerText = "Chat with User";

  appendMentorMessage({
  sender_id: mentor.id,
  message: text
});

  startRealtime();
}

/* LOAD MESSAGES */
async function loadMessages(){
  if(!selectedUser) return;

  const { data } = await supabaseClient
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${mentor.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${mentor.id})`)
    .order("created_at",{ ascending:true });

  const box = document.getElementById("mentorChatBox");
  box.innerHTML = "";

  (data || []).forEach(msg => {

    const div = document.createElement("div");
    div.classList.add("msg");

    if(String(msg.sender_id) === String(mentor.id)){
  div.classList.add("sent");
}else{
  div.classList.add("received");
}

    div.innerText = msg.message;
    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
  
}

/* SEND MESSAGE */
async function sendMentorMessage(){

  const input = document.getElementById("mentorMessage");
  const text = input.value.trim();

  if(!text || !selectedUser) return;

  await supabaseClient.from("messages").insert([
    {
      sender_id: mentor.id,
      receiver_id: selectedUser,
      message: text
    }
  ]);

  input.value = "";
  await loadMessages();
}

/* REALTIME */
function startRealtime(){

  if(chatChannel){
    supabaseClient.removeChannel(chatChannel);
  }

  chatChannel = supabaseClient
    .channel(`mentor-live-${mentor.id}`)
    .on(
      "postgres_changes",
      {
        event:"INSERT",
        schema:"public",
        table:"messages"
      },
      payload => {

        const m = payload.new;

        if(
          (m.sender_id == mentor.id && m.receiver_id == selectedUser) ||
          (m.sender_id == selectedUser && m.receiver_id == mentor.id)
        ){
         appendMentorMessage(m);
        }
      }
    )
    .subscribe();
}

init();
window.addEventListener("beforeunload", async () => {

  await supabaseClient
    .from("profiles")
    .update({
      is_online:false,
      last_seen:new Date()
    })
    .eq("id", mentor.id);

});
function appendMentorMessage(msg){

  const box = document.getElementById("mentorChatBox");

  const div = document.createElement("div");
  div.classList.add("msg");

  if(String(msg.sender_id) === String(mentor.id)){
    div.classList.add("sent");
  }else{
    div.classList.add("received");
  }

  div.innerText = msg.message;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}