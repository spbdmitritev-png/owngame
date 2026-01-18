import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import './HostScreen.css'

export default function HostScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { gameState, updateTeamScore, setFinalAnswer, setFinalBet, setFinalTeamAnswer } = useGame()
  const [phase, setPhase] = useState<'bets' | 'question' | 'results'>('bets')
  const [teams, setTeams] = useState<Array<{ id: string; name: string; shortName: string; score: number }>>([])
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>({})
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [pointsInput, setPointsInput] = useState<string>('')
  const [showBetModal, setShowBetModal] = useState(false)
  const [betInput, setBetInput] = useState<string>('')
  const [editingAnswerTeamId, setEditingAnswerTeamId] = useState<string | null>(null)
  const [editingAnswerText, setEditingAnswerText] = useState<string>('')

  // Загружаем команды из localStorage или gameState
  useEffect(() => {
    if (gameState && gameState.teams) {
      // Всегда используем актуальные счета из gameState
      setTeams(gameState.teams)
      // Загружаем уже проверенные ответы
      if (gameState.finalAnswers) {
        setCheckedAnswers(gameState.finalAnswers)
      }
    } else {
      const gameConfig = localStorage.getItem('gameConfig')
      if (gameConfig) {
        try {
          const config = JSON.parse(gameConfig)
          if (config.teams) {
            setTeams(config.teams.map((t: any) => ({ ...t, score: 0 })))
          }
        } catch (error) {
          console.error('Error parsing game config:', error)
        }
      }
    }
  }, [gameState])

  // Обновляем команды в реальном времени - следим за изменением счетов команд и ставок
  useEffect(() => {
    if (gameState && gameState.teams) {
      // Создаем новый массив, чтобы React заметил изменение
      setTeams([...gameState.teams])
    }
  }, [
    gameState?.teams?.map(t => `${t.id}:${t.score}`).join('|'),
    gameState?.finalBets ? Object.keys(gameState.finalBets).map(id => `${id}:${gameState.finalBets[id]}`).join('|') : ''
  ])

  // Обновляем checkedAnswers в реальном времени при изменении gameState.finalAnswers
  useEffect(() => {
    if (gameState?.finalAnswers) {
      setCheckedAnswers(gameState.finalAnswers)
    } else {
      setCheckedAnswers({})
    }
  }, [gameState?.finalAnswers ? JSON.stringify(gameState.finalAnswers) : ''])

  // Принудительно обновляем команды при изменении finalBets для реактивности
  useEffect(() => {
    if (gameState && gameState.teams) {
      setTeams([...gameState.teams])
    }
  }, [
    gameState?.finalBets ? JSON.stringify(gameState.finalBets) : '',
    gameState?.teams ? JSON.stringify(gameState.teams.map(t => ({ id: t.id, score: t.score }))) : ''
  ])

  // Определяем фазу финального раунда на основе gameState
  useEffect(() => {
    if (gameState) {
      // Если есть выбранная финальная тема, значит мы в финальном раунде
      if (gameState.selectedFinalTopic !== null) {
        // В панели ведущего: если есть ставки, показываем фазу 'bets'
        // После нажатия кнопки "Все ставки выставлены" фаза меняется на 'question' вручную
        // Если есть ответы, значит вопрос уже начался - показываем фазу 'question'
        if (Object.keys(gameState.finalAnswers || {}).length > 0) {
          setPhase('question')
        } else if (Object.keys(gameState.finalBets || {}).length > 0) {
          // Если есть ставки, но нет ответов, значит фаза 'bets'
          // Но если фаза уже установлена в 'question' (после нажатия кнопки), не меняем её
          if (phase !== 'question') {
            setPhase('bets')
          }
        } else {
          setPhase('bets')
        }
      } else {
        setPhase('' as any)
      }
    }
  }, [gameState?.selectedFinalTopic, gameState?.finalBets, gameState?.finalAnswers, phase])

  const handleEditAnswer = (teamId: string) => {
    const currentAnswer = gameState?.finalTeamAnswers?.[teamId] || ''
    setEditingAnswerTeamId(teamId)
    setEditingAnswerText(currentAnswer)
  }

  const handleSaveAnswer = (teamId: string) => {
    if (editingAnswerText.trim()) {
      setFinalTeamAnswer(teamId, editingAnswerText.trim())
    }
    setEditingAnswerTeamId(null)
    setEditingAnswerText('')
  }

  const handleCancelEditAnswer = () => {
    setEditingAnswerTeamId(null)
    setEditingAnswerText('')
  }

  const handleCheckAnswer = (teamId: string, bet: number, isCorrect: boolean) => {
    setFinalAnswer(teamId, isCorrect)
    setCheckedAnswers({ ...checkedAnswers, [teamId]: isCorrect })
    if (isCorrect) {
      updateTeamScore(teamId, bet)
    } else {
      updateTeamScore(teamId, -bet)
    }
  }

  const handleBackToQuestion = () => {
    navigate('/final/question')
  }


  const handleAddPointsClick = (teamId: string) => {
    setSelectedTeamId(teamId)
    setPointsInput('')
    setShowPointsModal(true)
  }

  const handlePointsSubmit = () => {
    if (selectedTeamId && pointsInput.trim() !== '') {
      const points = parseInt(pointsInput)
      if (!isNaN(points) && points !== 0) {
        console.log('[HostScreen] Adding points to team:', selectedTeamId, 'points:', points)
        updateTeamScore(selectedTeamId, points)
        // Закрываем модальное окно после успешного сохранения
        setShowPointsModal(false)
        setSelectedTeamId(null)
        setPointsInput('')
      } else {
        alert('Введите корректное число очков (не 0)')
      }
    } else {
      alert('Введите количество очков')
    }
  }

  const handlePointsCancel = () => {
    setShowPointsModal(false)
    setSelectedTeamId(null)
    setPointsInput('')
  }

  const handleBetClick = (teamId: string) => {
    setSelectedTeamId(teamId)
    const currentBet = gameState?.finalBets?.[teamId] || ''
    setBetInput(currentBet ? String(currentBet) : '')
    setShowBetModal(true)
  }

  const handleBetSubmit = () => {
    if (selectedTeamId && betInput.trim() !== '') {
      const bet = parseInt(betInput)
      if (!isNaN(bet) && bet >= 0) {
        console.log('[HostScreen] Setting bet for team:', selectedTeamId, 'bet:', bet)
        setFinalBet(selectedTeamId, bet)
        // Закрываем модальное окно после успешного сохранения
        setShowBetModal(false)
        setSelectedTeamId(null)
        setBetInput('')
      } else {
        alert('Введите корректное число для ставки (0 или больше)')
      }
    } else {
      alert('Введите ставку')
    }
  }

  const handleBetCancel = () => {
    setShowBetModal(false)
    setSelectedTeamId(null)
    setBetInput('')
  }

  const handleStartQuestion = () => {
    // Проверяем, что все команды с положительными баллами имеют ставки
    if (gameState) {
      const eligibleTeams = gameState.teams.filter((team) => {
        const scoreBeforeFinal = getScoreBeforeFinal(team.id)
        return scoreBeforeFinal >= 0
      })
      
      const allHaveBets = eligibleTeams.every((team) => {
        const bet = gameState.finalBets?.[team.id]
        return bet !== undefined && bet > 0
      })
      
      if (allHaveBets) {
        // Просто обновляем фазу в панели ведущего, чтобы показать кнопки верно/неверно
        // Переход на страницу вопроса будет происходить на главном экране
        setPhase('question')
      } else {
        alert('Выставьте ставки для всех команд, которые могут участвовать')
      }
    }
  }

  // Используем gameState напрямую для получения актуальных счетов
  // Используем gameState напрямую для реактивности
  // Используем gameState напрямую для реактивности
  const currentTeams = gameState?.teams || teams
  const sortedTeams = currentTeams.length > 0 
    ? [...currentTeams].sort((a, b) => b.score - a.score)
    : []
  
  // Вычисляем статусы ставок напрямую из gameState для реактивности
  const getBetForTeam = (teamId: string) => {
    return gameState?.finalBets?.[teamId]
  }
  
  // Вычисляем статусы ставок напрямую из gameState для реактивности
  const hasBet = (teamId: string) => {
    const bet = gameState?.finalBets?.[teamId]
    return bet !== undefined && bet > 0
  }
  
  // Вычисляем статусы ответов напрямую из gameState для реактивности
  const hasAnswer = (teamId: string) => {
    return teamId in (gameState?.finalAnswers || {})
  }

  // Вычисляем очки до финального раунда для каждой команды
  const getScoreBeforeFinal = (teamId: string): number => {
    if (!gameState) return 0
    const team = gameState.teams.find(t => t.id === teamId)
    if (!team) return 0
    
    // Если мы в фазе ставок (до финального вопроса), то текущие очки = очки до финала
    if (phase === 'bets') {
      return team.score
    }
    
    // Если мы в фазе вопроса или результатов, вычитаем финальные баллы
    const finalBet = gameState.finalBets?.[teamId] || 0
    const finalAnswer = gameState.finalAnswers?.[teamId]
    let finalPoints = 0
    if (finalAnswer !== undefined) {
      finalPoints = finalAnswer ? finalBet : -finalBet
    }
    // Текущий счет минус финальные баллы = счет до финала
    return team.score - finalPoints
  }

  if (teams.length === 0) {
    return (
      <div className="host-screen">
        <div className="host-header">
          <h1>Панель ведущего</h1>
          <div className="loading-message">
            Загрузка данных... Убедитесь, что игра запущена.
          </div>
        </div>
      </div>
    )
  }

  // Если не в финальном раунде, показываем сообщение
  if (gameState?.selectedFinalTopic === null) {
    return (
      <div className="host-screen">
        <div className="host-header">
          <h1>Панель ведущего</h1>
          <div className="loading-message">
            Панель ведущего доступна только в финальном раунде
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="host-screen">
      <div className="host-header">
        <h1>Панель ведущего</h1>
        <div className="phase-indicator">
          Фаза: {phase === 'bets' ? 'Ставки' : phase === 'question' ? 'Вопрос' : 'Результаты'}
        </div>
      </div>

      {showPointsModal && (
        <div className="host-modal-overlay" onClick={handlePointsCancel}>
          <div className="host-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Добавить баллы</h3>
            <div className="host-modal-content">
              <label>
                Количество баллов:
                <input
                  type="number"
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  className="host-points-input"
                  placeholder="Введите число"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePointsSubmit()
                    } else if (e.key === 'Escape') {
                      handlePointsCancel()
                    }
                  }}
                />
              </label>
              <div className="host-modal-buttons">
                <button onClick={handlePointsSubmit} className="host-modal-button submit">
                  Готово
                </button>
                <button onClick={handlePointsCancel} className="host-modal-button cancel">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'bets' && (
        <div className="host-section">
          <h2>Ставки команд (Финальный раунд)</h2>
          <div className="host-list">
            {sortedTeams.map((team) => {
              const bet = gameState?.finalBets?.[team.id]
              const scoreBeforeFinal = getScoreBeforeFinal(team.id)
              const canParticipate = scoreBeforeFinal >= 0
              return (
                <div 
                  key={team.id} 
                  className={`host-item-wrapper ${!canParticipate ? 'team-negative-score' : ''}`}
                >
                  <div className={`host-item ${!canParticipate ? 'negative-score' : ''}`}>
                    <div className="host-team-info">
                      <div className="host-team-name">{team.name}</div>
                      <div className={`host-team-score-before ${!canParticipate ? 'negative' : ''}`}>
                        Очки до финала: {scoreBeforeFinal}
                        {!canParticipate && <span className="warning-text"> (не может участвовать)</span>}
                      </div>
                      <div className="host-team-bet">
                        Ставка: {bet !== undefined && bet > 0 ? bet : 'Не выставлена'}
                      </div>
                    </div>
                  </div>
                  <div className="host-buttons-group">
                    {canParticipate && (
                      <button
                        onClick={() => handleBetClick(team.id)}
                        className="host-bet-button"
                        title="Добавить ставку"
                      >
                        {bet !== undefined && bet > 0 ? '✏️ Ставка' : '💰 Ставка'}
                      </button>
                    )}
                    <button
                      onClick={() => handleAddPointsClick(team.id)}
                      className={`host-add-points-button ${!canParticipate ? 'urgent' : ''}`}
                      title={!canParticipate ? 'Добавить очки до положительного значения' : 'Добавить очки'}
                    >
                      ➕ Очки
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {gameState && gameState.teams
            .filter((team) => {
              // Учитываем только команды с положительными баллами до финала
              const scoreBeforeFinal = getScoreBeforeFinal(team.id)
              return scoreBeforeFinal >= 0
            })
            .every((team) => {
              const bet = gameState.finalBets?.[team.id]
              return bet !== undefined && bet > 0
            }) && (
            <div className="host-complete-section">
              <button onClick={handleStartQuestion} className="host-complete-button">
                Все ставки выставлены - Перейти к вопросу
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'question' && (
        <div className="host-section">
          <h2>Ответы команд (Финальный раунд)</h2>
          {(() => {
            // Получаем правильный ответ из финального вопроса
            const selectedTopicIndex = gameState?.selectedFinalTopic ?? 0
            const selectedQuestionIndex = gameState?.selectedFinalQuestion ?? 0
            const selectedTopic = gameState?.finalRound?.topics?.[selectedTopicIndex]
            const question = selectedTopic?.questions?.[selectedQuestionIndex]
            const correctAnswer = question?.answer || ''

            return (
              <div className="host-list">
                {sortedTeams
                  .filter((team) => {
                    // Показываем только команды с положительными баллами до финала и ставкой
                    const scoreBeforeFinal = getScoreBeforeFinal(team.id)
                    const bet = gameState?.finalBets?.[team.id] || 0
                    return scoreBeforeFinal >= 0 && bet > 0
                  })
                  .map((team) => {
                    const teamAnswer = gameState?.finalTeamAnswers?.[team.id] || ''
                    const bet = gameState?.finalBets?.[team.id] || 0
                    const scoreBeforeFinal = getScoreBeforeFinal(team.id)
                    const isChecked = team.id in checkedAnswers
                    const isCorrect = checkedAnswers[team.id] || false
                    const isEditing = editingAnswerTeamId === team.id
                    return (
                      <div key={team.id} className="host-item">
                        <div className="host-team-info">
                          <div className="host-team-name">{team.name}</div>
                          <div className="host-team-score-before">
                            Очки до финала: {scoreBeforeFinal}
                          </div>
                          <div className="host-team-bet">
                            Ставка: {bet}
                          </div>
                        </div>
                        <div className="host-answer-input-section">
                          {isEditing ? (
                            <div className="host-answer-input-wrapper">
                              <textarea
                                value={editingAnswerText}
                                onChange={(e) => setEditingAnswerText(e.target.value)}
                                className="host-answer-textarea"
                                placeholder="Введите ответ команды"
                                rows={3}
                                autoFocus
                              />
                              <div className="host-answer-input-buttons">
                                <button
                                  onClick={() => handleSaveAnswer(team.id)}
                                  className="host-answer-input-button save"
                                >
                                  Сохранить
                                </button>
                                <button
                                  onClick={handleCancelEditAnswer}
                                  className="host-answer-input-button cancel"
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="host-answer-display">
                              {teamAnswer ? (
                                <div className="host-answer-text">{teamAnswer}</div>
                              ) : (
                                <span className="waiting">Ответ не введен</span>
                              )}
                              {!isChecked && (
                                <button
                                  onClick={() => handleEditAnswer(team.id)}
                                  className="host-edit-answer-button"
                                >
                                  {teamAnswer ? 'Изменить ответ' : 'Ввести ответ'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={`host-answer-controls ${isChecked ? 'checked' : ''}`}>
                          {!isChecked ? (
                            <>
                              {teamAnswer && (
                                <>
                                  <button
                                    onClick={() => handleCheckAnswer(team.id, bet, true)}
                                    className="host-answer-button correct"
                                  >
                                    Верно
                                  </button>
                                  <button
                                    onClick={() => handleCheckAnswer(team.id, bet, false)}
                                    className="host-answer-button incorrect"
                                  >
                                    Неверно
                                  </button>
                                </>
                              )}
                              {!teamAnswer && (
                                <div className="host-no-answer-hint">
                                  Сначала введите ответ команды
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className={`host-answer-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                                {isCorrect ? '✓ Верно' : '✗ Неверно'}
                              </div>
                              {correctAnswer && (
                                <div className="host-correct-answer">
                                  <div className="correct-answer-label">Правильный ответ:</div>
                                  <div className="correct-answer-text">{correctAnswer}</div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )
          })()}
          {teams.length > 0 && teams.every((team) => team.id in checkedAnswers) && (
            <div className="host-complete-section">
              <button onClick={handleBackToQuestion} className="host-complete-button">
                Назад к вопросам
              </button>
            </div>
          )}
        </div>
      )}

      {showBetModal && (
        <div className="host-modal-overlay" onClick={handleBetCancel}>
          <div className="host-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Выставить ставку</h3>
            <div className="host-modal-content">
              <label>
                Ставка команды:
                <input
                  type="number"
                  value={betInput}
                  onChange={(e) => setBetInput(e.target.value)}
                  className="host-points-input"
                  placeholder="Введите ставку"
                  autoFocus
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBetSubmit()
                    } else if (e.key === 'Escape') {
                      handleBetCancel()
                    }
                  }}
                />
              </label>
              <div className="host-modal-buttons">
                <button onClick={handleBetSubmit} className="host-modal-button submit">
                  Готово
                </button>
                <button onClick={handleBetCancel} className="host-modal-button cancel">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

