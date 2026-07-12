import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const coupon = await stripe.coupons.retrieve('KKD2Q6RZ')
    const available = coupon.valid && (coupon.max_redemptions === null || (coupon.times_redeemed < coupon.max_redemptions))
    return res.status(200).json({ available, redeemed: coupon.times_redeemed, max: coupon.max_redemptions })
  } catch (err) {
    return res.status(200).json({ available: false, redeemed: 0, max: 3 })
  }
}
