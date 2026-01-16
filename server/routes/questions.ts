import { Router } from 'express'
import { pool } from '../db.js'

export const questionsRouter = Router()

// Получить все вопросы
questionsRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM questions ORDER BY created_at DESC'
    )
    res.json(rows)
  } catch (error) {
    console.error('Error getting questions:', error)
    res.status(500).json({ error: 'Failed to get questions' })
  }
})

// Получить вопросы по категории
questionsRouter.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params
    const { rows } = await pool.query(
      'SELECT * FROM questions WHERE category = $1 ORDER BY created_at DESC',
      [decodeURIComponent(category)]
    )
    res.json(rows)
  } catch (error) {
    console.error('Error getting questions by category:', error)
    res.status(500).json({ error: 'Failed to get questions by category' })
  }
})

// Получить все категории
questionsRouter.get('/categories', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT DISTINCT category FROM questions ORDER BY category'
    )
    res.json(rows.map((row: { category: string }) => row.category))
  } catch (error) {
    console.error('Error getting categories:', error)
    res.status(500).json({ error: 'Failed to get categories' })
  }
})

// Добавить вопрос
questionsRouter.post('/', async (req, res) => {
  try {
    const { category, question } = req.body
    if (!category || !question) {
      return res.status(400).json({ error: 'Category and question are required' })
    }

    const { rows } = await pool.query(
      `INSERT INTO questions (category, question)
       VALUES ($1, $2)
       RETURNING *`,
      [category, JSON.stringify(question)]
    )

    res.status(201).json(rows[0])
  } catch (error) {
    console.error('Error adding question:', error)
    res.status(500).json({ error: 'Failed to add question' })
  }
})

// Обновить вопрос
questionsRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { category, question } = req.body
    if (!category || !question) {
      return res.status(400).json({ error: 'Category and question are required' })
    }

    const { rows } = await pool.query(
      `UPDATE questions
       SET category = $1, question = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [category, JSON.stringify(question), id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' })
    }

    res.json(rows[0])
  } catch (error) {
    console.error('Error updating question:', error)
    res.status(500).json({ error: 'Failed to update question' })
  }
})

// Удалить вопрос
questionsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { rowCount } = await pool.query(
      'DELETE FROM questions WHERE id = $1',
      [id]
    )

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Question not found' })
    }

    res.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Error deleting question:', error)
    res.status(500).json({ error: 'Failed to delete question' })
  }
})

// Поиск вопросов
questionsRouter.get('/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const searchTerm = `%${q.toLowerCase()}%`
    const { rows } = await pool.query(
      `SELECT * FROM questions
       WHERE LOWER(category) LIKE $1
          OR LOWER(question->>'text') LIKE $1
          OR LOWER(question->>'answer') LIKE $1
       ORDER BY created_at DESC`,
      [searchTerm]
    )

    res.json(rows)
  } catch (error) {
    console.error('Error searching questions:', error)
    res.status(500).json({ error: 'Failed to search questions' })
  }
})

