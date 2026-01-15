import express from 'express'
import cors from 'cors'
import { questionsRouter } from './routes/questions.js'
import { gamesRouter } from './routes/games.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Своя Игра API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      questions: {
        getAll: 'GET /api/questions',
        getCategories: 'GET /api/questions/categories',
        getByCategory: 'GET /api/questions/category/:category',
        search: 'GET /api/questions/search?q=query',
        create: 'POST /api/questions',
        update: 'PUT /api/questions/:id',
        delete: 'DELETE /api/questions/:id'
      },
      games: {
        getAll: 'GET /api/games',
        getById: 'GET /api/games/:id',
        create: 'POST /api/games',
        update: 'PUT /api/games/:id',
        delete: 'DELETE /api/games/:id'
      }
    }
  })
})

// Routes
app.use('/api/questions', questionsRouter)
app.use('/api/games', gamesRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
})

