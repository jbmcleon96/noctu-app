import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

const MEMBER_PRICE_TO_PLAN: Record<string, string> = {
  "price_1TlYvfBprLkwkiEd4eJzkZUU": "starter",
  "price_1TlYvYBprLkwkiEdexU2z1Rl": "elite",
  "price_1TlYvcBprLkwkiEdp4vI7kEP": "vip",
};

const OWNER_PRICE_TO_PLAN: Record<string, string> = {
  "price_1TijO1PnBVGkz85Mnj11TyDM": "basic",
  "price_1TijOtPnBVGkz85Mr0hvLHgg": "pro",
  "price_1TijQsPnBVGkz85M6NfRBYck": "enterprise",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    let event: any;
    try {
      const rawBody = await getRawBody(req);
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email;
      const subscriptionId = session.subscription;

      if (!subscriptionId || !customerEmail) return res.status(200).end();

      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
      const priceId = subscription.items.data[0]?.price?.id;

      if (!priceId) return res.status(200).end();

      // Find user by email in Firestore
      const usersSnap = await db.collection("users").where("email", "==", customerEmail).limit(1).get();
      if (usersSnap.empty) return res.status(200).end();

      const userDoc = usersSnap.docs[0];
      const userData = userDoc.data();

      if (MEMBER_PRICE_TO_PLAN[priceId]) {
        await userDoc.ref.update({
          subscription: MEMBER_PRICE_TO_PLAN[priceId],
          stripeSubscriptionId: subscriptionId,
        });
        console.log(`Updated member ${customerEmail} to ${MEMBER_PRICE_TO_PLAN[priceId]}`);
      } else if (OWNER_PRICE_TO_PLAN[priceId]) {
        await userDoc.ref.update({
          ownerPlan: OWNER_PRICE_TO_PLAN[priceId],
          stripeSubscriptionId: subscriptionId,
        });
        console.log(`Updated owner ${customerEmail} to ${OWNER_PRICE_TO_PLAN[priceId]}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
