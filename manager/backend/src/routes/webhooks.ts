import { Router } from 'express'

const router = Router()

// Plaid webhooks
router.post('/plaid', (req, res) => {
  // TODO: Implement Plaid webhook handling
  res.json({ received: true })
})

// Stripe webhooks
router.post('/stripe', (req, res) => {
  // TODO: Implement Stripe webhook handling
  res.json({ received: true })
})

export default router
