import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './utils/logger.js'

// Import routes
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import budgetRoutes from './routes/budgets.js'
import poRoutes from './routes/purchaseOrders.js'
import transactionRoutes from './routes/transactions.js'
import plaidRoutes from './routes/plaid.js'
import venueRoutes from './routes/venues.js'
import settlementRoutes from './routes/settlements.js'
import portfolioRoutes from './routes/portfolio.js'
import webhookRoutes from './routes/webhooks.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/purchase-orders', poRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/plaid', plaidRoutes)
app.use('/api/venues', venueRoutes)
app.use('/api/settlements', settlementRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/webhooks', webhookRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 ShowStack:Manager API running on port ${PORT}`)
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`🔗 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`)
})

export default app
