const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { nanoid } = require("nanoid");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* CREATE ORDER */
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR"
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Order creation failed" });
  }
});

/* VERIFY PAYMENT */
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      plan,
      days
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    const end = new Date();
    end.setDate(end.getDate() + days);

    await supabase
      .from("profiles")
      .update({
        is_premium: true,
        plan_type: plan,
        subscription_end: end
      })
      .eq("id", user_id);

    // Handle referrals
    const { data: referralData } = await supabase
      .from("referrals")
      .select("referrer_id")
      .eq("referred_user_id", user_id)
      .eq("subscription_taken", false)
      .single();

    if (referralData) {
      // Update the referral record
      await supabase
        .from("referrals")
        .update({
          subscription_taken: true,
          subscription_confirmed_at: new Date().toISOString()
        })
        .eq("referred_user_id", user_id);

      // Check if referrer has 5 successful referrals
      const { data: referrerReferrals } = await supabase
        .from("referrals")
        .select("id")
        .eq("referrer_id", referralData.referrer_id)
        .eq("subscription_taken", true);

      if (referrerReferrals && referrerReferrals.length >= 5) {
        // Check if reward already claimed
        const { data: claimedReferrals } = await supabase
          .from("referrals")
          .select("id")
          .eq("referrer_id", referralData.referrer_id)
          .eq("claimed_reward", true);

        const claimedCount = claimedReferrals ? claimedReferrals.length : 0;
        const eligibleRewards = Math.floor(referrerReferrals.length / 5) - claimedCount;

        if (eligibleRewards > 0) {
          // Add ₹59 to referral_balance
          const { data: currentBalance } = await supabase
            .from("profiles")
            .select("referral_balance")
            .eq("id", referralData.referrer_id)
            .single();

          const newBalance = (currentBalance?.referral_balance || 0) + 59;
          await supabase
            .from("profiles")
            .update({ referral_balance: newBalance })
            .eq("id", referralData.referrer_id);

          // Mark 5 referrals as claimed
          const referralsToClaim = referrerReferrals.slice(claimedCount * 5, (claimedCount + eligibleRewards) * 5);
          for (const ref of referralsToClaim) {
            await supabase
              .from("referrals")
              .update({ claimed_reward: true })
              .eq("id", ref.id);
          }
        }
      }
    }

    res.json({ success: true, referralUpdated: !!referralData, referrerId: referralData?.referrer_id || null });

  } catch (err) {
    console.log("Subscription verify error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

module.exports = router;