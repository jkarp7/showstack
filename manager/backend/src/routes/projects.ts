import { Router } from 'express'
import { authenticateJWT } from '../middleware/auth.js'

const router = Router()

// All project routes require authentication
router.use(authenticateJWT)

// GET /api/projects
router.get('/', (req, res) => {
  res.json({ projects: [] })
})

// POST /api/projects
router.post('/', (req, res) => {
  res.json({ message: 'Create project - Coming soon' })
})

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  res.json({ message: 'Get project details - Coming soon' })
})

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  res.json({ message: 'Update project - Coming soon' })
})

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete project - Coming soon' })
})

export default router
