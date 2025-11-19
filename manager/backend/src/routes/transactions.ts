import { Router } from 'express'
import { authenticateJWT } from '../middleware/auth.js'

const router = Router()

router.use(authenticateJWT)

router.get('/', (req, res) => {
  res.json({ transactions: [] })
})

router.get('/unmatched', (req, res) => {
  res.json({ transactions: [] })
})

export default router
