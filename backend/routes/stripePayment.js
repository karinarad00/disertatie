const express = require("express");
const Stripe = require("stripe");
const bodyParser = require("body-parser");

const router = express.Router();

const stripe = Stripe(process.env.STRIPE_KEY);

// Funcție fake pentru actualizat DB (înlocuiește cu implementarea ta)
async function markUserAsPaid(userId, product) {
  console.log(`User ${userId} a platit pentru produsul: ${product}`);
  // TODO: updatează în baza ta de date, de ex:
  // await User.updateOne({ _id: userId }, { $set: { hasPaidFor: product } });
}

// Creare sesiune Checkout
router.post("/create-checkout-session", async (req, res) => {
  const { userId, priceId } = req.body;

  if (!userId || !priceId) {
    return res.status(400).json({ error: "Lipsește userId sau priceId" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription", // sau 'payment' dacă e plată unică
      success_url: `http://localhost:3000/plata-finalizata?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/plata-anulata`,
      metadata: {
        userId,
        product: priceId,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la crearea sesiunii Stripe" });
  }
});

// Webhook Stripe (configurează endpoint-ul webhook în Stripe Dashboard)
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = "whsec_YOUR_ENDPOINT_SECRET"; // pune webhook secret

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.metadata.userId;
      const product = session.metadata.product;

      markUserAsPaid(userId, product)
        .then(() => {
          console.log("Plata marcată în baza de date.");
        })
        .catch((err) => {
          console.error("Eroare la marcat plata:", err);
        });
    }

    res.status(200).json({ received: true });
  }
);

module.exports = router;
