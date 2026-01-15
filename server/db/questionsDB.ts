import { Question } from '../types.js'
import fs from 'fs'
import path from 'path'

export interface QuestionDBItem {
  id: string
  category: string
  question: Question
  createdAt: number
}

// Используем process.cwd() для определения корня проекта
const DB_FILE = path.join(process.cwd(), 'server/data/questions.json')

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialize empty database if file doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2))
}

function readDB(): QuestionDBItem[] {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writeDB(data: QuestionDBItem[]): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

export const questionsDB = {
  // Получить все вопросы
  getAll(): QuestionDBItem[] {
    return readDB()
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
    writeDB(items)
    return id
  },

  // Удалить вопрос
  remove(id: string): void {
    const items = this.getAll().filter((item) => item.id !== id)
    writeDB(items)
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
      writeDB(items)
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

