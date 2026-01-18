import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import GameSettings from '../components/GameSettings'
import './FinalResultsScreen.css'

export default function FinalResultsScreen() {
  const navigate = useNavigate()
  const { gameState } = useGame()
  const [teamsAnswers, setTeamsAnswers] = useState<Record<string, string>>({})
  const [teamsBets, setTeamsBets] = useState<Record<string, number>>({})
  const [shownAnswers, setShownAnswers] = useState<Set<string>>(new Set())
  const [shownBets, setShownBets] = useState<Set<string>>(new Set())
  const [showScoresBeforeFinal, setShowScoresBeforeFinal] = useState(false)
  const [showFinalTable, setShowFinalTable] = useState(false)
  const [revealedPositions, setRevealedPositions] = useState<number>(0) // Количество открытых позиций
  const [scoresBeforeFinal, setScoresBeforeFinal] = useState<Record<string, number>>({})

  if (!gameState) {
    return <div>Загрузка...</div>
  }

  // Получаем команды с ставками (те, кто участвовал в финале)
  const eligibleTeams = useMemo(() => {
    return gameState.teams.filter((team) => {
      const finalBet = gameState.finalBets[team.id] || 0
      const finalAnswer = gameState.finalAnswers?.[team.id]
      let finalPoints = 0
      if (finalAnswer !== undefined) {
        finalPoints = finalAnswer ? finalBet : -finalBet
      }
      const scoreBeforeFinal = team.score - finalPoints
      return scoreBeforeFinal >= 0 && (finalBet > 0 || finalAnswer !== undefined)
    })
  }, [gameState.teams, gameState.finalBets, gameState.finalAnswers])

  // Загружаем ответы и ставки из gameState
  useEffect(() => {
    if (gameState) {
      // Используем ответы из gameState.finalTeamAnswers (введенные ведущим)
      const answersMap: Record<string, string> = {}
      if (gameState.finalTeamAnswers) {
        Object.entries(gameState.finalTeamAnswers).forEach(([teamId, answer]) => {
          if (answer && answer.trim()) {
            answersMap[teamId] = answer
          }
        })
      }
      setTeamsAnswers(answersMap)

      // Используем ставки из gameState.finalBets
      const betsMap: Record<string, number> = {}
      if (gameState.finalBets) {
        Object.entries(gameState.finalBets).forEach(([teamId, bet]) => {
          if (bet > 0) {
            betsMap[teamId] = bet
          }
        })
      }
      setTeamsBets(betsMap)
    }
  }, [gameState])

  // Вычисляем очки до финального раунда
  useEffect(() => {
    if (gameState) {
      const scores: Record<string, number> = {}
      gameState.teams.forEach((team) => {
        const finalBet = gameState.finalBets[team.id] || 0
        const finalAnswer = gameState.finalAnswers[team.id]
        let finalPoints = 0
        if (finalAnswer !== undefined) {
          finalPoints = finalAnswer ? finalBet : -finalBet
        }
        scores[team.id] = team.score - finalPoints
      })
      setScoresBeforeFinal(scores)
    }
  }, [gameState])

  const handleShowAnswer = (teamId: string) => {
    setShownAnswers((prev) => new Set([...prev, teamId]))
  }

  const handleShowBet = (teamId: string) => {
    setShownBets((prev) => new Set([...prev, teamId]))
  }

  // Проверяем, все ли ответы показаны
  const allAnswersShown = useMemo(() => {
    return eligibleTeams.every((team) => {
      const hasAnswer = teamsAnswers[team.id] !== undefined
      return !hasAnswer || shownAnswers.has(team.id)
    })
  }, [eligibleTeams, teamsAnswers, shownAnswers])

  // Проверяем, все ли ставки показаны
  const allBetsShown = useMemo(() => {
    return eligibleTeams.every((team) => {
      const hasBet = teamsBets[team.id] !== undefined && teamsBets[team.id] > 0
      return !hasBet || shownBets.has(team.id)
    })
  }, [eligibleTeams, teamsBets, shownBets])

  const handleShowScoresBeforeFinal = () => {
    if (allBetsShown) {
      setShowScoresBeforeFinal(true)
    }
  }

  const handleShowFinalTable = () => {
    if (showScoresBeforeFinal) {
      setShowFinalTable(true)
    }
  }

  // Финальная таблица с отсортированными командами (только те, кто участвовал в финале)
  // Сортируем от большего к меньшему (1 место = наибольший счет)
  const finalSortedTeams = useMemo(() => {
    return [...eligibleTeams].sort((a, b) => b.score - a.score)
  }, [eligibleTeams])

  // Обратный порядок для отображения (показываем с последнего места к первому)
  const reversedTeams = useMemo(() => {
    return [...finalSortedTeams].reverse()
  }, [finalSortedTeams])

  const handleRevealNextPosition = () => {
    if (revealedPositions < finalSortedTeams.length) {
      setRevealedPositions((prev) => prev + 1)
    }
  }

  return (
    <div className="final-results-screen">
      <GameSettings />
      <div className="final-results-header">
        <h1>Финальные результаты</h1>
      </div>
      <div className="final-results-content">
      {/* Этап 1: Ответы и ставки вместе */}
      {!showScoresBeforeFinal && (
        <div className="teams-answers-stage">
          <h2>Ответы и ставки команд</h2>
          <div className="teams-list">
            {eligibleTeams.map((team) => {
              const answer = teamsAnswers[team.id]
              const bet = teamsBets[team.id]
              const answerShown = shownAnswers.has(team.id)
              const betShown = shownBets.has(team.id)
              const hasAnswer = answer !== undefined
              const hasBet = bet !== undefined && bet > 0

          return (
                <div key={team.id} className="team-result-item">
                  <div className="team-result-info">
                    <div className="team-result-name">{team.name}</div>
                    <div className="team-result-short">{team.shortName}</div>
                  </div>
                  <div className="team-result-content">
                    {/* Ответ */}
                    <div className="team-result-answer-section">
                      {hasAnswer ? (
                        answerShown ? (
                          <div className="team-answer-display">
                            <div className="answer-label">Ответ:</div>
                            <div className="answer-text">{answer}</div>
                          </div>
                        ) : (
                          <button
                            className="show-answer-button"
                            onClick={() => handleShowAnswer(team.id)}
                          >
                            Показать ответ
                          </button>
                        )
                      ) : (
                        <div className="no-answer-message">Ответ не был отправлен</div>
                      )}
              </div>
                    {/* Ставка - показывается только когда все ответы открыты */}
                    {allAnswersShown && (
                      <div className="team-result-bet-section">
                        {hasBet ? (
                          betShown ? (
                            <div className="team-bet-display">
                <div className="bet-label">Ставка:</div>
                <div className="bet-value">{bet}</div>
              </div>
                          ) : (
                    <button
                              className="show-bet-button"
                              onClick={() => handleShowBet(team.id)}
                    >
                              Показать ставку
                    </button>
                          )
                        ) : (
                          <div className="no-bet-message">Ставка не была сделана</div>
                        )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
          {allAnswersShown && allBetsShown && (
            <div className="stage-progress-hint">
              <p>Все ответы и ставки показаны</p>
              <button className="next-stage-button" onClick={handleShowScoresBeforeFinal}>
                Показать очки до финала
              </button>
            </div>
          )}
        </div>
      )}

      {/* Этап 3: Очки до финального раунда */}
      {allBetsShown && showScoresBeforeFinal && !showFinalTable && (
        <div className="scores-before-final-stage" onClick={handleShowFinalTable}>
          <h2>Результаты всех раундов (до финального)</h2>
          <div className="scores-before-final-list">
            {eligibleTeams.map((team) => {
              const scoreBefore = scoresBeforeFinal[team.id] || 0
              return (
                <div key={team.id} className="score-before-item">
                  <div className="score-before-team">
                    <div className="score-before-name">{team.name}</div>
                    <div className="score-before-short">{team.shortName}</div>
                  </div>
                  <div className="score-before-value">{scoreBefore}</div>
                </div>
              )
            })}
          </div>
          <div className="stage-progress-hint">
            <p>Нажмите на экран, чтобы показать финальные результаты</p>
          </div>
        </div>
      )}

      {/* Этап 4: Финальная таблица с анимацией */}
      {showFinalTable && (
        <div className="final-table-stage" onClick={handleRevealNextPosition}>
          <h2>Финальные результаты</h2>
          <div className="final-positions-list">
            {finalSortedTeams.map((team, index) => {
              // index идет от 0 (первое место) до length-1 (последнее место)
              // realPosition = index + 1 (1 = первое место, 2 = второе, и т.д.)
              const realPosition = index + 1
              // Показываем в обратном порядке - сначала последнее место (index = length-1)
              // displayIndex - это порядок раскрытия: 0 = последнее место, length-1 = первое место
              const displayIndex = finalSortedTeams.length - 1 - index
              const isRevealed = displayIndex < revealedPositions
              
              const scoreBefore = scoresBeforeFinal[team.id] || 0
              const finalBet = gameState.finalBets[team.id] || 0
              const finalAnswer = gameState.finalAnswers?.[team.id]
              let finalPoints = 0
              if (finalAnswer !== undefined) {
                finalPoints = finalAnswer ? finalBet : -finalBet
              }
              const finalScore = team.score

              return (
                <div
                  key={team.id}
                  className={`final-position-item position-${realPosition} ${isRevealed ? 'revealed' : 'hidden'}`}
                >
                  <div className="final-position-rank">{realPosition}</div>
                  <div className="final-position-team">
                    <div className="final-position-short">{team.shortName}</div>
                    <div className="final-position-name">{team.name}</div>
                  </div>
                  <div className="final-position-scores">
                    <div className="score-before-display">{scoreBefore}</div>
                    {finalPoints !== 0 && (
                      <div className={`final-points-display ${finalPoints > 0 ? 'positive' : 'negative'}`}>
                        {finalPoints > 0 ? '+' : ''}{finalPoints}
                      </div>
                    )}
                    <div className="final-score-display">= {finalScore}</div>
                  </div>
                </div>
              )
            })}
          </div>
          {revealedPositions < finalSortedTeams.length && (
            <div className="stage-progress-hint">
              <p>Нажмите на экран, чтобы показать следующую позицию</p>
            </div>
          )}
        </div>
      )}

      {/* Победитель */}
      {showFinalTable && revealedPositions >= finalSortedTeams.length && finalSortedTeams[0] && (
      <div className="final-winner">
          <div className="winner-content">
            <h2>Победитель:</h2>
            <div className="winner-name">{finalSortedTeams[0].name}</div>
            <div className="winner-short">{finalSortedTeams[0].shortName}</div>
            <div className="winner-score">{finalSortedTeams[0].score} очков</div>
          </div>
          <button 
            className="analytics-button"
            onClick={() => navigate('/analytics')}
          >
            Аналитика
          </button>
          </div>
        )}
      </div>
    </div>
  )
}
