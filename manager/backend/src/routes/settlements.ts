import { Router } from 'express'
import { authenticateJWT } from '../middleware/auth.js'
import { requireEdition } from '../middleware/editionGate.js'

const router = Router()

router.use(authenticateJWT)
router.use(requireEdition('tour', 'producer'))

router.get('/venue/:venueId', (req, res) => {
  res.json({ message: 'Get settlement - Coming soon' })
})

router.post('/', (req, res) => {
  res.json({ message: 'Create settlement - Coming soon' })
})

export default router
