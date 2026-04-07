const API = "https://api.skillxpress.me";
async function pay(amount, plan, days){

  const { data:{user} } = await supabaseClient.auth.getUser();
  const orderRes = await fetch(`${API}/subscription/create-order`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ amount })
  });

  const order = await orderRes.json();

  const options = {
    key: "rzp_live_SLHKbzoN2sNWCD",
    amount: order.amount,
    currency: "INR",
    order_id: order.id,
    handler: async function(response){
      try {
        const verifyRes = await fetch(`${API}/subscription/verify`,{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            ...response,
            user_id:user.id,
            plan:plan,
            days:days
          })
        });

        const verifyData = await verifyRes.json();
        console.log('Subscription verify response:', verifyData);

        if (!verifyRes.ok) {
          alert('Subscription verification failed. Check console for details.');
          return;
        }
      } catch (err) {
        console.error('Subscription verify request failed:', err);
        alert('Subscription verification request failed. Check console for details.');
        return;
      }

      location.reload();
    }
  };

  new Razorpay(options).open();
}