import { Question } from '../types'
import { API_BASE_URL } from '../config/api'

export interface QuestionDBItem {
  id: string
  category: string
  question: Question
  created_at?: string
  createdAt?: number
}

// Cache для вопросов (чтобы не делать запросы каждый раз)
let questionsCache: QuestionDBItem[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 30000 // 30 секунд

// Преобразуем формат из БД в формат фронтенда
const normalizeQuestion = (item: any): QuestionDBItem => {
  return {
    id: item.id,
    category: item.category,
    question: typeof item.question === 'string' ? JSON.parse(item.question) : item.question,
    created_at: item.created_at,
    createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
  }
}

export const questionsDB = {
  // Получить все вопросы
  async getAll(): Promise<QuestionDBItem[]> {
    try {
      // Используем кеш если он свежий
      const now = Date.now()
      if (questionsCache && (now - cacheTimestamp) < CACHE_TTL) {
        return questionsCache
      }

      const response = await fetch(`${API_BASE_URL}/api/questions`)
      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }
      const data = await response.json()
      questionsCache = data.map(normalizeQuestion)
      cacheTimestamp = now
      return questionsCache
    } catch (error) {
      console.error('Error fetching questions:', error)
      return []
    }
  },

  // Получить вопросы по категории
  async getByCategory(category: string): Promise<QuestionDBItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/questions/category/${encodeURIComponent(category)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch questions by category')
      }
      const data = await response.json()
      return data.map(normalizeQuestion)
    } catch (error) {
      console.error('Error fetching questions by category:', error)
      return []
    }
  },

  // Получить все категории
  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/questions/categories`)
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  },

  // Добавить вопрос
  async add(category: string, question: Question): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: category.trim(),
          question,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add question')
      }

      const saved = await response.json()
      
      // Инвалидируем кеш
      questionsCache = null
      cacheTimestamp = 0

      return saved.id
    } catch (error) {
      console.error('Error adding question:', error)
      throw error
    }
  },

  // Удалить вопрос
  async remove(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete question')
      }

      // Инвалидируем кеш
      questionsCache = null
      cacheTimestamp = 0
    } catch (error) {
      console.error('Error deleting question:', error)
      throw error
    }
  },

  // Обновить вопрос
  async update(id: string, category: string, question: Question): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: category.trim(),
          question,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update question')
      }

      // Инвалидируем кеш
      questionsCache = null
      cacheTimestamp = 0
    } catch (error) {
      console.error('Error updating question:', error)
      throw error
    }
  },

  // Поиск вопросов
  async search(query: string): Promise<QuestionDBItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/questions/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to search questions')
      }
      const data = await response.json()
      return data.map(normalizeQuestion)
    } catch (error) {
      console.error('Error searching questions:', error)
      return []
    }
  },
}


