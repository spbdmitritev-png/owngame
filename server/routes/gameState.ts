import { Router } from 'express'
import { pool } from '../db.js'

export const gameStateRouter = Router()

const GAME_STATE_KEY = 'current_game_state'

// Получить текущее состояние игры
gameStateRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT value FROM game_state WHERE key = $1`,
      [GAME_STATE_KEY]
    )
    
    if (rows.length === 0) {
      return res.json(null)
    }
    
    const gameState = JSON.parse(rows[0].value)
    res.json(gameState)
  } catch (error) {
    console.error('Error getting game state:', error)
    res.status(500).json({ error: 'Failed to get game state' })
  }
})

// Сохранить состояние игры
gameStateRouter.post('/', async (req, res) => {
  try {
    const gameState = req.body
    
    if (!gameState) {
      return res.status(400).json({ error: 'Game state is required' })
    }
    
    const gameStateJson = JSON.stringify(gameState)
    
    // Используем UPSERT для обновления или создания записи
    await pool.query(
      `INSERT INTO game_state (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = $2, updated_at = NOW()`,
      [GAME_STATE_KEY, gameStateJson]
    )
    
    res.json({ message: 'Game state saved successfully' })
  } catch (error) {
    console.error('Error saving game state:', error)
    res.status(500).json({ error: 'Failed to save game state' })
  }
})

// Удалить состояние игры
gameStateRouter.delete('/', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM game_state WHERE key = $1`,
      [GAME_STATE_KEY]
    )
    
    res.json({ message: 'Game state deleted successfully' })
  } catch (error) {
    console.error('Error deleting game state:', error)
    res.status(500).json({ error: 'Failed to delete game state' })
  }
})
