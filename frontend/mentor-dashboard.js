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

  // 🔥 1️⃣ Get all users jinhone kabhi message bheja
  const { data: allMessages } = await supabaseClient
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", mentor.id);

  const allUsers = [...new Set((allMessages || []).map(m => m.sender_id))];

  if(allUsers.length === 0){
    document.getElementById("userList").innerHTML =
      "<div class='p-3 text-muted'>No chats yet</div>";
    return;
  }

  // 🔥 2️⃣ Get unread counts
  const { data: unread } = await supabaseClient
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", mentor.id)
    .eq("is_read", false);

  const unreadMap = {};
  (unread || []).forEach(m=>{
    unreadMap[m.sender_id] =
      (unreadMap[m.sender_id] || 0) + 1;
  });

  // 🔥 3️⃣ Get user profiles
  const { data: users } = await supabaseClient
    .from("profiles")
    .select("id,username")
    .in("id", allUsers);

  const list = document.getElementById("userList");
  list.innerHTML = "";

  allUsers.forEach(userId => {

    const user = users.find(u => u.id === userId);

    list.innerHTML += `
      <div class="user-item p-3 border-bottom"
        onclick="openChat('${userId}')">
        👤 ${user ? user.username : "User"}
        ${unreadMap[userId] ? 
          `<span style="background:#25D366;
          color:white;
          padding:3px 8px;
          border-radius:20px;
          font-size:12px;">
          ${unreadMap[userId]}
          </span>` : ""}
      </div>
    `;
  });
}

/* OPEN CHAT */
async function openChat(userId){

  selectedUser = userId;

  document.getElementById("chatUserName")
    .innerText = "Chat with User";

  await loadMessages();

  // ✅ MARK READ
  await supabaseClient
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", mentor.id)
    .eq("sender_id", userId)
    .eq("is_read", false);

  loadUsers();

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

  // 🔥 insert + message wapas lo
  const { data, error } = await supabaseClient
    .from("messages")
    .insert([
      {
        sender_id: mentor.id,
        receiver_id: selectedUser,
        message: text
      }
    ])
    .select()
    .single();

  if(error){
    console.log(error);
    return;
  }

  // 🔥 instant UI show (NO RELOAD)
  appendMentorMessage(data);

  input.value = "";
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
        event: "INSERT",
        schema: "public",
        table: "messages"
      },
      payload => {

        const m = payload.new;

        // 🔥 sirf mentor ko bheje gaye messages listen karo
        if(String(m.receiver_id) !== String(mentor.id)) return;

        // ===== CASE 1: current open chat =====
        if(String(selectedUser) === String(m.sender_id)){
          appendMentorMessage(m);
        }

        // ===== CASE 2: dusra user (sidebar counter) =====
        else{
          loadUsers();   // sidebar update
        }
      }
    )
    .subscribe();
}

init();
document.getElementById("mentorMessage")
  .addEventListener("keydown", function(e){
    if(e.key === "Enter"){
      e.preventDefault();
      sendMentorMessage();
    }
});
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