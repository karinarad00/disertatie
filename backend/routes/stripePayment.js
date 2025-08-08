const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const bodyParser = require("body-parser");
const { executeQuery } = require("../db");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Mapping produse -> priceId și productId (din .env)
const products = {
  analiza_cv: {
    priceId: process.env.PRICE_ANALIZA_CV,
    productId: process.env.PRODUCT_ANALIZA_CV,
    successUrl: process.env.SUCCESS_URL,
    cancelUrl: process.env.CANCEL_URL,
  },
  primeste_sugestii: {
    priceId: process.env.PRICE_SUGESTII,
    productId: process.env.PRODUCT_SUGESTII,
    successUrl: process.env.SUCCESS_URL,
    cancelUrl: process.env.CANCEL_URL,
  },
};

// Creează sesiune Checkout
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { userId, prodType } = req.body;

    if (!userId || !prodType) {
      return res.status(400).json({ error: "Lipsește userId sau tip produs" });
    }

    const product = products[prodType];
    if (!product) {
      return res.status(400).json({ error: "Tip produs invalid" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: product.priceId, quantity: 1 }],
      mode: "subscription",
      success_url: product.successUrl,
      cancel_url: product.cancelUrl,
      metadata: {
        userId,
        productId: product.productId,
        prodType,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Eroare creare sesiune Stripe:", err);
    res.status(500).json({ error: "Eroare la crearea sesiunii" });
  }
});

// Webhook pentru evenimente Stripe
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const productId = session.metadata?.productId;

      if (!userId || !productId) {
        console.error("Lipsește userId sau productId în metadata");
        return res.status(400).send("Metadata incompletă");
      }

      try {
        if (productId === process.env.PRODUCT_ANALIZA_CV) {
          await executeQuery(
            "UPDATE utilizator SET subscriptie_cv = 1 WHERE id = :id",
            { id: userId }
          );
          console.log(`Utilizator ${userId} a cumpărat Analiza CV`);
        } else if (productId === process.env.PRODUCT_SUGESTII) {
          await executeQuery(
            "UPDATE utilizator SET subscriptie_recomandari = 1 WHERE id = :id",
            { id: userId }
          );
          console.log(`Utilizator ${userId} a cumpărat Sugestii`);
        }
      } catch (dbErr) {
        console.error("Eroare DB:", dbErr);
      }
    }

    res.json({ received: true });
  }
);

// Preluare tipProdus pentru redirect dupa success
router.get("/session/:sessionId", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId
    );
    console.log("Sesiune Stripe:", session);
    const prodType = session.metadata?.prodType || null;
    res.json({ prodType });
  } catch (err) {
    console.error("Eroare la recuperare sesiune Stripe:", err);
    res.status(500).json({ error: "Nu s-a putut recupera sesiunea" });
  }
});

module.exports = router;
