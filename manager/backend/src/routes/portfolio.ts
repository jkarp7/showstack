import { Router } from 'express'
import { authenticateJWT } from '../middleware/auth.js'
import { requireEdition } from '../middleware/editionGate.js'

const router = Router()

router.use(authenticateJWT)
router.use(requireEdition('producer'))

router.get('/', (req, res) => {
  res.json({ message: 'Portfolio overview - Coming soon' })
})

router.get('/inventory', (req, res) => {
  res.json({ inventory: [] })
})

export default router
