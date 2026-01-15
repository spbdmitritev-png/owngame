import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import GameSettings from '../components/GameSettings'
import MediaPlayer from '../components/MediaPlayer'
import './FinalQuestionScreen.css'


export default function FinalQuestionScreen() {
  const navigate = useNavigate()
  const { gameState } = useGame()
  const [timeLeft, setTimeLeft] = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [allAnswersSubmitted, setAllAnswersSubmitted] = useState(false)
  const [phase, setPhase] = useState<'bets' | 'question' | 'results'>('question')

  if (!gameState) {
    return <div>Загрузка...</div>
  }

  // Находим выбранный вопрос
  const selectedTopicIndex = gameState.selectedFinalTopic ?? 0
  const selectedQuestionIndex = gameState.selectedFinalQuestion ?? 0
  const selectedTopic = gameState.finalRound.topics[selectedTopicIndex]
  const question = selectedTopic?.questions[selectedQuestionIndex]

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const handleStartTimer = () => {
    setIsRunning(true)
  }

  const handleStopTimer = () => {
    setIsRunning(false)
  }

  const handleResetTimer = () => {
    setIsRunning(false)
    setTimeLeft(60)
  }

  // Получаем команды с ставками реактивно через useState + useEffect
  const [teamsWithBets, setTeamsWithBets] = useState<typeof gameState.teams>([])
  const [allAnswersChecked, setAllAnswersChecked] = useState(false)
  const [renderKey, setRenderKey] = useState(0)
  
  // Создаем ключи для отслеживания изменений
  const finalBetsString = gameState?.finalBets ? JSON.stringify(gameState.finalBets) : '{}'
  const finalAnswersString = gameState?.finalAnswers ? JSON.stringify(gameState.finalAnswers) : '{}'
  const teamsIdsString = gameState?.teams ? JSON.stringify(gameState.teams.map(t => t.id)) : '[]'
  
  useEffect(() => {
    if (!gameState) {
      setTeamsWithBets([])
      setAllAnswersChecked(false)
      return
    }
    
    // Получаем команды с ставками
    const teams = gameState.teams.filter((team) => {
      const bet = gameState.finalBets?.[team.id]
      return bet !== undefined && bet > 0
    })
    setTeamsWithBets(teams)
    
    // Проверяем, все ли ответы приняты
    if (teams.length === 0) {
      setAllAnswersChecked(false)
    } else {
      const allChecked = teams.every((team) => {
        return gameState.finalAnswers?.[team.id] !== undefined
      })
      setAllAnswersChecked(allChecked)
    }
    
    // Принудительно обновляем компонент для гарантированной перерисовки
    setRenderKey(prev => prev + 1)
  }, [finalBetsString, finalAnswersString, teamsIdsString])

  const handleFinish = () => {
    navigate('/final/results')
  }

  if (!question) {
    return <div>Вопрос не найден</div>
  }

  return (
    <div className="final-question-screen">
      <GameSettings />
      <div className="final-question-header">
        <h1>Финальный вопрос</h1>
        <div className="final-topic-name">{selectedTopic.name} - Вопрос {selectedQuestionIndex + 1}</div>
      </div>

      <div className="timer-section">
        <div className={`timer ${timeLeft <= 10 ? 'warning' : ''} ${timeLeft === 0 ? 'finished' : ''}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <div className="timer-controls">
          {!isRunning && timeLeft > 0 && (
            <button onClick={handleStartTimer} className="timer-button start">
              Запустить таймер
            </button>
          )}
          {isRunning && (
            <button onClick={handleStopTimer} className="timer-button stop">
              Остановить
            </button>
          )}
          <button onClick={handleResetTimer} className="timer-button reset">
            Сбросить
          </button>
        </div>
      </div>

      <div className="question-content">
        <div className="question-text">{question.text}</div>
        {question.mediaUrl && (
          <div className="question-media">
            {question.type === 'image' && (
              <img src={question.mediaUrl} alt="Question media" />
            )}
            {(question.type === 'video' || question.type === 'audio') && (
              <MediaPlayer src={question.mediaUrl} type={question.type} />
            )}
          </div>
        )}
      </div>

      {timeLeft === 0 && (
        <div className="time-up-message">
          <h2>Время вышло!</h2>
          <p>Команды отправляют ответы</p>
        </div>
      )}

      {allAnswersSubmitted && (
        <div className="all-answers-submitted">
          <h2>✓ Все команды отправили ответы</h2>
        </div>
      )}

      {/* Статус ответов команд */}
      <div className="teams-answers-status">
        <h3>Статус ответов команд:</h3>
        <div className="teams-answers-list" key={renderKey}>
          {teamsWithBets.map((team) => {
            // Всегда читаем актуальные данные напрямую из gameState
            const isChecked = gameState?.finalAnswers?.[team.id] !== undefined
            return (
              <div 
                key={team.id} 
                className={`team-answer-status-item ${isChecked ? 'checked' : ''}`}
              >
                <div className="team-answer-status-name">{team.name}</div>
                <div className="team-answer-status-indicator">
                  {isChecked ? (
                    <span className="answer-accepted">✓ Ответ принят</span>
                  ) : (
                    <span className="answer-pending">⏳ Ожидание проверки</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button 
        onClick={handleFinish} 
        className="finish-button"
        disabled={!allAnswersChecked}
      >
        {allAnswersChecked ? 'Перейти к результатам' : 'Ожидание проверки ответов...'}
      </button>
    </div>
  )
}

