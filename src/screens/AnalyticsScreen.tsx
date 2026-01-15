import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import GameSettings from '../components/GameSettings'
import './AnalyticsScreen.css'

export default function AnalyticsScreen() {
  const navigate = useNavigate()
  const { gameState } = useGame()

  if (!gameState) {
    return <div>Загрузка...</div>
  }

  // Вычисляем статистику для каждой команды
  const teamStats = useMemo(() => {
    const stats: Record<string, {
      team: typeof gameState.teams[0]
      correctAnswers: number
      incorrectAnswers: number
      totalAnswers: number
      correctPercentage: number
      strongTopics: Array<{ topicName: string; correct: number; total: number }>
      weakTopics: Array<{ topicName: string; correct: number; total: number }>
      favoriteValue: number | null
      averageValue: number
      totalPoints: number
      valueCounts: Record<number, number> // Подсчет ответов по номиналам
    }> = {}

    // Инициализируем статистику для всех команд
    gameState.teams.forEach(team => {
      stats[team.id] = {
        team,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalAnswers: 0,
        correctPercentage: 0,
        strongTopics: [],
        weakTopics: [],
        favoriteValue: null,
        averageValue: 0,
        totalPoints: team.score,
        valueCounts: {}
      }
    })

    // Используем данные из questionAnswers, если они есть
    const questionAnswers = gameState.questionAnswers || []
    
    questionAnswers.forEach(answer => {
      const stat = stats[answer.teamId]
      if (!stat) return

      // Подсчитываем правильные/неправильные ответы
      if (answer.isCorrect) {
        stat.correctAnswers++
      } else {
        stat.incorrectAnswers++
      }
      stat.totalAnswers++

      // Подсчитываем ответы по номиналам
      if (!stat.valueCounts[answer.value]) {
        stat.valueCounts[answer.value] = 0
      }
      stat.valueCounts[answer.value]++

      // Подсчитываем статистику по темам
      let topicStat = stat.strongTopics.find(t => t.topicName === answer.topicName)
      if (!topicStat) {
        topicStat = { topicName: answer.topicName, correct: 0, total: 0 }
        stat.strongTopics.push(topicStat)
      }
      topicStat.total++
      if (answer.isCorrect) {
        topicStat.correct++
      }
    })

    // Вычисляем проценты и определяем сильные/слабые темы
    Object.values(stats).forEach(stat => {
      if (stat.totalAnswers > 0) {
        stat.correctPercentage = Math.round((stat.correctAnswers / stat.totalAnswers) * 100)
        
        // Вычисляем средний номинал
        let totalValue = 0
        let valueCount = 0
        Object.entries(stat.valueCounts).forEach(([value, count]) => {
          totalValue += parseInt(value) * count
          valueCount += count
        })
        if (valueCount > 0) {
          stat.averageValue = Math.round(totalValue / valueCount)
        }

        // Определяем любимый номинал (самый частый)
        let maxCount = 0
        let favoriteValue: number | null = null
        Object.entries(stat.valueCounts).forEach(([value, count]) => {
          if (count > maxCount) {
            maxCount = count
            favoriteValue = parseInt(value)
          }
        })
        stat.favoriteValue = favoriteValue

        // Разделяем темы на сильные и слабые
        const strong: typeof stat.strongTopics = []
        const weak: typeof stat.weakTopics = []
        
        stat.strongTopics.forEach(topic => {
          const percentage = topic.total > 0 ? (topic.correct / topic.total) * 100 : 0
          if (percentage >= 50) {
            strong.push(topic)
          } else {
            weak.push(topic)
          }
        })
        
        // Сортируем: сильные по проценту правильных (убывание), слабые по проценту правильных (возрастание)
        strong.sort((a, b) => {
          const aPct = a.total > 0 ? (a.correct / a.total) * 100 : 0
          const bPct = b.total > 0 ? (b.correct / b.total) * 100 : 0
          return bPct - aPct
        })
        weak.sort((a, b) => {
          const aPct = a.total > 0 ? (a.correct / a.total) * 100 : 0
          const bPct = b.total > 0 ? (b.correct / b.total) * 100 : 0
          return aPct - bPct
        })
        
        stat.strongTopics = strong
        stat.weakTopics = weak
      }
    })

    // Добавляем финальный раунд
    if (gameState.finalBets && gameState.finalAnswers) {
      Object.entries(gameState.finalAnswers).forEach(([teamId, isCorrect]) => {
        if (stats[teamId]) {
          if (isCorrect) {
            stats[teamId].correctAnswers++
          } else {
            stats[teamId].incorrectAnswers++
          }
          stats[teamId].totalAnswers++
        }
      })
    }

    // Пересчитываем проценты после добавления финального раунда
    Object.values(stats).forEach(stat => {
      if (stat.totalAnswers > 0) {
        stat.correctPercentage = Math.round((stat.correctAnswers / stat.totalAnswers) * 100)
      }
    })

    return stats
  }, [gameState])

  const handleBack = () => {
    navigate('/final/results')
  }

  return (
    <div className="analytics-screen">
      <GameSettings />
      <div className="analytics-header">
        <h1>Аналитика по командам</h1>
        <button className="back-button" onClick={handleBack}>
          ← Назад к результатам
        </button>
      </div>

      <div className="analytics-content">
        {gameState.teams.map(team => {
          const stats = teamStats[team.id]
          if (!stats) return null

          return (
            <div key={team.id} className="team-analytics-card">
              <div className="team-analytics-header">
                <h2>{team.name}</h2>
                <div className="team-short-name">{team.shortName}</div>
              </div>

              <div className="analytics-stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Правильных ответов</div>
                  <div className="stat-value correct">{stats.correctAnswers}</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Неправильных ответов</div>
                  <div className="stat-value incorrect">{stats.incorrectAnswers}</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Процент правильных</div>
                  <div className="stat-value percentage">{stats.correctPercentage}%</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Всего ответов</div>
                  <div className="stat-value">{stats.totalAnswers}</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Средний номинал</div>
                  <div className="stat-value">{stats.averageValue > 0 ? stats.averageValue : '—'}</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Любимый номинал</div>
                  <div className="stat-value">{stats.favoriteValue || '—'}</div>
                </div>
              </div>

              {stats.strongTopics.length > 0 && (
                <div className="topics-section">
                  <h3>Сильные области</h3>
                  <div className="topics-list">
                    {stats.strongTopics.map((topic, idx) => {
                      const percentage = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0
                      return (
                        <div key={idx} className="topic-item strong">
                          <span className="topic-name">{topic.topicName}</span>
                          <span className="topic-stats">{topic.correct}/{topic.total} ({percentage}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {stats.weakTopics.length > 0 && (
                <div className="topics-section">
                  <h3>Слабые области</h3>
                  <div className="topics-list">
                    {stats.weakTopics.map((topic, idx) => {
                      const percentage = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0
                      return (
                        <div key={idx} className="topic-item weak">
                          <span className="topic-name">{topic.topicName}</span>
                          <span className="topic-stats">{topic.correct}/{topic.total} ({percentage}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {stats.strongTopics.length === 0 && stats.weakTopics.length === 0 && stats.totalAnswers === 0 && (
                <div className="no-data-message">
                  <p>Нет данных для отображения</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
