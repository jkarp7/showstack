import { Router } from 'express'
import { authenticateJWT } from '../middleware/auth.js'

const router = Router()

router.use(authenticateJWT)

// Create Plaid Link token
router.post('/link/token', (req, res) => {
  res.json({ message: 'Plaid Link token - Coming soon' })
})

// Exchange public token for access token
router.post('/link/exchange', (req, res) => {
  res.json({ message: 'Exchange token - Coming soon' })
})

// Sync transactions
router.post('/sync', (req, res) => {
  res.json({ message: 'Sync transactions - Coming soon' })
})

export default router
