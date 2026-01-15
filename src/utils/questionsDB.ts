import { Question } from '../types'

export interface QuestionDBItem {
  id: string
  category: string
  question: Question
  createdAt: number
}

const DB_KEY = 'svoya-igra-questions-db'

export const questionsDB = {
  // Получить все вопросы
  getAll(): QuestionDBItem[] {
    try {
      const data = localStorage.getItem(DB_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  // Получить вопросы по категории
  getByCategory(category: string): QuestionDBItem[] {
    return this.getAll().filter((item) => item.category === category)
  },

  // Получить все категории
  getCategories(): string[] {
    const items = this.getAll()
    const categories = new Set(items.map((item) => item.category))
    return Array.from(categories).sort()
  },

  // Добавить вопрос
  add(category: string, question: Question): string {
    const items = this.getAll()
    const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newItem: QuestionDBItem = {
      id,
      category,
      question,
      createdAt: Date.now(),
    }
    items.push(newItem)
    localStorage.setItem(DB_KEY, JSON.stringify(items))
    return id
  },

  // Удалить вопрос
  remove(id: string): void {
    const items = this.getAll().filter((item) => item.id !== id)
    localStorage.setItem(DB_KEY, JSON.stringify(items))
  },

  // Обновить вопрос
  update(id: string, category: string, question: Question): void {
    const items = this.getAll()
    const index = items.findIndex((item) => item.id === id)
    if (index !== -1) {
      items[index] = {
        ...items[index],
        category,
        question,
      }
      localStorage.setItem(DB_KEY, JSON.stringify(items))
    }
  },

  // Поиск вопросов
  search(query: string): QuestionDBItem[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter(
      (item) =>
        item.question.text.toLowerCase().includes(lowerQuery) ||
        item.question.answer.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
    )
  },
}


