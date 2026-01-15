import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import GameSettings from '../components/GameSettings'
import './RoundScreen.css'

export default function RoundScreen() {
  const { roundNumber } = useParams<{ roundNumber: string }>()
  const navigate = useNavigate()
  const { gameState } = useGame()

  if (!gameState || !roundNumber) {
    return <div>Загрузка...</div>
  }

  const roundNum = parseInt(roundNumber)
  const round = gameState.rounds[roundNum - 1]

  if (!round) {
    return <div>Раунд не найден</div>
  }

  const handleQuestionClick = (topicIndex: number, valueIndex: number) => {
    const question = round.topics[topicIndex].questions[valueIndex]
    if (question.isPlayed) return

    navigate(`/question/${roundNum}/${topicIndex}/${valueIndex}`)
  }

  const allQuestionsPlayed = round.topics.every((topic) =>
    topic.questions.every((q) => q.isPlayed)
  )

  const sortedTeams = [...gameState.teams].sort((a, b) => b.score - a.score)

  return (
    <div className="round-screen">
      <GameSettings />
      <div className="round-header">
        <h1>Раунд {roundNum}</h1>
      </div>
      <div className="teams-panel">
        {sortedTeams.map((team, index) => (
          <div key={team.id} className={`team-card ${index === 0 ? 'leader' : ''}`}>
            <div className="team-rank">{index + 1}</div>
            <div className="team-info">
              <div className="team-short-name">{team.shortName}</div>
              <div className="team-name">{team.name}</div>
            </div>
            <div className="team-score">{team.score}</div>
          </div>
        ))}
      </div>

      <div className="questions-grid">
        <div className="grid-header">
          <div className="header-cell corner-cell"></div>
          {round.values.map((value, valueIndex) => (
            <div key={valueIndex} className="header-cell value-header">
              {value}
            </div>
          ))}
        </div>

        <div className="questions-grid-content">
          {round.topics.map((topic, topicIndex) => (
            <div key={topicIndex} className="grid-row">
              <div className="topic-cell">{topic.name}</div>
              {round.values.map((value, valueIndex) => {
                const question = topic.questions[valueIndex]
                const isPlayed = question?.isPlayed || false

                return (
                  <button
                    key={valueIndex}
                    className={`question-cell ${isPlayed ? 'played' : ''}`}
                    onClick={() => handleQuestionClick(topicIndex, valueIndex)}
                    disabled={isPlayed}
                  >
                    {isPlayed ? '' : value}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {allQuestionsPlayed && (
        <div className="round-complete-overlay">
          <div className="round-complete-content">
            <h2>Все вопросы раунда сыграны!</h2>
            <button
              onClick={() => navigate(`/round-end/${roundNum}`)}
              className="continue-button"
            >
              Перейти к итогам раунда
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

