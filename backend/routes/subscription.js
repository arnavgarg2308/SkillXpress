const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

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

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
});

module.exports = router;