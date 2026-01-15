import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { GameState, GameConfig, SurpriseType, QuestionAnswer } from '../types'

const GAME_STATE_STORAGE_KEY = 'svoyaIgra_gameState'

interface GameContextType {
  gameState: GameState | null
  setGameConfig: (config: GameConfig) => void
  updateTeamScore: (teamId: string, points: number) => void
  markQuestionAsPlayed: (roundNumber: number, topicIndex: number, questionIndex: number) => void
  recordQuestionAnswer: (roundNumber: number, topicIndex: number, questionIndex: number, teamId: string, isCorrect: boolean, value: number, topicName: string) => void
  setFinalBet: (teamId: string, bet: number) => void
  setFinalAnswer: (teamId: string, isCorrect: boolean) => void
  setFinalTeamAnswer: (teamId: string, answer: string) => void
  setSelectedFinalTopic: (topicIndex: number | null) => void
  setSelectedFinalQuestion: (questionIndex: number | null) => void
  setExcludedFinalTopics: (excludedTopics: number[]) => void
  setSurprise: (roundNumber: number, topicIndex: number, questionIndex: number, surpriseType: SurpriseType | undefined) => void
  moveSurprise: (roundNumber: number, fromTopicIndex: number, fromQuestionIndex: number, toTopicIndex: number, toQuestionIndex: number) => void
  resetGame: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Восстанавливаем состояние из localStorage при загрузке
  const [gameState, setGameState] = useState<GameState | null>(() => {
    try {
      const savedState = localStorage.getItem(GAME_STATE_STORAGE_KEY)
      if (savedState) {
        const parsed = JSON.parse(savedState)
        console.log('[GameContext] Restored gameState from localStorage:', parsed)
        return parsed
      }
    } catch (error) {
      console.error('[GameContext] Error restoring gameState from localStorage:', error)
    }
    return null
  })

  // Сохраняем состояние в localStorage при каждом изменении
  // Используем useRef для отслеживания предыдущего состояния, чтобы избежать бесконечных циклов
  const prevStateRef = useRef<string>('')
  
  useEffect(() => {
    if (gameState) {
      try {
        // Сохраняем немедленно и синхронно
        const stateToSave = JSON.stringify(gameState)
        
        // Проверяем, изменилось ли состояние, чтобы избежать лишних сохранений
        if (prevStateRef.current === stateToSave) {
          return // Состояние не изменилось, пропускаем сохранение
        }
        
        localStorage.setItem(GAME_STATE_STORAGE_KEY, stateToSave)
        prevStateRef.current = stateToSave // Сохраняем текущее состояние
        
        // Логируем только при значительных изменениях, чтобы не засорять консоль
        // (например, при изменении ставок или ответов)
        const hasBets = Object.keys(gameState.finalBets || {}).length > 0
        const hasAnswers = Object.keys(gameState.finalAnswers || {}).length > 0
        if (hasBets || hasAnswers) {
          console.log('[GameContext] Saved gameState to localStorage', {
            teams: gameState.teams.length,
            finalBets: Object.keys(gameState.finalBets || {}).length,
            finalAnswers: Object.keys(gameState.finalAnswers || {}).length,
          })
        }
      } catch (error) {
        console.error('[GameContext] Error saving gameState to localStorage:', error)
        // Если ошибка из-за переполнения, пытаемся очистить старые данные
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('[GameContext] localStorage quota exceeded, trying to clear old data')
          try {
            // Очищаем только старые ключи, не связанные с игрой
            const keysToKeep = [GAME_STATE_STORAGE_KEY, 'gameConfig']
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && !keysToKeep.includes(key)) {
                localStorage.removeItem(key)
              }
            }
            // Пытаемся сохранить снова
            const stateToSave = JSON.stringify(gameState)
            localStorage.setItem(GAME_STATE_STORAGE_KEY, stateToSave)
            prevStateRef.current = stateToSave
          } catch (retryError) {
            console.error('[GameContext] Failed to save after cleanup:', retryError)
          }
        }
      }
    } else {
      // Если gameState null, удаляем сохраненное состояние только при явном сбросе
      // Не удаляем автоматически, чтобы не потерять данные при временных проблемах
    }
  }, [gameState])

  const setGameConfig = useCallback((config: GameConfig) => {
    console.log('[GameContext] setGameConfig called with config:', config)
    
    // Если игра уже идет, сохраняем существующие данные финального раунда
    const existingState = gameState
    const preservedData = existingState ? {
      finalBets: existingState.finalBets || {},
      finalAnswers: existingState.finalAnswers || {},
      finalTeamAnswers: existingState.finalTeamAnswers || {},
      selectedFinalTopic: existingState.selectedFinalTopic,
      selectedFinalQuestion: existingState.selectedFinalQuestion,
      excludedFinalTopics: existingState.excludedFinalTopics || [],
      currentRound: existingState.currentRound || 1,
      isFinalRound: existingState.isFinalRound || false,
      questionAnswers: existingState.questionAnswers || [],
    } : {
      finalBets: {},
      finalAnswers: {},
      finalTeamAnswers: {},
      selectedFinalTopic: null,
      selectedFinalQuestion: null,
      excludedFinalTopics: [],
      currentRound: 1,
      isFinalRound: false,
      questionAnswers: [],
    }
    
    const newState: GameState = {
      ...config,
      ...preservedData,
      // Обновляем команды из конфига, ВСЕГДА обнуляем очки при создании новой игры
      teams: config.teams.map(newTeam => ({
        ...newTeam,
        score: 0 // Всегда начинаем с нуля при создании новой игры
      })),
    }
    console.log('[GameContext] Setting gameState with preserved data:', newState)
    setGameState(newState)
    // Сохраняем конфигурацию в localStorage для доступа из TeamScreen
    localStorage.setItem('gameConfig', JSON.stringify(config))
    console.log('[GameContext] gameConfig saved to localStorage')
  }, [gameState])

  const updateTeamScore = useCallback((teamId: string, points: number) => {
    setGameState((prev) => {
      if (!prev) {
        console.warn('[GameContext] updateTeamScore called but gameState is null')
        return prev
      }
      const newState = {
        ...prev,
        teams: prev.teams.map((team) =>
          team.id === teamId ? { ...team, score: team.score + points } : team
        ),
      }
      // Сохранение произойдет автоматически через useEffect
      return newState
    })
  }, [])

  const markQuestionAsPlayed = useCallback(
    (roundNumber: number, topicIndex: number, questionIndex: number) => {
      setGameState((prev) => {
        if (!prev) return prev
        const rounds = prev.isFinalRound ? [prev.finalRound] : prev.rounds
        const round = rounds[roundNumber - 1]
        if (!round) return prev

        const newTopics = round.topics.map((topic, tIdx) => {
          if (tIdx !== topicIndex) return topic
          return {
            ...topic,
            questions: topic.questions.map((q, qIdx) =>
              qIdx === questionIndex ? { ...q, isPlayed: true } : q
            ),
          }
        })

        const newRound = { ...round, topics: newTopics }

        if (prev.isFinalRound) {
          return { ...prev, finalRound: newRound }
        } else {
          const newRounds = prev.rounds.map((r, idx) => (idx === roundNumber - 1 ? newRound : r))
          return { ...prev, rounds: newRounds }
        }
      })
    },
    []
  )

  const recordQuestionAnswer = useCallback(
    (roundNumber: number, topicIndex: number, questionIndex: number, teamId: string, isCorrect: boolean, value: number, topicName: string) => {
      setGameState((prev) => {
        if (!prev) return prev
        const newAnswer: QuestionAnswer = {
          roundNumber,
          topicIndex,
          questionIndex,
          teamId,
          isCorrect,
          value,
          topicName,
        }
        const existingAnswers = prev.questionAnswers || []
        // Проверяем, не записан ли уже ответ на этот вопрос (чтобы избежать дубликатов)
        const isDuplicate = existingAnswers.some(
          (ans) =>
            ans.roundNumber === roundNumber &&
            ans.topicIndex === topicIndex &&
            ans.questionIndex === questionIndex &&
            ans.teamId === teamId
        )
        if (isDuplicate) {
          return prev
        }
        return {
          ...prev,
          questionAnswers: [...existingAnswers, newAnswer],
        }
      })
    },
    []
  )

  const setFinalBet = useCallback((teamId: string, bet: number) => {
    console.log('[GameContext] setFinalBet called', { teamId, bet })
    setGameState((prev) => {
      if (!prev) {
        console.warn('[GameContext] setFinalBet called but gameState is null')
        return prev
      }
      const newState = {
        ...prev,
        finalBets: { ...(prev.finalBets || {}), [teamId]: bet },
      }
      console.log('[GameContext] setFinalBet: New state', { 
        teamId, 
        bet, 
        finalBets: newState.finalBets,
        finalBetsKeys: Object.keys(newState.finalBets || {})
      })
      // Не сохраняем здесь - useEffect сделает это автоматически
      return newState
    })
  }, [])

  const setFinalAnswer = useCallback((teamId: string, isCorrect: boolean) => {
    setGameState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        finalAnswers: { ...prev.finalAnswers, [teamId]: isCorrect },
      }
    })
  }, [])

  const setFinalTeamAnswer = useCallback((teamId: string, answer: string) => {
    setGameState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        finalTeamAnswers: { ...(prev.finalTeamAnswers || {}), [teamId]: answer },
      }
    })
  }, [])

  const setSelectedFinalTopic = useCallback((topicIndex: number | null) => {
    setGameState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        selectedFinalTopic: topicIndex,
      }
    })
  }, [])

  const setSelectedFinalQuestion = useCallback((questionIndex: number | null) => {
    setGameState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        selectedFinalQuestion: questionIndex,
      }
    })
  }, [])

  const setExcludedFinalTopics = useCallback((excludedTopics: number[]) => {
    setGameState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        excludedFinalTopics: excludedTopics,
      }
    })
  }, [])

  const setSurprise = useCallback(
    (roundNumber: number, topicIndex: number, questionIndex: number, surpriseType: SurpriseType | undefined) => {
      setGameState((prev) => {
        if (!prev) return prev
        const rounds = prev.isFinalRound ? [prev.finalRound] : prev.rounds
        const round = rounds[roundNumber - 1]
        if (!round) return prev

        const newTopics = round.topics.map((topic, tIdx) => {
          if (tIdx !== topicIndex) return topic
          return {
            ...topic,
            questions: topic.questions.map((q, qIdx) =>
              qIdx === questionIndex ? { ...q, surprise: surpriseType } : q
            ),
          }
        })

        const newRound = { ...round, topics: newTopics }

        if (prev.isFinalRound) {
          return { ...prev, finalRound: newRound }
        } else {
          const newRounds = prev.rounds.map((r, idx) => (idx === roundNumber - 1 ? newRound : r))
          return { ...prev, rounds: newRounds }
        }
      })
    },
    []
  )

  const moveSurprise = useCallback(
    (
      roundNumber: number,
      fromTopicIndex: number,
      fromQuestionIndex: number,
      toTopicIndex: number,
      toQuestionIndex: number
    ) => {
      setGameState((prev) => {
        if (!prev) return prev
        const rounds = prev.isFinalRound ? [prev.finalRound] : prev.rounds
        const round = rounds[roundNumber - 1]
        if (!round) return prev

        const fromTopic = round.topics[fromTopicIndex]
        const fromQuestion = fromTopic?.questions[fromQuestionIndex]
        const surpriseType = fromQuestion?.surprise

        if (!surpriseType) return prev

        const newTopics = round.topics.map((topic, tIdx) => {
          if (tIdx === fromTopicIndex) {
            // Убираем сюрприз с исходного вопроса
            return {
              ...topic,
              questions: topic.questions.map((q, qIdx) =>
                qIdx === fromQuestionIndex ? { ...q, surprise: undefined } : q
              ),
            }
          }
          if (tIdx === toTopicIndex) {
            // Добавляем сюрприз на новый вопрос (если там уже был сюрприз, заменяем)
            return {
              ...topic,
              questions: topic.questions.map((q, qIdx) =>
                qIdx === toQuestionIndex ? { ...q, surprise: surpriseType } : q
              ),
            }
          }
          return topic
        })

        const newRound = { ...round, topics: newTopics }

        if (prev.isFinalRound) {
          return { ...prev, finalRound: newRound }
        } else {
          const newRounds = prev.rounds.map((r, idx) => (idx === roundNumber - 1 ? newRound : r))
          return { ...prev, rounds: newRounds }
        }
      })
    },
    []
  )

  const resetGame = useCallback(() => {
    console.log('[GameContext] Resetting game - clearing all state and localStorage')
    setGameState(null)
    // Очищаем все ключи, связанные с игрой
    localStorage.removeItem(GAME_STATE_STORAGE_KEY)
    localStorage.removeItem('gameConfig')
    // Дополнительно очищаем все ключи, которые могут содержать данные игры
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('svoyaIgra_') || key.startsWith('game'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log('[GameContext] Game reset complete - all state and localStorage cleared')
  }, [])

  return (
    <GameContext.Provider
      value={{
        gameState,
    setGameConfig,
    updateTeamScore,
    markQuestionAsPlayed,
    recordQuestionAnswer,
        setFinalBet,
        setFinalAnswer,
        setFinalTeamAnswer,
        setSelectedFinalTopic,
    setSelectedFinalQuestion,
    setExcludedFinalTopics,
    setSurprise,
    moveSurprise,
    resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

