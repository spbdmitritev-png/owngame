import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import GameSettings from '../components/GameSettings'
import './FinalRoundScreen.css'

export default function FinalRoundScreen() {
  const navigate = useNavigate()
  const { gameState, updateGameState, setSelectedFinalTopic, setSelectedFinalQuestion, setExcludedFinalTopics } = useGame()
  
  // Устанавливаем isFinalRound: true при открытии финального раунда
  useEffect(() => {
    if (gameState && !gameState.isFinalRound) {
      updateGameState({
        ...gameState,
        isFinalRound: true,
        currentRound: gameState.numberOfRounds + 1, // Финальный раунд
      })
    }
  }, [gameState, updateGameState])
  
  // Восстанавливаем excludedTopics из gameState или используем пустой массив
  const [excludedTopics, setExcludedTopics] = useState<number[]>(
    gameState?.excludedFinalTopics || []
  )
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)

  // Синхронизируем excludedTopics с gameState
  useEffect(() => {
    if (gameState?.excludedFinalTopics) {
      // Проверяем, что значения действительно отличаются, чтобы избежать бесконечного цикла
      const currentExcluded = JSON.stringify(gameState.excludedFinalTopics.sort())
      const localExcluded = JSON.stringify([...excludedTopics].sort())
      if (currentExcluded !== localExcluded) {
        setExcludedTopics(gameState.excludedFinalTopics)
      }
    }
  }, [gameState?.excludedFinalTopics])

  // Сохраняем excludedTopics в gameState при изменении
  // Используем useRef для отслеживания предыдущего значения, чтобы избежать бесконечного цикла
  const prevExcludedRef = useRef<string>('')
  useEffect(() => {
    if (gameState) {
      const excludedKey = JSON.stringify([...excludedTopics].sort())
      // Проверяем, что значение действительно изменилось
      if (prevExcludedRef.current !== excludedKey) {
        const gameExcludedKey = JSON.stringify([...(gameState.excludedFinalTopics || [])].sort())
        // Сохраняем только если локальное значение отличается от значения в gameState
        if (excludedKey !== gameExcludedKey) {
          setExcludedFinalTopics(excludedTopics)
          prevExcludedRef.current = excludedKey
        }
      }
    }
  }, [excludedTopics, gameState, setExcludedFinalTopics])

  if (!gameState) {
    return <div>Загрузка...</div>
  }

  // Отслеживаем изменения команд реактивно
  const sortedTeams = useMemo(() => {
    if (!gameState?.teams) return []
    return [...gameState.teams].sort((a, b) => b.score - a.score)
  }, [gameState?.teams?.map(t => `${t.id}:${t.score}`).join('|')])

  // Реактивно вычисляем команды со ставками
  // Используем useState с useEffect для гарантированного обновления при изменении gameState
  const [teamsWithBets, setTeamsWithBets] = useState<Array<{ team: typeof gameState.teams[0], bet: number, hasBet: boolean }>>([])
  
  useEffect(() => {
    if (!gameState) {
      setTeamsWithBets([])
      return
    }
    
    // Всегда читаем актуальные данные напрямую из gameState
    const currentFinalBets = gameState.finalBets || {}
    
    const result = sortedTeams
      .filter((team) => {
        // Показываем только команды с положительными баллами до финала
        const finalBet = currentFinalBets[team.id] || 0
        const finalAnswer = gameState.finalAnswers?.[team.id]
        let finalPoints = 0
        if (finalAnswer !== undefined) {
          finalPoints = finalAnswer ? finalBet : -finalBet
        }
        const scoreBeforeFinal = team.score - finalPoints
        return scoreBeforeFinal >= 0
      })
      .map((team) => {
        const bet = currentFinalBets[team.id]
        const hasBet = bet !== undefined && bet > 0
        return { team, bet, hasBet }
      })
    
    setTeamsWithBets(result)
  }, [
    sortedTeams,
    gameState?.finalBets ? JSON.stringify(gameState.finalBets) : '{}',
    gameState?.finalAnswers ? JSON.stringify(gameState.finalAnswers) : '{}'
  ])
  const availableTopics = gameState.finalRound.topics.filter(
    (_, index) => !excludedTopics.includes(index)
  )

  // Когда остается одна тема, выбираем её автоматически
  useEffect(() => {
    if (availableTopics.length === 1) {
      const selectedTopicIndex = gameState.finalRound.topics.findIndex((_, idx) => !excludedTopics.includes(idx))
      if (selectedTopicIndex !== -1) {
        setSelectedFinalTopic(selectedTopicIndex)
        setSelectedFinalQuestion(0)
      }
    }
  }, [availableTopics.length, gameState.finalRound.topics, excludedTopics, setSelectedFinalTopic, setSelectedFinalQuestion])

  const selectedTopicIndex = availableTopics.length === 1 
    ? gameState.finalRound.topics.findIndex((_, idx) => !excludedTopics.includes(idx))
    : null

  const handleTopicClick = (topicIndex: number) => {
    if (availableTopics.length > 1 && !excludedTopics.includes(topicIndex)) {
      setExcludedTopics([...excludedTopics, topicIndex])
      // Переходим к следующей команде
      setCurrentTeamIndex((prev) => (prev + 1) % sortedTeams.length)
    }
  }

  const handleContinueToQuestion = () => {
    if (selectedTopicIndex !== null) {
      navigate('/final/question')
    }
  }

  return (
    <div className="final-round-screen">
      <GameSettings />
      <div className="final-header">
        <h1>Финальный раунд</h1>
      </div>

      <div className="final-content">
        <div className="topic-selection">
          <h2>Выбор темы</h2>
          <p className="instruction">
            Команды по очереди убирают темы. Кликните по теме, чтобы её убрать.
            <br />
            Осталось тем: <strong>{availableTopics.length}</strong>
          </p>
          <div className="topics-grid">
            {gameState.finalRound.topics.map((topic, index) => {
              const isExcluded = excludedTopics.includes(index)
              return (
                <button
                  key={index}
                  className={`topic-button ${isExcluded ? 'excluded' : ''}`}
                  onClick={() => handleTopicClick(index)}
                  disabled={isExcluded || availableTopics.length <= 1}
                >
                  {isExcluded ? '✗' : topic.name}
                </button>
              )
            })}
          </div>

          {selectedTopicIndex !== null && (
            <div className="selected-topic-section">
              <div className="selected-topic">
                <h2>Выбранная тема:</h2>
                <div className="topic-name">{gameState.finalRound.topics[selectedTopicIndex].name}</div>
              </div>
              <p className="instruction">
                Перейдите в панель ведущего для ввода ставок команд
              </p>
              
              <div className="teams-bets-status">
                <h3>Статус ставок команд:</h3>
                <div className="teams-status-list">
                  {teamsWithBets.map(({ team, hasBet }) => (
                    <div 
                      key={team.id} 
                      className={`team-bet-status-item ${hasBet ? 'bet-submitted' : ''}`}
                    >
                      <div className="team-bet-status-name">{team.name}</div>
                      <div className="team-bet-status-indicator">
                        {hasBet ? '✓ Ставка засчитана' : '⏳ Ожидание ставки'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Кнопка перехода к вопросу, когда все ставки выставлены */}
              {teamsWithBets.length > 0 && teamsWithBets.every(({ hasBet }) => hasBet) && (
                <div className="start-question-section">
                  <button 
                    onClick={handleContinueToQuestion}
                    className="start-question-button"
                  >
                    Все ставки выставлены - Перейти к вопросу
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
