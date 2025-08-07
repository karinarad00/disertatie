const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_KEY); 
const bodyParser = require("body-parser");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Procesăm doar evenimentele utile
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Aici poți extrage emailul clientului și ce produs a cumpărat
      const customerEmail = session.customer_email;
      const productId = session.metadata?.productId;

      // Exemplu: actualizează în baza de date
      // updateUserPaymentStatus(customerEmail, productId)

      console.log("Plată finalizată pentru:", customerEmail, productId);
    }

    res.status(200).json({ received: true });
  }
);

module.exports = router;
