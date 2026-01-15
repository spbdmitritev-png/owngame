import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import './GameTrailerScreen.css'

export default function GameTrailerScreen() {
  const navigate = useNavigate()
  const { roundNumber } = useParams<{ roundNumber: string }>()
  const { gameState } = useGame()
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0)
  const [showReady, setShowReady] = useState(false)

  // Проверяем наличие данных
  if (!gameState || !gameState.rounds || gameState.rounds.length === 0 || !roundNumber) {
    return (
      <div className="game-trailer-screen">
        <div className="trailer-content">
          <div>Загрузка...</div>
        </div>
      </div>
    )
  }

  const roundNum = parseInt(roundNumber)
  const round = gameState.rounds[roundNum - 1]

  if (!round || !round.topics || round.topics.length === 0) {
    return (
      <div className="game-trailer-screen">
        <div className="trailer-content">
          <div>Раунд не найден</div>
        </div>
      </div>
    )
  }

  const currentTopic = round.topics[currentTopicIndex]

  // Автоматический показ тем текущего раунда
  useEffect(() => {
    if (showReady || !currentTopic) return

    const timer = setTimeout(() => {
      // Проверяем, есть ли еще темы
      if (currentTopicIndex < round.topics.length - 1) {
        // Переходим к следующей теме
        setCurrentTopicIndex(prev => prev + 1)
      } else {
        // Все темы показаны - показываем экран готовности
        setShowReady(true)
      }
    }, 2000) // 2 секунды на каждую тему

    return () => clearTimeout(timer)
  }, [currentTopicIndex, showReady, round.topics.length, currentTopic])

  const handleClick = () => {
    if (showReady) {
      // Переход к раунду после клика на экран готовности
      navigate(`/round/${roundNum}`)
    } else {
      // Пропустить показ тем - сразу показать экран готовности
      setShowReady(true)
    }
  }

  // Экран готовности
  if (showReady) {
    return (
      <div className="game-ready-screen" onClick={handleClick}>
        <div className="ready-content">
          <div className="ready-title">Раунд {roundNum} готов</div>
          <div className="ready-subtitle">Нажмите на экран для начала</div>
        </div>
      </div>
    )
  }

  // Показ темы
  if (!currentTopic) {
    return (
      <div className="game-trailer-screen">
        <div className="trailer-content">
          <div>Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-trailer-screen" onClick={handleClick}>
      <div className="trailer-content">
        <div className="trailer-round-label">Раунд {roundNum}</div>
        <div className="trailer-topic-name">{currentTopic.name}</div>
        <div className="trailer-progress">
          Тема {currentTopicIndex + 1} из {round.topics.length}
        </div>
      </div>
    </div>
  )
}
