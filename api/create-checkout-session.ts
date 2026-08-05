import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Map of allowed tier price IDs — keeps requests locked to real Noctu tiers
const TIER_PRICE_IDS: Record<string, string> = {
  starter: 'price_1TlYvfBprLkwkiEd4eJzkZUU',
  elite: 'price_1TlYvYBprLkwkiEdexU2z1Rl',
  vip: 'price_1TlYvcBprLkwkiEdp4vI7kEP',
};

const VALID_PRICE_IDS = new Set(Object.values(TIER_PRICE_IDS));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // req.body is already parsed JSON on Vercel by default —
    // but guard against string bodies just in case.
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const { priceId, userType } = body || {};

    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId' });
    }

    if (!VALID_PRICE_IDS.has(priceId)) {
      return res.status(400).json({ error: `Unrecognized priceId: ${priceId}` });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.PUBLIC_URL || 'https://noctu.cc'}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_URL || 'https://noctu.cc'}/checkout-cancelled`,
      metadata: {
        userType: userType || 'member',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout session error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}