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

// Force Vercel's Node runtime to hand us the raw body ourselves —
// this removes any dependency on automatic body parsing, which is the
// most common cause of "Missing priceId" even when the frontend sends it.
export const config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const raw = await readRawBody(req);

    // Temporary diagnostic log — check Vercel function logs if this still 400s.
    console.log('create-checkout-session raw body:', raw);

    let body: any = {};
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch (parseErr) {
        console.error('Failed to parse request body as JSON:', raw);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const { priceId, userType } = body || {};

    if (!priceId) {
      console.error('priceId missing from parsed body:', body);
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