import { Router } from 'express'
import { Question } from '../types'
import { questionsDB } from '../db/questionsDB'

export const questionsRouter = Router()

// Получить все вопросы
questionsRouter.get('/', (req, res) => {
  try {
    const questions = questionsDB.getAll()
    res.json(questions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get questions' })
  }
})

// Получить вопросы по категории
questionsRouter.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params
    const questions = questionsDB.getByCategory(decodeURIComponent(category))
    res.json(questions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get questions by category' })
  }
})

// Получить все категории
questionsRouter.get('/categories', (req, res) => {
  try {
    const categories = questionsDB.getCategories()
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' })
  }
})

// Добавить вопрос
questionsRouter.post('/', (req, res) => {
  try {
    const { category, question } = req.body
    if (!category || !question) {
      return res.status(400).json({ error: 'Category and question are required' })
    }
    const id = questionsDB.add(category, question)
    res.status(201).json({ id, message: 'Question added successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add question' })
  }
})

// Обновить вопрос
questionsRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const { category, question } = req.body
    if (!category || !question) {
      return res.status(400).json({ error: 'Category and question are required' })
    }
    questionsDB.update(id, category, question)
    res.json({ message: 'Question updated successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update question' })
  }
})

// Удалить вопрос
questionsRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    questionsDB.remove(id)
    res.json({ message: 'Question deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question' })
  }
})

// Поиск вопросов
questionsRouter.get('/search', (req, res) => {
  try {
    const { q } = req.query
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' })
    }
    const results = questionsDB.search(q)
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: 'Failed to search questions' })
  }
})

