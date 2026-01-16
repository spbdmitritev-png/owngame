import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { GameConfig, Team, Round, Topic, Question, SurpriseType } from '../types'
import './ConfigScreen.css'
import SurprisesEditorModal from './SurprisesEditorModal'
import QuestionsEditorModal from './QuestionsEditorModal'

const DEFAULT_VALUES = {
  1: [100, 200, 300, 400, 500],
  2: [200, 400, 600, 800, 1000],
  3: [300, 600, 900, 1200, 1500],
}

const generateShortName = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length >= 3) {
    return words
      .slice(0, 3)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('')
      .substring(0, 3)
  }
  return name
    .toUpperCase()
    .replace(/[^А-ЯA-Z]/g, '')
    .substring(0, 3)
    .padEnd(3, 'X')
}

export default function ConfigScreen() {
  const navigate = useNavigate()
  const { setGameConfig, gameState } = useGame()

  const [numberOfRounds, setNumberOfRounds] = useState<1 | 2 | 3>(3)
  const [roundsConfig, setRoundsConfig] = useState<Record<number, number>>({
    1: 5,
    2: 5,
    3: 5,
  })
  const [finalTopicsCount, setFinalTopicsCount] = useState(5)
  // В финальном раунде всегда 1 вопрос на тему
  const finalQuestionsCount = 1
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Команда 1', shortName: 'КОМ', score: 0 },
  ])

  const [surprisesConfig, setSurprisesConfig] = useState({
    cat: [2, 3, 4],
    auction: [2, 3, 4],
    toast: [1, 1, 1],
    gift: [1, 2, 3],
  })
  const [customSurprises, setCustomSurprises] = useState<Record<string, { id: string; name: string; emoji: string }>>({})
  const [showSurprisesModal, setShowSurprisesModal] = useState(false)
  const [showQuestionsModal, setShowQuestionsModal] = useState(false)
  const [surprisesData, setSurprisesData] = useState<Record<number, Round>>({})
  const [questionsData, setQuestionsData] = useState<Record<number, Round>>({})
  const [finalRoundData, setFinalRoundData] = useState<Round | null>(null)
  const [shouldNavigate, setShouldNavigate] = useState(false)

  // Очищаем данные финального раунда, если количество тем изменилось
  useEffect(() => {
    if (finalRoundData && finalRoundData.topics.length !== finalTopicsCount) {
      setFinalRoundData(null)
    }
  }, [finalTopicsCount, finalRoundData])

  // Навигация после установки конфига - переходим к трейлеру первого раунда
  useEffect(() => {
    if (shouldNavigate && gameState && gameState.rounds && gameState.rounds.length > 0) {
      setShouldNavigate(false)
      navigate('/game-trailer/1')
    }
  }, [shouldNavigate, gameState, navigate])

  const addTeam = () => {
    if (teams.length >= 12) return
    const newId = String(teams.length + 1)
    setTeams([
      ...teams,
      { id: newId, name: `Команда ${newId}`, shortName: 'КОМ', score: 0 },
    ])
  }

  const removeTeam = (id: string) => {
    if (teams.length <= 1) return
    setTeams(teams.filter((t) => t.id !== id))
  }

  const updateTeamName = (id: string, name: string) => {
    setTeams(
      teams.map((t) =>
        t.id === id ? { ...t, name, shortName: generateShortName(name) } : t
      )
    )
  }

  const generateQuestions = (count: number): Question[] => {
    return Array.from({ length: count }, (_, i) => ({
      text: `Вопрос ${i + 1}`,
      answer: `Ответ ${i + 1}`,
      type: 'text' as const,
      isPlayed: false,
    }))
  }

  const distributeSurprises = (
    roundNumber: number,
    topicsCount: number,
    questionsPerTopic: number
  ): Array<{ topicIndex: number; questionIndex: number; type: SurpriseType }> => {
    // Если есть сохраненные данные о сюрпризах для этого раунда, используем их
    if (surprisesData[roundNumber]) {
      const round = surprisesData[roundNumber]
      const surprises: Array<{ topicIndex: number; questionIndex: number; type: SurpriseType }> = []
      round.topics.forEach((topic, topicIndex) => {
        topic.questions.forEach((question, questionIndex) => {
          if (question.surprise) {
            surprises.push({
              topicIndex,
              questionIndex,
              type: question.surprise,
            })
          }
        })
      })
      return surprises
    }

    // Иначе используем автоматическое распределение
    const surprises: Array<{ topicIndex: number; questionIndex: number; type: SurpriseType }> = []
    const totalQuestions = topicsCount * questionsPerTopic
    const positions = Array.from({ length: totalQuestions }, (_, i) => ({
      topicIndex: Math.floor(i / questionsPerTopic),
      questionIndex: i % questionsPerTopic,
    }))

    // Перемешиваем позиции
    const shuffled = [...positions].sort(() => Math.random() - 0.5)

    let posIndex = 0

    // Кот в мешке
    for (let i = 0; i < surprisesConfig.cat[roundNumber - 1]; i++) {
      if (posIndex < shuffled.length) {
        surprises.push({ ...shuffled[posIndex++], type: 'cat' })
      }
    }

    // Аукцион
    for (let i = 0; i < surprisesConfig.auction[roundNumber - 1]; i++) {
      if (posIndex < shuffled.length) {
        surprises.push({ ...shuffled[posIndex++], type: 'auction' })
      }
    }

    // Вопрос-тост
    for (let i = 0; i < surprisesConfig.toast[roundNumber - 1]; i++) {
      if (posIndex < shuffled.length) {
        surprises.push({ ...shuffled[posIndex++], type: 'toast' })
      }
    }

    // Мгновенный подарок
    for (let i = 0; i < surprisesConfig.gift[roundNumber - 1]; i++) {
      if (posIndex < shuffled.length) {
        surprises.push({ ...shuffled[posIndex++], type: 'gift' })
      }
    }

    return surprises
  }

  // Создаем временные раунды для редактирования сюрпризов
  const previewRounds = useMemo(() => {
    const rounds: Round[] = []
    for (let i = 1; i <= numberOfRounds; i++) {
      const topicsCount = roundsConfig[i] || 5
      const questionsPerTopic = 5
      
      // Проверяем, есть ли сохраненные данные о вопросах и темах для этого раунда
      const savedQuestionsRound = questionsData[i]
      let topics: Topic[]
      
      if (savedQuestionsRound && savedQuestionsRound.topics.length === topicsCount) {
        // Используем сохраненные темы и вопросы
        topics = savedQuestionsRound.topics.map((topic) => ({
          ...topic,
          questions: topic.questions.map((q) => ({ ...q, isPlayed: false }))
        }))
      } else {
        // Иначе создаем новые
        topics = Array.from({ length: topicsCount }, (_, j) => ({
          name: `Тема ${j + 1}`,
          questions: generateQuestions(questionsPerTopic),
        }))
      }

      // Проверяем, есть ли сохраненные данные о сюрпризах для этого раунда
      const savedRound = surprisesData[i]
      if (savedRound && savedRound.topics.length === topicsCount) {
        // Используем сохраненные сюрпризы, если структура совпадает
        topics.forEach((topic, topicIndex) => {
          const savedTopic = savedRound.topics[topicIndex]
          if (savedTopic) {
            topic.questions.forEach((question, questionIndex) => {
              const savedQuestion = savedTopic.questions[questionIndex]
              if (savedQuestion?.surprise) {
                question.surprise = savedQuestion.surprise
              }
            })
          }
        })
      } else {
        // Иначе используем автоматическое распределение
        const surprises = distributeSurprises(i, topicsCount, questionsPerTopic)
        surprises.forEach((surprise) => {
          topics[surprise.topicIndex].questions[surprise.questionIndex].surprise = surprise.type
        })
      }

      // Собираем список сюрпризов для раунда
      const surprisesList: Array<{ type: SurpriseType; questionIndex: number }> = []
      topics.forEach((topic, topicIndex) => {
        topic.questions.forEach((question, questionIndex) => {
          if (question.surprise) {
            surprisesList.push({
              type: question.surprise,
              questionIndex: questionIndex,
            })
          }
        })
      })

      rounds.push({
        number: i,
        topics,
        values: DEFAULT_VALUES[i as keyof typeof DEFAULT_VALUES],
        surprises: surprisesList,
      })
    }
    return rounds
  }, [numberOfRounds, roundsConfig, surprisesConfig, surprisesData, questionsData])

  // Создаем финальный раунд для редактирования
  const previewFinalRound = useMemo(() => {
    if (finalRoundData && finalRoundData.topics.length === finalTopicsCount) {
      // В финальном раунде всегда используем только первый вопрос из каждой темы
      return {
        ...finalRoundData,
        topics: finalRoundData.topics.map((topic) => ({
          ...topic,
          questions: topic.questions.slice(0, 1).map((q) => ({ ...q, isPlayed: false }))
        }))
      }
    }
    
    // Создаем темы для финального раунда по количеству finalTopicsCount
    const finalTopics: Topic[] = Array.from({ length: finalTopicsCount }, (_, i) => ({
      name: `Финальная тема ${i + 1}`,
      questions: generateQuestions(1), // Всегда 1 вопрос на тему
    }))

    return {
      number: numberOfRounds + 1,
      topics: finalTopics,
      values: [],
      surprises: [],
    }
  }, [numberOfRounds, finalRoundData, finalTopicsCount])

  const handleStart = () => {
    const rounds: Round[] = []

    for (let i = 1; i <= numberOfRounds; i++) {
      const topicsCount = roundsConfig[i] || 5
      const questionsPerTopic = 5
      
      // Проверяем, есть ли сохраненные данные о вопросах и темах
      const savedQuestionsRound = questionsData[i]
      let topics: Topic[]
      
      if (savedQuestionsRound && savedQuestionsRound.topics.length === topicsCount) {
        // Используем сохраненные темы и вопросы
        topics = savedQuestionsRound.topics.map((topic) => ({
          ...topic,
          questions: topic.questions.map((q) => {
            // Убеждаемся, что все поля вопроса сохраняются, включая медиа
            return {
              ...q,
              isPlayed: false,
              mediaUrl: q.mediaUrl, // Явно сохраняем mediaUrl
              type: q.type || 'text', // Явно сохраняем type
            }
          })
        }))
      } else {
        // Иначе создаем новые
        topics = Array.from({ length: topicsCount }, (_, j) => ({
          name: `Тема ${j + 1}`,
          questions: generateQuestions(questionsPerTopic),
        }))
      }

      // Используем отредактированные сюрпризы, если они есть
      const savedRound = surprisesData[i]
      if (savedRound && savedRound.topics.length === topicsCount) {
        // Используем сохраненные сюрпризы
        topics.forEach((topic, topicIndex) => {
          const savedTopic = savedRound.topics[topicIndex]
          if (savedTopic) {
            topic.questions.forEach((question, questionIndex) => {
              const savedQuestion = savedTopic.questions[questionIndex]
              if (savedQuestion?.surprise) {
                question.surprise = savedQuestion.surprise
              }
            })
          }
        })
      } else {
        // Иначе используем автоматическое распределение
        const surprises = distributeSurprises(i, topicsCount, questionsPerTopic)
        surprises.forEach((surprise) => {
          topics[surprise.topicIndex].questions[surprise.questionIndex].surprise = surprise.type
        })
      }

      // Собираем список сюрпризов для раунда
      const surprisesList: Array<{ type: SurpriseType; questionIndex: number }> = []
      topics.forEach((topic) => {
        topic.questions.forEach((question, questionIndex) => {
          if (question.surprise) {
            surprisesList.push({
              type: question.surprise,
              questionIndex: questionIndex,
            })
          }
        })
      })

      rounds.push({
        number: i,
        topics,
        values: DEFAULT_VALUES[i as keyof typeof DEFAULT_VALUES],
        surprises: surprisesList,
      })
    }

    // Используем сохраненные данные финального раунда, если они есть
    let finalRound: Round
    if (finalRoundData && finalRoundData.topics.length === finalTopicsCount) {
      // В финальном раунде всегда используем только первый вопрос из каждой темы
      finalRound = {
        ...finalRoundData,
        topics: finalRoundData.topics.map((topic) => ({
          ...topic,
          questions: topic.questions.slice(0, 1).map((q) => ({ ...q, isPlayed: false }))
        }))
      }
    } else {
      // Генерируем темы для финального раунда (всегда 1 вопрос на тему)
      const finalTopics: Topic[] = Array.from({ length: finalTopicsCount }, (_, i) => ({
        name: `Финальная тема ${i + 1}`,
        questions: generateQuestions(1), // Всегда 1 вопрос
      }))

      finalRound = {
        number: numberOfRounds + 1,
        topics: finalTopics,
        values: [],
        surprises: [],
      }
    }

    const config: GameConfig = {
      numberOfRounds,
      rounds,
      finalRound,
      teams,
      surprisesConfig,
      customSurprises: Object.keys(customSurprises).length > 0 ? customSurprises : undefined,
    }

    // Устанавливаем конфигурацию игры
    setGameConfig(config)
    // Устанавливаем флаг для навигации
    setShouldNavigate(true)
  }

  const handleSurprisesChange = (roundNumber: number, round: Round) => {
    setSurprisesData({ ...surprisesData, [roundNumber]: round })
  }

  return (
    <div className="config-screen">
      <div className="config-header">
        <h1>Настройка игры</h1>
      </div>

      <div className="config-section">
        <h2>Количество раундов</h2>
        <div className="radio-group">
          {[1, 2, 3].map((num) => (
            <label key={num}>
              <input
                type="radio"
                value={num}
                checked={numberOfRounds === num}
                onChange={(e) => setNumberOfRounds(Number(e.target.value) as 1 | 2 | 3)}
              />
              {num} раунд{num > 1 ? 'а' : ''}
            </label>
          ))}
        </div>
      </div>

      <div className="config-section">
        <h2>Темы в раундах</h2>
        {[1, 2, 3].slice(0, numberOfRounds).map((roundNum) => (
          <div key={roundNum} className="input-group">
            <label>Раунд {roundNum}:</label>
            <input
              type="number"
              min="4"
              max="7"
              value={roundsConfig[roundNum] || 5}
              onChange={(e) =>
                setRoundsConfig({ ...roundsConfig, [roundNum]: Number(e.target.value) })
              }
            />
            <span>тем (4-7)</span>
          </div>
        ))}
      </div>

      <div className="config-section">
        <h2>Финальный раунд</h2>
        <div className="input-group">
          <label>Количество тем:</label>
          <input
            type="number"
            min="3"
            max="10"
            value={finalTopicsCount}
            onChange={(e) => setFinalTopicsCount(Number(e.target.value))}
          />
          <span>(3-10)</span>
        </div>
      </div>

      <div className="config-section">
        <h2>Команды ({teams.length}/12)</h2>
        <div className="teams-list">
          {teams.map((team) => (
            <div key={team.id} className="team-item">
              <input
                type="text"
                value={team.name}
                onChange={(e) => updateTeamName(team.id, e.target.value)}
                placeholder="Название команды"
              />
              <span className="short-name">{team.shortName}</span>
              {teams.length > 1 && (
                <button onClick={() => removeTeam(team.id)}>×</button>
              )}
            </div>
          ))}
        </div>
        {teams.length < 12 && (
          <button onClick={addTeam} className="add-button">
            + Добавить команду
          </button>
        )}
      </div>

      <div className="config-section">
      <button
        className="edit-surprises-button full-width"
        onClick={() => setShowSurprisesModal(true)}
      >
        ✏️ Редактировать сюрпризы
      </button>
      </div>

      <div className="config-section">
        <button
          className="edit-surprises-button full-width"
          onClick={() => setShowQuestionsModal(true)}
        >
          ✏️ Редактировать вопросы и темы
        </button>
      </div>

      <button onClick={handleStart} className="start-button">
        Начать игру
      </button>

      {showSurprisesModal && (
        <SurprisesEditorModal
          rounds={previewRounds}
          onClose={() => setShowSurprisesModal(false)}
          onSurprisesChange={handleSurprisesChange}
          customSurprises={customSurprises}
          onCustomSurprisesChange={setCustomSurprises}
        />
      )}

      {showQuestionsModal && (
        <QuestionsEditorModal
          rounds={previewRounds}
          finalRound={previewFinalRound}
          onClose={() => setShowQuestionsModal(false)}
          onRoundsChange={(rounds) => {
            const updatedData: Record<number, Round> = {}
            rounds.forEach((round) => {
              updatedData[round.number] = round
            })
            setQuestionsData({ ...questionsData, ...updatedData })
          }}
          onFinalRoundChange={(finalRound) => {
            setFinalRoundData(finalRound)
          }}
        />
      )}
    </div>
  )
}

