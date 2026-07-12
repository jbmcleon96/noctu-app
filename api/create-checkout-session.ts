import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    console.log('checkout body:', req.body)
    const { priceId, userType, couponCode } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "Missing priceId" });
    }

    const baseUrl = process.env.FRONTEND_BASE_URL || "https://noctu.cc";

    const sessionParams: any = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: userType === "owner"
        ? `${baseUrl}/owner-dashboard?success=true`
        : `${baseUrl}/dashboard?success=true`,
      cancel_url: userType === "owner"
        ? `${baseUrl}/owner-signup`
        : `${baseUrl}/member-tiers`,
    };

    if (couponCode) {
      sessionParams.discounts = [{ coupon: couponCode }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });

  } catch (err: any) {
    console.error("Checkout error:", err?.message || err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
