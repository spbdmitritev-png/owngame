export type SurpriseType = 'cat' | 'auction' | 'toast' | 'gift' | string // string для кастомных сюрпризов

export interface CustomSurprise {
  id: string
  name: string
  emoji: string
}

export interface Surprise {
  type: SurpriseType
  questionIndex: number // Индекс вопроса в теме
}

export interface Question {
  text: string
  answer: string
  type?: 'text' | 'image' | 'video' | 'audio'
  mediaUrl?: string
  surprise?: SurpriseType
  isPlayed: boolean
}

export interface Topic {
  name: string
  questions: Question[]
}

export interface Round {
  number: number
  topics: Topic[]
  values: number[] // Номиналы вопросов
  surprises: Surprise[]
}

export interface Team {
  id: string
  name: string
  shortName: string // 3 буквы
  score: number
}

export interface GameConfig {
  numberOfRounds: 1 | 2 | 3
  rounds: Round[]
  finalRound: Round
  teams: Team[]
  surprisesConfig: {
    cat: number[] // Количество по раундам
    auction: number[]
    toast: number[]
    gift: number[]
  }
  customSurprises?: Record<string, CustomSurprise> // Кастомные сюрпризы
}

export interface QuestionAnswer {
  roundNumber: number
  topicIndex: number
  questionIndex: number
  teamId: string
  isCorrect: boolean
  value: number
  topicName: string
}

export interface GameState extends GameConfig {
  currentRound: number
  isFinalRound: boolean
  finalBets: Record<string, number> // teamId -> bet
  finalAnswers: Record<string, boolean> // teamId -> isCorrect
  finalTeamAnswers: Record<string, string> // teamId -> answer text (ответы команд, введенные ведущим)
  selectedFinalTopic: number | null // Индекс выбранной темы финала (всегда 0 для финала)
  selectedFinalQuestion: number | null // Индекс выбранного вопроса в финальной теме
  excludedFinalTopics?: number[] // Индексы исключенных тем в финальном раунде
  questionAnswers?: QuestionAnswer[] // История ответов команд на вопросы
}

