import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { priceId, userType } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://noctu.cc/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://noctu.cc/pricing`,
      client_reference_id: userId,
      metadata: { tier },
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe session error:', err);
    res.status(500).json({ error: err.message });
  }
}