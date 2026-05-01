const express = require("express");
const router = express.Router();
const stripe = require("../stripe");
const { getUserFromToken } = require("../utils/getUser");
const supabase = require('../supabaseClient');

router.post("/create-checkout", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `${process.env.BASE_URL}/index.html?success=true`,
      cancel_url: `${process.env.BASE_URL}/index.html?canceled=true`,
      metadata: {
        user_id: user.id
      }
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe error" });
  }
});

router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Payment success
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        console.log("✅ PAYMENT SUCCESS", session.id);
        const userId = session.metadata.user_id;
        console.log("USER ID:", userId);
        await supabase
        .from("profiles")
        .update({
            plan: "premium",
            plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
        .eq("id", userId);
    }
    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        await supabase
            .from("profiles")
            .update({ plan: "free" })
            .eq("stripe_customer_id", subscription.customer);
    }
    res.json({ received: true });
});

module.exports = router;