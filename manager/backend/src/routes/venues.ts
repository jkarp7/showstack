import { Router } from 'express'
import { authenticateJWT } from '../middleware/auth.js'
import { requireEdition } from '../middleware/editionGate.js'

const router = Router()

router.use(authenticateJWT)
router.use(requireEdition('tour', 'producer'))

router.get('/project/:projectId', (req, res) => {
  res.json({ venues: [] })
})

router.post('/', (req, res) => {
  res.json({ message: 'Create venue stop - Coming soon' })
})

export default router
