import { Router } from 'express'
import { authenticateJWT } from '../middleware/auth.js'
import { requireEdition } from '../middleware/editionGate.js'

const router = Router()

router.use(authenticateJWT)
router.use(requireEdition('pm', 'producer'))

router.get('/project/:projectId', (req, res) => {
  res.json({ budgets: [] })
})

router.post('/', (req, res) => {
  res.json({ message: 'Create budget - Coming soon' })
})

export default router
