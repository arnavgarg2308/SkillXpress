let currentUser;
let mentorId;
let channel;


async function init(){

  const { data } = await supabaseClient.auth.getUser();

  if(!data.user){
    alert("No user logged in");
    return;
  }
  currentUser = data.user;
  await supabaseClient
  .from("profiles")
  .update({
    is_online:true,
    last_seen:new Date()
  })
  .eq("id", currentUser.id);
  await updateUnreadBadge();

  const params = new URLSearchParams(window.location.search);
  mentorId = params.get("mentor");

  await loadMessages();
  startRealtime();
}

/* LOAD ALL MESSAGES */
async function loadMessages(){
  const { data } = await supabaseClient
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${mentorId}),and(sender_id.eq.${mentorId},receiver_id.eq.${currentUser.id})`)
    .order("created_at",{ ascending:true });

  const box = document.getElementById("chatBox");
  box.innerHTML = "";

  (data || []).forEach(msg => {

    const div = document.createElement("div");
    div.classList.add("msg");
if(String(msg.sender_id) === String(currentUser.id)){
  div.classList.add("sent");
}else{
  div.classList.add("received");
}
console.log("sender:", String(msg.sender_id));
console.log("me:", String(currentUser.id));
    div.innerText = msg.message;
    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
  // ✅ MARK MESSAGES AS READ
await supabaseClient
  .from("messages")
  .update({ is_read: true })
  .eq("receiver_id", currentUser.id)
  .eq("sender_id", mentorId)
  .eq("is_read", false);
  await updateUnreadBadge();
}

/* SEND MESSAGE */
async function sendMessage(){

  const input = document.getElementById("messageInput");
  const text = input.value.trim();

  if(!text) return;

  await supabaseClient.from("messages").insert([
    {
      sender_id: currentUser.id,
      receiver_id: mentorId,
      message: text
    }
  ]);

  input.value = "";
}

/* REALTIME */
function startRealtime(){

  if(channel){
    supabaseClient.removeChannel(channel);
  }

  channel = supabaseClient
    .channel(`chat-${currentUser.id}-${mentorId}`)
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
          (m.sender_id == currentUser.id && m.receiver_id == mentorId) ||
          (m.sender_id == mentorId && m.receiver_id == currentUser.id)
        ){
          appendMessage(m);
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
    .eq("id", currentUser.id);

});
function appendMessage(msg){

  const box = document.getElementById("chatBox");

  const div = document.createElement("div");
  div.classList.add("msg");

  if(String(msg.sender_id) === String(currentUser.id)){
    div.classList.add("sent");
  }else{
    div.classList.add("received");

    // ✅ MARK AS READ (Realtime case)
    supabaseClient
      .from("messages")
      .update({ is_read: true })
      .eq("id", msg.id);
  }

  div.innerText = msg.message;

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  updateUnreadBadge();
}
async function updateUnreadBadge(){

  const { data } = await supabaseClient
    .from("messages")
    .select("id")
    .eq("receiver_id", currentUser.id)
    .eq("is_read", false);

  const count = data?.length || 0;

  if(count > 0){
    document.title = `(${count}) New Messages`;
  } else {
    document.title = "Mentor Chat";
  }
}