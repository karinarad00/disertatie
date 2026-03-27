const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const bodyParser = require("body-parser");
const { executeQuery } = require("../db");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// PRODUSE
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
  promovare_job: {
    priceId: process.env.PRICE_PROMOVARE,
    productId: process.env.PRODUCT_PROMOVARE,
    successUrl: process.env.SUCCESS_URL,
    cancelUrl: process.env.CANCEL_URL,
  },
  candidate_match: {
    priceId: process.env.PRICE_MATCH,
    productId: process.env.PRODUCT_MATCH,
    successUrl: process.env.SUCCESS_URL,
    cancelUrl: process.env.CANCEL_URL,
  },
};

// CREATE CHECKOUT SESSION
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { userId, prodType, jobId } = req.body;

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

      success_url: `${product.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: product.cancelUrl,

      subscription_data: {
        metadata: {
          userId,
          productId: product.productId,
          jobId: jobId || null,
        },
      },

      metadata: {
        userId,
        productId: product.productId,
        prodType,
        jobId: jobId || null,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Eroare creare sesiune Stripe:", err);
    res.status(500).json({ error: "Eroare la crearea sesiunii" });
  }
});

// WEBHOOK
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook Stripe error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // PAYMENT COMPLETED
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const userId = session.metadata?.userId;
        const productId = session.metadata?.productId;
        const jobId = session.metadata?.jobId;

        if (productId === process.env.PRODUCT_ANALIZA_CV) {
          await executeQuery(
            `UPDATE utilizator SET subscriptie_cv = 1 WHERE id_utilizator = :id`,
            { id: userId },
            { autoCommit: true },
          );
          console.log(`Analiza CV activă pentru user ${userId}`);
        } else if (productId === process.env.PRODUCT_SUGESTII) {
          await executeQuery(
            `UPDATE utilizator SET subscriptie_recomandari = 1 WHERE id_utilizator = :id`,
            { id: userId },
            { autoCommit: true },
          );
          console.log(`Sugestii active pentru user ${userId}`);
        } else if (productId === process.env.PRODUCT_PROMOVARE && jobId) {
          await executeQuery(
            `UPDATE job SET promoted = 1 WHERE id_job = :jobId`,
            { jobId: Number(jobId) },
            { autoCommit: true },
          );
          console.log(`Promovare activă pentru job ${jobId}`);
        } else if (productId === process.env.PRODUCT_MATCH) {
          await executeQuery(
            `UPDATE utilizator SET subscriptie_angajatori = 1 WHERE id_utilizator = :id`,
            { id: userId },
            { autoCommit: true },
          );
          console.log(`Candidate Match activ pentru user ${userId}`);
        }
      }

      // SUBSCRIPTION CANCELED
      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;

        const userId = subscription.metadata?.userId;
        const productId = subscription.metadata?.productId;
        const jobId = subscription.metadata?.jobId;

        if (productId === process.env.PRODUCT_PROMOVARE && jobId) {
          await executeQuery(
            `UPDATE job SET promoted = 0 WHERE id_job = :jobId`,
            { jobId: Number(jobId) },
            { autoCommit: true },
          );
          console.log(`Promovare oprită pentru job ${jobId}`);
        }

        if (productId === process.env.PRODUCT_MATCH) {
          await executeQuery(
            `UPDATE utilizator SET subscriptie_angajatori = 0 WHERE id_utilizator = :id`,
            { id: userId },
            { autoCommit: true },
          );
          console.log(`Candidate Match dezactivat pentru user ${userId}`);
        }
      }
    } catch (err) {
      console.error("Eroare procesare webhook DB:", err);
    }

    res.json({ received: true });
  },
);

// GET SESSION (pentru success page)
router.get("/session/:sessionId", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId,
    );
    const prodType = session.metadata?.prodType || null;
    res.json({ prodType });
  } catch (err) {
    console.error("Eroare recuperare sesiune Stripe:", err);
    res.status(500).json({ error: "Nu s-a putut recupera sesiunea" });
  }
});

module.exports = router;
