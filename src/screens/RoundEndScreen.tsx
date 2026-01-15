import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import GameSettings from '../components/GameSettings'
import './RoundEndScreen.css'

export default function RoundEndScreen() {
  const { roundNumber } = useParams<{ roundNumber: string }>()
  const navigate = useNavigate()
  const { gameState } = useGame()

  const [visibleTeams, setVisibleTeams] = useState<string[]>([])
  const [showContinueButton, setShowContinueButton] = useState(false)
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)

  if (!gameState || !roundNumber) {
    return <div>Загрузка...</div>
  }

  const roundNum = parseInt(roundNumber)
  const sortedTeams = useMemo(() => {
    return [...gameState.teams].sort((a, b) => b.score - a.score)
  }, [gameState.teams])

  // Инвертируем порядок: последняя команда появляется первой
  const totalTeams = sortedTeams.length
  const reversedTeams = useMemo(() => {
    return [...sortedTeams].reverse()
  }, [sortedTeams])

  const handleNextTeam = () => {
    if (currentTeamIndex < totalTeams) {
      const team = reversedTeams[currentTeamIndex]
      setVisibleTeams((prev) => [...prev, team.id])
      setCurrentTeamIndex((prev) => prev + 1)
      
      // Показываем кнопку после появления последней команды (первое место)
      if (currentTeamIndex === totalTeams - 1) {
        setTimeout(() => {
          setShowContinueButton(true)
        }, 300)
      }
    }
  }

  const handleContinue = () => {
    if (roundNum < gameState.numberOfRounds) {
      // Переходим к трейлеру следующего раунда
      navigate(`/game-trailer/${roundNum + 1}`)
    } else {
      navigate('/final')
    }
  }

  const allTeamsShown = currentTeamIndex >= totalTeams

  const handleScreenClick = (e: React.MouseEvent) => {
    // Не обрабатываем клик, если кликнули на кнопку, настройки или на элемент списка команд
    const target = e.target as HTMLElement
    if (
      target.closest('.continue-button') ||
      target.closest('.game-settings') ||
      target.closest('.leaderboard-item') ||
      target.closest('.teams-list')
    ) {
      return
    }
    
    if (!allTeamsShown) {
      handleNextTeam()
    }
  }

  return (
    <div className="round-end-screen" onClick={handleScreenClick}>
      <GameSettings />
      <div className="round-end-header">
        <h1>Раунд {roundNum} завершён!</h1>
      </div>

      <div className="leaderboard">
        <h2>Рейтинг команд</h2>
        {!allTeamsShown && (
          <div className="click-hint">
            Нажмите на экран, чтобы показать следующую команду
          </div>
        )}
        <div className="teams-list">
          {sortedTeams.map((team, index) => (
            <div
              key={team.id}
              className={`leaderboard-item ${visibleTeams.includes(team.id) ? 'visible' : ''} ${index === 0 ? 'first' : ''} ${index === 1 ? 'second' : ''} ${index === 2 ? 'third' : ''}`}
            >
              <div className="rank">{index + 1}</div>
              <div className="team-info">
                <div className="team-short-name">{team.shortName}</div>
                <div className="team-name">{team.name}</div>
              </div>
              <div className="team-score">{team.score}</div>
            </div>
          ))}
        </div>
      </div>

      {showContinueButton && (
        <button onClick={handleContinue} className="continue-button">
          {roundNum < gameState.numberOfRounds
            ? `Перейти к раунду ${roundNum + 1}`
            : 'Перейти к финальному раунду'}
        </button>
      )}
    </div>
  )
}

