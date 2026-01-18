import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { SurpriseType } from '../types'
import GameSettings from '../components/GameSettings'
import MediaPlayer from '../components/MediaPlayer'
import './QuestionScreen.css'

export default function QuestionScreen() {
  const { roundNumber, topicIndex, valueIndex } = useParams<{
    roundNumber: string
    topicIndex: string
    valueIndex: string
  }>()
  const navigate = useNavigate()
  const { gameState, updateTeamScore, markQuestionAsPlayed, recordQuestionAnswer } = useGame()

  const [showSurprise, setShowSurprise] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [answerChecked, setAnswerChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  
  // Состояния для аукциона
  const [auctionTeam, setAuctionTeam] = useState<string | null>(null)
  const [auctionPrice, setAuctionPrice] = useState<number | null>(null)
  const [showAuctionTeamSelection, setShowAuctionTeamSelection] = useState(false)
  const [showAuctionPriceInput, setShowAuctionPriceInput] = useState(false)
  const [auctionPriceInput, setAuctionPriceInput] = useState('')
  
  // Состояния для кота в мешке
  const [catGiverTeam, setCatGiverTeam] = useState<string | null>(null) // Команда, которая отдает вопрос
  const [catReceiverTeam, setCatReceiverTeam] = useState<string | null>(null) // Команда, которой отдается вопрос
  const [showCatGiverSelection, setShowCatGiverSelection] = useState(false) // Показывать выбор отдающей команды
  const [showCatReceiverSelection, setShowCatReceiverSelection] = useState(false) // Показывать выбор принимающей команды
  const [showCatQuestion, setShowCatQuestion] = useState(false) // Показывать ли вопрос после выбора команд
  
  // Состояния для тоста и подарка
  const [showToastGiftWaiting, setShowToastGiftWaiting] = useState(false) // Показывать экран ожидания для тоста/подарка

  if (!gameState || !roundNumber || !topicIndex || !valueIndex) {
    return <div>Загрузка...</div>
  }

  const roundNum = parseInt(roundNumber)
  const topicIdx = parseInt(topicIndex)
  const valueIdx = parseInt(valueIndex)

  const round = gameState.rounds[roundNum - 1]
  if (!round) return <div>Раунд не найден</div>

  const question = round.topics[topicIdx]?.questions[valueIdx]
  if (!question) return <div>Вопрос не найден</div>
  
  // Логирование для отладки медиа
  useEffect(() => {
    console.log('📺 Question media debug:', {
      hasMediaUrl: !!question.mediaUrl,
      mediaUrl: question.mediaUrl,
      type: question.type,
      questionText: question.text?.substring(0, 50),
    })
  }, [question.mediaUrl, question.type])

  const value = round.values[valueIdx]
  const surpriseType = question.surprise
  const isAuction = surpriseType === 'auction'
  const isCat = surpriseType === 'cat'
  const isToast = surpriseType === 'toast'
  const isGift = surpriseType === 'gift'
  // Используем цену аукциона, если она установлена, иначе стандартное значение
  const questionValue = isAuction && auctionPrice !== null ? auctionPrice : value

  useEffect(() => {
    if (surpriseType) {
      setShowSurprise(true)
      const timer = setTimeout(() => {
        setShowSurprise(false)
        // Если это аукцион, показываем выбор команды
        if (surpriseType === 'auction') {
          setShowAuctionTeamSelection(true)
        }
        // Если это кот в мешке, показываем выбор отдающей команды
        if (surpriseType === 'cat') {
          setShowCatGiverSelection(true)
        }
        // Если это тост или подарок, показываем экран ожидания
        if (surpriseType === 'toast' || surpriseType === 'gift') {
          setShowToastGiftWaiting(true)
        }
      }, 3000) // 3 секунды анимации
      return () => clearTimeout(timer)
    }
  }, [surpriseType])

  const handleAuctionTeamSelect = (teamId: string) => {
    setAuctionTeam(teamId)
    setShowAuctionTeamSelection(false)
    setShowAuctionPriceInput(true)
  }

  const handleCatGiverSelect = (teamId: string) => {
    setCatGiverTeam(teamId)
    setShowCatGiverSelection(false)
    setShowCatReceiverSelection(true)
  }

  const handleCatReceiverSelect = (teamId: string) => {
    setCatReceiverTeam(teamId)
    setShowCatReceiverSelection(false)
    setShowCatQuestion(true)
    // Устанавливаем принимающую команду как выбранную для ответа
    setSelectedTeam(teamId)
  }

  const handleCatQuestionClick = () => {
    setShowCatQuestion(false)
    // После клика вопрос показывается в основном экране
  }

  const handleAuctionPriceSubmit = () => {
    const price = parseInt(auctionPriceInput)
    if (isNaN(price) || price <= 0) {
      alert('Введите корректную цену (положительное число)')
      return
    }
    setAuctionPrice(price)
    setShowAuctionPriceInput(false)
    // Устанавливаем выбранную команду для вопроса
    setSelectedTeam(auctionTeam)
  }

  const handleCorrect = () => {
    if (!selectedTeam) {
      alert('Выберите команду')
      return
    }
    const topic = round.topics[topicIdx]
    recordQuestionAnswer(roundNum, topicIdx, valueIdx, selectedTeam, true, questionValue, topic.name)
    updateTeamScore(selectedTeam, questionValue)
    setShowAnswer(true)
    setAnswerChecked(true)
    setIsCorrect(true)
  }

  const handleIncorrect = () => {
    if (!selectedTeam) {
      alert('Выберите команду')
      return
    }
    const topic = round.topics[topicIdx]
    recordQuestionAnswer(roundNum, topicIdx, valueIdx, selectedTeam, false, questionValue, topic.name)
    updateTeamScore(selectedTeam, -questionValue)
    setSelectedTeam(null)
  }

  const handleBack = () => {
    markQuestionAsPlayed(roundNum, topicIdx, valueIdx)
    navigate(`/round/${roundNum}`)
  }

  const handleToastGiftClick = () => {
    // Для тоста и подарка после клика показываем сам вопрос
    setShowToastGiftWaiting(false)
  }

  if (showSurprise && surpriseType) {
    return <SurpriseAnimation type={surpriseType} gameState={gameState} />
  }

  // Экран ожидания для тоста и подарка
  if ((isToast || isGift) && showToastGiftWaiting) {
    const customDefault = gameState?.customSurprises?.[`default_${surpriseType}`]
    const displayName = customDefault?.name || (isToast ? 'Тост' : 'Мгновенный подарок')
    const displayEmoji = customDefault?.emoji || (isToast ? '🥂' : '🎁')
    
    return (
      <div className="question-screen toast-gift-waiting" onClick={handleToastGiftClick}>
        <GameSettings />
        <div className="toast-gift-header">
          <div className="toast-gift-title">{displayEmoji} {displayName}</div>
          <div className="toast-gift-subtitle click-hint">Нажмите на экран, чтобы показать вопрос</div>
        </div>
      </div>
    )
  }

  // Экран выбора команды для аукциона
  if (isAuction && showAuctionTeamSelection) {
    return (
      <div className="question-screen auction-team-selection">
        <GameSettings />
        <div className="auction-header">
          <div className="auction-title">🔨 Аукцион</div>
          <div className="auction-subtitle">Выберите команду, которая будет играть этот вопрос</div>
        </div>
        <div className="teams-selection">
          <div className="teams-grid">
            {gameState.teams.map((team) => (
              <button
                key={team.id}
                className="team-button"
                onClick={() => handleAuctionTeamSelect(team.id)}
              >
                <div className="team-button-name">{team.shortName}</div>
                <div className="team-name">{team.name}</div>
                <div className="team-button-score">{team.score}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Экран ввода цены для аукциона
  if (isAuction && showAuctionPriceInput) {
    return (
      <div className="question-screen auction-price-input">
        <GameSettings />
        <div className="auction-header">
          <div className="auction-title">🔨 Аукцион</div>
          <div className="auction-subtitle">
            Команда: <strong>{gameState.teams.find(t => t.id === auctionTeam)?.name || ''}</strong>
          </div>
          <div className="auction-subtitle">Введите цену вопроса</div>
        </div>
        <div className="auction-price-form">
          <input
            type="number"
            min="1"
            value={auctionPriceInput}
            onChange={(e) => setAuctionPriceInput(e.target.value)}
            placeholder="Введите цену"
            className="auction-price-input-field"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAuctionPriceSubmit()
              }
            }}
          />
          <button onClick={handleAuctionPriceSubmit} className="action-button correct">
            Подтвердить цену
          </button>
        </div>
      </div>
    )
  }

  // Экран выбора отдающей команды для кота в мешке
  if (isCat && showCatGiverSelection) {
    return (
      <div className="question-screen cat-giver-selection">
        <GameSettings />
        <div className="cat-header">
          <div className="cat-title">🐱 Кот в мешке</div>
          <div className="cat-subtitle">Выберите команду, которая отдает вопрос</div>
        </div>
        <div className="teams-selection">
          <div className="teams-grid">
            {gameState.teams.map((team) => (
              <button
                key={team.id}
                className="team-button"
                onClick={() => handleCatGiverSelect(team.id)}
              >
                <div className="team-button-name">{team.shortName}</div>
                <div className="team-name">{team.name}</div>
                <div className="team-button-score">{team.score}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Экран выбора принимающей команды для кота в мешке
  if (isCat && showCatReceiverSelection) {
    return (
      <div className="question-screen cat-receiver-selection">
        <GameSettings />
        <div className="cat-header">
          <div className="cat-title">🐱 Кот в мешке</div>
          <div className="cat-subtitle">
            Отдает: <strong>{gameState.teams.find(t => t.id === catGiverTeam)?.name || ''}</strong>
          </div>
          <div className="cat-subtitle">Выберите команду, которой отдается вопрос</div>
        </div>
        <div className="teams-selection">
          <div className="teams-grid">
            {gameState.teams
              .filter((team) => team.id !== catGiverTeam) // Исключаем отдающую команду
              .map((team) => (
                <button
                  key={team.id}
                  className="team-button"
                  onClick={() => handleCatReceiverSelect(team.id)}
                >
                  <div className="team-button-name">{team.shortName}</div>
                  <div className="team-name">{team.name}</div>
                  <div className="team-button-score">{team.score}</div>
                </button>
              ))}
          </div>
        </div>
      </div>
    )
  }

  // Экран ожидания показа вопроса для кота в мешке
  if (isCat && showCatQuestion && !showAnswer) {
    return (
      <div className="question-screen cat-question-waiting" onClick={handleCatQuestionClick}>
        <GameSettings />
        <div className="cat-header">
          <div className="cat-title">🐱 Кот в мешке</div>
          <div className="cat-subtitle">
            Отдает: <strong>{gameState.teams.find(t => t.id === catGiverTeam)?.name || ''}</strong>
          </div>
          <div className="cat-subtitle">
            Получает: <strong>{gameState.teams.find(t => t.id === catReceiverTeam)?.name || ''}</strong>
          </div>
          <div className="cat-subtitle click-hint">Нажмите на экран, чтобы показать вопрос</div>
        </div>
      </div>
    )
  }

  // Основной экран вопроса (показывается только после завершения аукциона, если это аукцион)
  if (isAuction && auctionPrice === null) {
    return null // Не показываем вопрос до завершения аукциона
  }

  // Для кота в мешке вопрос показывается только после выбора команд и клика на экран ожидания
  if (isCat && (!catGiverTeam || !catReceiverTeam || showCatQuestion)) {
    return null // Не показываем вопрос до завершения выбора команд и клика
  }

  return (
    <div className="question-screen">
      <GameSettings />
      <div className="question-header">
        <div className="question-value">{questionValue}</div>
        <div className="question-topic">{round.topics[topicIdx].name}</div>
        {isAuction && auctionTeam && (
          <div className="auction-info">
            Команда: {gameState.teams.find(t => t.id === auctionTeam)?.shortName || ''}
          </div>
        )}
        {isCat && catGiverTeam && catReceiverTeam && (
          <div className="cat-info">
            Отдает: {gameState.teams.find(t => t.id === catGiverTeam)?.shortName || ''} → 
            Получает: {gameState.teams.find(t => t.id === catReceiverTeam)?.shortName || ''}
          </div>
        )}
      </div>

      <div className="question-content">
        <div className="question-text">{question.text}</div>
        {question.mediaUrl && (question.type === 'image' || question.type === 'video' || question.type === 'audio') && (
          <div className="question-media">
            {question.type === 'image' && (
              <img src={question.mediaUrl} alt="Question media" onError={(e) => {
                console.error('❌ Failed to load image:', question.mediaUrl)
                e.currentTarget.style.display = 'none'
              }} />
            )}
            {(question.type === 'video' || question.type === 'audio') && (
              <MediaPlayer src={question.mediaUrl} type={question.type} />
            )}
          </div>
        )}
      </div>

      {showAnswer && (
        <div 
          className={`answer-content ${answerChecked && isCorrect ? 'correct-answer' : ''}`}
          onClick={() => {
            if (selectedTeam && !answerChecked) {
              handleCorrect()
            }
          }}
          style={{ cursor: selectedTeam && !answerChecked ? 'pointer' : 'default' }}
        >
          <div className="answer-label">Ответ:</div>
          <div className="answer-text">{question.answer}</div>
        </div>
      )}

      <div className="question-controls">
        {answerChecked && isCorrect ? (
          <div className="answer-checked-section">
            <button onClick={handleBack} className="action-button back">
              Назад к вопросам
            </button>
          </div>
        ) : (
          <>
            {!isAuction && !isCat && (
              <div className="teams-selection">
                <h3>Выберите команду:</h3>
                <div className="teams-grid">
                  {gameState.teams.map((team) => (
                    <button
                      key={team.id}
                      className={`team-button ${selectedTeam === team.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTeam(team.id)}
                    >
                      <div className="team-button-name">{team.shortName}</div>
                      <div className="team-button-score">{team.score}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isCat && catReceiverTeam && (
              <div className="teams-selection">
                <h3>Отвечает команда:</h3>
                <div className="teams-grid">
                  <div className="team-button selected" style={{ cursor: 'default', opacity: 1 }}>
                    <div className="team-button-name">
                      {gameState.teams.find(t => t.id === catReceiverTeam)?.shortName || ''}
                    </div>
                    <div className="team-name">
                      {gameState.teams.find(t => t.id === catReceiverTeam)?.name || ''}
                    </div>
                    <div className="team-button-score">
                      {gameState.teams.find(t => t.id === catReceiverTeam)?.score || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button onClick={handleCorrect} className="action-button correct" disabled={!selectedTeam}>
                Верно (+{questionValue})
              </button>
              <button
                onClick={handleIncorrect}
                className="action-button incorrect"
                disabled={!selectedTeam}
              >
                Неверно (-{questionValue})
              </button>
              {!showAnswer && (
                <button onClick={() => setShowAnswer(true)} className="action-button show-answer">
                  Показать ответ
                </button>
              )}
              <button onClick={handleBack} className="action-button back">
                Назад к вопросам
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SurpriseAnimation({ type, gameState }: { type: SurpriseType; gameState: any }) {
  const DEFAULT_NAMES: Record<string, string> = {
    cat: 'Кот в мешке',
    auction: 'Аукцион',
    toast: 'Тост',
    gift: 'Мгновенный подарок',
  }

  const DEFAULT_EMOJIS: Record<string, string> = {
    cat: '🐱',
    auction: '🔨',
    toast: '🥂',
    gift: '🎁',
  }

  // Сначала проверяем кастомную версию стандартного сюрприза
  const customDefault = gameState?.customSurprises?.[`default_${type}`]
  const name = customDefault?.name || DEFAULT_NAMES[type] || gameState?.customSurprises?.[type]?.name || type
  const emoji = customDefault?.emoji || DEFAULT_EMOJIS[type] || gameState?.customSurprises?.[type]?.emoji || '🎁'

  return (
    <div className="surprise-animation">
      <div className="surprise-content">
        <div className="surprise-emoji">{emoji}</div>
        <div className="surprise-name">{name}</div>
      </div>
    </div>
  )
}

