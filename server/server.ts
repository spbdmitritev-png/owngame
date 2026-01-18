import express from 'express'
import cors from 'cors'
import { questionsRouter } from './routes/questions.js'
import { gamesRouter } from './routes/games.js'
import { gameStateRouter } from './routes/gameState.js'
import { pool } from './db.js'

const app = express()
const PORT = process.env.PORT || 3001

// Test database connection on startup
;(async () => {
  try {
    const res = await pool.query('SELECT now()')
    console.log('✅ DB CONNECT OK:', res.rows[0])
  } catch (e) {
    console.error('❌ DB CONNECT ERROR:', e)
  }
})()

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
      },
      gameState: {
        get: 'GET /api/game-state/:gameId',
        save: 'POST /api/game-state/:gameId',
        delete: 'DELETE /api/game-state/:gameId'
      }
    }
  })
})

// Routes
app.use('/api/questions', questionsRouter)
app.use('/api/games', gamesRouter)
app.use('/api/game-state', gameStateRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
})

