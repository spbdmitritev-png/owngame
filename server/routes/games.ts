import { Router } from 'express'
import { GameConfig } from '../types.js'
import { gamesDB } from '../db/gamesDB.js'

export const gamesRouter = Router()

// Получить все сохраненные игры
gamesRouter.get('/', (req, res) => {
  try {
    const games = gamesDB.getAll()
    res.json(games)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get games' })
  }
})

// Получить игру по ID
gamesRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const game = gamesDB.getById(id)
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    res.json(game)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game' })
  }
})

// Сохранить игру
gamesRouter.post('/', (req, res) => {
  try {
    const gameConfig: GameConfig = req.body
    if (!gameConfig) {
      return res.status(400).json({ error: 'Game config is required' })
    }
    const id = gamesDB.save(gameConfig)
    res.status(201).json({ id, message: 'Game saved successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save game' })
  }
})

// Обновить игру
gamesRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const gameConfig: GameConfig = req.body
    if (!gameConfig) {
      return res.status(400).json({ error: 'Game config is required' })
    }
    gamesDB.update(id, gameConfig)
    res.json({ message: 'Game updated successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update game' })
  }
})

// Удалить игру
gamesRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    gamesDB.remove(id)
    res.json({ message: 'Game deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete game' })
  }
})

