const express = require("express");
const router = express.Router();
const stripe = require("../stripe");
const { getUserFromToken } = require("../utils/getUser");
const supabase = require('../supabaseClient');

router.post("/create-checkout", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { plan } = req.body;
    let priceId;
    if (plan === "premium") {
      priceId = process.env.STRIPE_PRICE_PREMIUM;
    } else if (plan === "vip") {
      priceId = process.env.STRIPE_PRICE_VIP;
    } else {
      return res.status(400).json({ error: "Invalid plan" });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.BASE_URL}/index.html?success=true`,
      cancel_url: `${process.env.BASE_URL}/index.html?canceled=true`,
      metadata: {
        user_id: user.id,
        plan: plan
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
        const plan = session.metadata.plan;
        console.log("✅ PAYMENT SUCCESS", session.id);
        const userId = session.metadata.user_id;
        console.log("USER ID:", userId);
        await supabase
        .from("profiles")
        .update({
            plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            stripe_price_id: session.items?.data?.[0]?.price?.id || null
        })
        .eq("id", userId);
    }
    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        await supabase
            .from("profiles")
            .update({ plan: "free" })
            .eq("stripe_subscription_id", subscription.id);
    }
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      console.log("Renewed:", invoice.customer);
    }
    if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object;
        await supabase
            .from("profiles")
            .update({
            plan: "free"
            })
            .eq("stripe_subscription_id", invoice.subscription);
    }
    res.json({ received: true });
});

module.exports = router;