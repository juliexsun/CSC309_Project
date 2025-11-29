// server/routes/stripe.js
const express = require("express");
const router = express.Router();
const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // DO NOT expose this key in frontend

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount, currency = "cad", redirect_url } = req.body;
    const encodedReturn = encodeURIComponent(redirect_url);

    if (!amount || typeof amount !== "number" || amount < 50) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Donation",
              description: "Support our project",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${redirect_url}?donation=success`,
      cancel_url: `${redirect_url}?donation=cancel`,
      
      metadata: {
        donation: "true",
      },
    });

    console.log(req.json);
    // THIS is what Stripe now expects
    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating checkout session" });
  }
});


module.exports = router;
