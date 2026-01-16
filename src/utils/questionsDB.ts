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
let questionsCache: QuestionDBItem[] = []
let cacheTimestamp: number = 0
const CACHE_TTL = 30000 // 30 секунд

// Преобразуем формат из БД в формат фронтенда
const normalizeQuestion = (item: any): QuestionDBItem => {
  // БД возвращает: { id, category, price, question, answer, media_type, media_url, created_at }
  // Фронтенд ожидает: { id, category, question: { text, answer, type, mediaUrl }, createdAt }
  return {
    id: item.id,
    category: item.category,
    question: {
      text: item.question || '',
      answer: item.answer || '',
      type: item.media_type || 'text',
      mediaUrl: item.media_url || undefined,
      isPlayed: false,
    },
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
      if (questionsCache.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
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
  async add(category: string, question: Question, price?: number): Promise<string> {
    console.log('📤 questionsDB.add called with:', { category, question, price })
    
    try {
      // Валидация обязательных полей
      if (!category || !question.text || !question.answer || !price || price <= 0) {
        const errorMsg = 'Category, question text, answer and price (must be > 0) are required'
        console.error('❌ Validation failed:', { category, hasText: !!question.text, hasAnswer: !!question.answer, price })
        throw new Error(errorMsg)
      }

      const requestBody = {
        category: category.trim(),
        price: Number(price),
        question: question.text.trim(),
        answer: question.answer.trim(),
        media_type: question.type && question.type !== 'text' ? question.type : null,
        media_url: question.mediaUrl || null,
      }

      // Убираем null значения для чистоты
      if (requestBody.media_type === null) {
        delete requestBody.media_type
      }
      if (requestBody.media_url === null) {
        delete requestBody.media_url
      }

      console.log('🌐 Sending POST request to:', `${API_BASE_URL}/api/questions`)
      console.log('📦 Request body:', requestBody)

      const response = await fetch(`${API_BASE_URL}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📥 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API error response:', errorText)
        throw new Error(errorText || 'Failed to add question')
      }

      const saved = await response.json()
      console.log('✅ Question saved successfully:', saved)
      
      // Инвалидируем кеш
      questionsCache = []
      cacheTimestamp = 0

      return saved.id
    } catch (error) {
      console.error('❌ Error adding question:', error)
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
      questionsCache = []
      cacheTimestamp = 0
    } catch (error) {
      console.error('Error deleting question:', error)
      throw error
    }
  },

  // Обновить вопрос
  async update(id: string, category: string, question: Question, price?: number): Promise<void> {
    try {
      // Валидация обязательных полей
      if (!category || !question.text || !question.answer || !price || price <= 0) {
        throw new Error('Category, question text, answer and price (must be > 0) are required')
      }

      // Создаём requestBody без null значений
      const requestBody: {
        category: string
        price: number
        question: string
        answer: string
        media_type?: string
        media_url?: string
      } = {
        category: category.trim(),
        price: Number(price),
        question: question.text.trim(),
        answer: question.answer.trim(),
      }

      // Добавляем опциональные поля только если они есть
      if (question.type && question.type !== 'text') {
        requestBody.media_type = question.type
      }
      if (question.mediaUrl) {
        requestBody.media_url = question.mediaUrl
      }

      const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update question')
      }

      // Инвалидируем кеш
      questionsCache = []
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


