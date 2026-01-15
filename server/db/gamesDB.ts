import { GameConfig } from '../types'
import fs from 'fs'
import path from 'path'

export interface GameDBItem {
  id: string
  name: string
  config: GameConfig
  createdAt: number
  updatedAt: number
}

// Используем process.cwd() для определения корня проекта
const DB_FILE = path.join(process.cwd(), 'server/data/games.json')

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialize empty database if file doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2))
}

function readDB(): GameDBItem[] {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

function writeDB(data: GameDBItem[]): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

export const gamesDB = {
  // Получить все игры
  getAll(): GameDBItem[] {
    return readDB()
  },

  // Получить игру по ID
  getById(id: string): GameDBItem | null {
    const items = this.getAll()
    return items.find((item) => item.id === id) || null
  },

  // Сохранить игру
  save(config: GameConfig, name?: string): string {
    const items = this.getAll()
    const id = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newItem: GameDBItem = {
      id,
      name: name || `Game ${new Date().toLocaleDateString()}`,
      config,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    items.push(newItem)
    writeDB(items)
    return id
  },

  // Обновить игру
  update(id: string, config: GameConfig, name?: string): void {
    const items = this.getAll()
    const index = items.findIndex((item) => item.id === id)
    if (index !== -1) {
      items[index] = {
        ...items[index],
        config,
        updatedAt: Date.now(),
        ...(name && { name }),
      }
      writeDB(items)
    }
  },

  // Удалить игру
  remove(id: string): void {
    const items = this.getAll().filter((item) => item.id !== id)
    writeDB(items)
  },
}

