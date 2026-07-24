import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { priceId, userType } = req.body

    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId' })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userType: userType || 'member',
      },
      success_url: 'https://noctu.cc/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://noctu.cc/member-tiers',
    })

    return res.status(200).json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return res.status(500).json({ error: error.message || 'Server error' })
  }
}