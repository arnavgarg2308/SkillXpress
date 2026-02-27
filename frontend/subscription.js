const API = "https://skillxpress-1.onrender.com";
async function pay(amount, plan, days){

  const { data:{user} } = await supabaseClient.auth.getUser();
  const orderRes = await fetch(`${API}/subscription/create-order`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ amount })
  });

  const order = await orderRes.json();

  const options = {
    key: "RAZORPAY_KEY_ID",
    amount: order.amount,
    currency: "INR",
    order_id: order.id,
    handler: async function(response){

      await fetch(`${API}/subscription/verify`,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          ...response,
          user_id:user.id,
          plan:plan,
          days:days
        })
      });

      location.reload();
    }
  };

  new Razorpay(options).open();
}