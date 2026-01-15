import { useState, useEffect } from 'react'
import { Round, Topic, Question } from '../types'
import { questionsDB, QuestionDBItem } from '../utils/questionsDB'
import './QuestionsEditorModal.css'

interface QuestionsEditorModalProps {
  rounds: Round[]
  finalRound: Round
  onClose: () => void
  onRoundsChange: (rounds: Round[]) => void
  onFinalRoundChange: (finalRound: Round) => void
}

export default function QuestionsEditorModal({
  rounds,
  finalRound,
  onClose,
  onRoundsChange,
  onFinalRoundChange,
}: QuestionsEditorModalProps) {
  const [selectedRound, setSelectedRound] = useState<number | 'final'>(1)
  const [localRounds, setLocalRounds] = useState<Round[]>(rounds)
  const [localFinalRound, setLocalFinalRound] = useState<Round>(finalRound)
  const [editingTopic, setEditingTopic] = useState<{ roundNumber: number | 'final'; topicIndex: number } | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<{ roundNumber: number | 'final'; topicIndex: number; questionIndex: number } | null>(null)
  const [showQuestionPicker, setShowQuestionPicker] = useState<{ roundNumber: number | 'final'; topicIndex: number; questionIndex: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    setLocalRounds(rounds)
  }, [rounds])

  useEffect(() => {
    setLocalFinalRound(finalRound)
  }, [finalRound])

  const currentRound = selectedRound === 'final' 
    ? localFinalRound 
    : localRounds.find((r) => r.number === selectedRound)

  const handleTopicNameChange = (roundNumber: number | 'final', topicIndex: number, newName: string) => {
    if (roundNumber === 'final') {
      const newTopics = localFinalRound.topics.map((topic, idx) => {
        if (idx === topicIndex) {
          return { ...topic, name: newName }
        }
        return topic
      })
      const updatedFinalRound = { ...localFinalRound, topics: newTopics }
      setLocalFinalRound(updatedFinalRound)
      onFinalRoundChange(updatedFinalRound)
    } else {
      const updatedRounds = localRounds.map((round) => {
        if (round.number === roundNumber) {
          const newTopics = round.topics.map((topic, idx) => {
            if (idx === topicIndex) {
              return { ...topic, name: newName }
            }
            return topic
          })
          return { ...round, topics: newTopics }
        }
        return round
      })
      setLocalRounds(updatedRounds)
      onRoundsChange(updatedRounds)
    }
  }

  const handleQuestionChange = (
    roundNumber: number | 'final',
    topicIndex: number,
    questionIndex: number,
    field: 'text' | 'answer' | 'type' | 'mediaUrl',
    value: string | 'text' | 'image' | 'video' | 'audio'
  ) => {
    if (roundNumber === 'final') {
      const newTopics = localFinalRound.topics.map((topic, tIdx) => {
        if (tIdx === topicIndex) {
          const newQuestions = topic.questions.map((question, qIdx) => {
            if (qIdx === questionIndex) {
              const updatedQuestion = { ...question, [field]: value }
              // Если тип изменен на text, убираем mediaUrl
              if (field === 'type' && value === 'text') {
                delete updatedQuestion.mediaUrl
              }
              // Если тип изменен на text, но mediaUrl пустой, оставляем type как text
              if (field === 'type' && value !== 'text' && !updatedQuestion.mediaUrl) {
                // Оставляем текущий тип или устанавливаем text по умолчанию
              }
              return updatedQuestion
            }
            return question
          })
          // В финальном раунде всегда оставляем только первый вопрос
          return { ...topic, questions: newQuestions.slice(0, 1) }
        }
        // Для других тем тоже оставляем только первый вопрос
        return { ...topic, questions: topic.questions.slice(0, 1) }
      })
      const updatedFinalRound = { ...localFinalRound, topics: newTopics }
      setLocalFinalRound(updatedFinalRound)
      onFinalRoundChange(updatedFinalRound)
    } else {
      const updatedRounds = localRounds.map((round) => {
        if (round.number === roundNumber) {
          const newTopics = round.topics.map((topic, tIdx) => {
            if (tIdx === topicIndex) {
              const newQuestions = topic.questions.map((question, qIdx) => {
                if (qIdx === questionIndex) {
                  const updatedQuestion = { ...question, [field]: value }
                  // Если тип изменен на text, убираем mediaUrl
                  if (field === 'type' && value === 'text') {
                    delete updatedQuestion.mediaUrl
                  }
                  return updatedQuestion
                }
                return question
              })
              return { ...topic, questions: newQuestions }
            }
            return topic
          })
          return { ...round, topics: newTopics }
        }
        return round
      })
      setLocalRounds(updatedRounds)
      onRoundsChange(updatedRounds)
    }
  }

  const handleSelectQuestion = (dbItem: QuestionDBItem) => {
    if (!showQuestionPicker) return

    const { roundNumber, topicIndex, questionIndex } = showQuestionPicker
    const question = dbItem.question
    
    // Обновляем все поля вопроса
    if (roundNumber === 'final') {
      const newTopics = localFinalRound.topics.map((topic, tIdx) => {
        if (tIdx === topicIndex) {
          const newQuestions = topic.questions.map((q, qIdx) => {
            if (qIdx === questionIndex) {
              return {
                ...q,
                text: question.text,
                answer: question.answer,
                type: question.type,
                mediaUrl: question.mediaUrl,
              }
            }
            return q
          })
          // В финальном раунде всегда оставляем только первый вопрос
          return { ...topic, questions: newQuestions.slice(0, 1) }
        }
        // Для других тем тоже оставляем только первый вопрос
        return { ...topic, questions: topic.questions.slice(0, 1) }
      })
      const updatedFinalRound = { ...localFinalRound, topics: newTopics }
      setLocalFinalRound(updatedFinalRound)
      onFinalRoundChange(updatedFinalRound)
    } else {
      const updatedRounds = localRounds.map((round) => {
        if (round.number === roundNumber) {
          const newTopics = round.topics.map((topic, tIdx) => {
            if (tIdx === topicIndex) {
              const newQuestions = topic.questions.map((q, qIdx) => {
                if (qIdx === questionIndex) {
                  return {
                    ...q,
                    text: question.text,
                    answer: question.answer,
                    type: question.type,
                    mediaUrl: question.mediaUrl,
                  }
                }
                return q
              })
              return { ...topic, questions: newQuestions }
            }
            return topic
          })
          return { ...round, topics: newTopics }
        }
        return round
      })
      setLocalRounds(updatedRounds)
      onRoundsChange(updatedRounds)
    }
    
    setShowQuestionPicker(null)
  }

  const handleSaveToDB = (
    roundNumber: number | 'final',
    topicIndex: number,
    questionIndex: number,
    category: string
  ) => {
    const round = roundNumber === 'final' ? localFinalRound : localRounds.find((r) => r.number === roundNumber)
    const question = round?.topics[topicIndex]?.questions[questionIndex]
    if (question && category.trim()) {
      questionsDB.add(category.trim(), question)
      const key = `${roundNumber}_${topicIndex}_${questionIndex}`
      setCategoryInputs({ ...categoryInputs, [key]: '' })
    }
  }

  const getCategoryInputKey = (roundNumber: number | 'final', topicIndex: number, questionIndex: number) => {
    return `${roundNumber}_${topicIndex}_${questionIndex}`
  }

  const dbCategories = questionsDB.getCategories()
  const filteredQuestions = searchQuery
    ? questionsDB.search(searchQuery)
    : selectedCategory
    ? questionsDB.getByCategory(selectedCategory)
    : questionsDB.getAll()

  if (!currentRound) return null

  return (
    <div className="questions-modal-overlay" onClick={onClose}>
      <div className="questions-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="questions-modal-header">
          <h2>Редактирование вопросов и тем</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="rounds-tabs">
          {localRounds.map((round) => (
            <button
              key={round.number}
              className={`round-tab ${selectedRound === round.number ? 'active' : ''}`}
              onClick={() => setSelectedRound(round.number)}
            >
              Раунд {round.number}
            </button>
          ))}
          <button
            className={`round-tab ${selectedRound === 'final' ? 'active' : ''}`}
            onClick={() => setSelectedRound('final')}
          >
            Финальный раунд
          </button>
        </div>

        <div className="questions-edit-content">
          <div className="topics-list">
            {currentRound.topics.map((topic, topicIndex) => (
              <div key={topicIndex} className="topic-section">
                <div className="topic-header-edit">
                  {editingTopic?.roundNumber === selectedRound && editingTopic?.topicIndex === topicIndex ? (
                    <>
                      <input
                        type="text"
                        value={topic.name}
                        onChange={(e) => handleTopicNameChange(selectedRound, topicIndex, e.target.value)}
                        className="topic-name-input"
                        autoFocus
                        onBlur={() => setEditingTopic(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingTopic(null)
                          }
                        }}
                      />
                      <button
                        className="save-edit-button"
                        onClick={() => setEditingTopic(null)}
                      >
                        ✓
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="topic-title" onClick={() => setEditingTopic({ roundNumber: selectedRound, topicIndex })}>
                        {topic.name}
                      </h3>
                      <button
                        className="edit-topic-button"
                        onClick={() => setEditingTopic({ roundNumber: selectedRound, topicIndex })}
                        title="Редактировать название темы"
                      >
                        ✏️
                      </button>
                    </>
                  )}
                </div>

                <div className="questions-list">
                  {(selectedRound === 'final' 
                    ? topic.questions.slice(0, 1) // В финальном раунде показываем только первый вопрос
                    : topic.questions
                  ).map((question, questionIndex) => (
                    <div key={questionIndex} className="question-item">
                      <div className="question-header-item">
                        <span className="question-value-label">
                          {selectedRound === 'final' 
                            ? `Вопрос ${questionIndex + 1}` 
                            : currentRound.values[questionIndex]}
                        </span>
                        {editingQuestion?.roundNumber === selectedRound &&
                        editingQuestion?.topicIndex === topicIndex &&
                        editingQuestion?.questionIndex === questionIndex ? (
                          <button
                            className="close-edit-button"
                            onClick={() => setEditingQuestion(null)}
                          >
                            ×
                          </button>
                        ) : (
                          <button
                            className="edit-question-button"
                            onClick={() =>
                              setEditingQuestion({ roundNumber: selectedRound, topicIndex, questionIndex })
                            }
                            title="Редактировать вопрос"
                          >
                            ✏️
                          </button>
                        )}
                      </div>

                      {editingQuestion?.roundNumber === selectedRound &&
                      editingQuestion?.topicIndex === topicIndex &&
                      editingQuestion?.questionIndex === questionIndex ? (
                        <div className="question-edit-form">
                          <div className="question-edit-actions">
                            <button
                              className="pick-question-button"
                              onClick={() =>
                                setShowQuestionPicker({ roundNumber: selectedRound, topicIndex, questionIndex })
                              }
                            >
                              📚 Выбрать из базы
                            </button>
                            <div className="save-to-db-form">
                              <div className="category-input-wrapper">
                                <input
                                  type="text"
                                  placeholder="Категория"
                                  className="category-input"
                                  value={categoryInputs[getCategoryInputKey(selectedRound, topicIndex, questionIndex)] || ''}
                                  onChange={(e) => {
                                    const key = getCategoryInputKey(selectedRound, topicIndex, questionIndex)
                                    setCategoryInputs({ ...categoryInputs, [key]: e.target.value })
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const category = (e.target as HTMLInputElement).value
                                      if (category.trim()) {
                                        handleSaveToDB(selectedRound, topicIndex, questionIndex, category)
                                      }
                                    }
                                  }}
                                  list={`category-list-${selectedRound}-${topicIndex}-${questionIndex}`}
                                />
                                <datalist id={`category-list-${selectedRound}-${topicIndex}-${questionIndex}`}>
                                  {dbCategories.map((cat) => (
                                    <option key={cat} value={cat} />
                                  ))}
                                </datalist>
                              </div>
                              <button
                                className="save-to-db-button"
                                onClick={() => {
                                  const key = getCategoryInputKey(selectedRound, topicIndex, questionIndex)
                                  const category = categoryInputs[key] || ''
                                  if (category.trim()) {
                                    handleSaveToDB(selectedRound, topicIndex, questionIndex, category)
                                  }
                                }}
                              >
                                💾 Сохранить в БД
                              </button>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Тип вопроса:</label>
                            <select
                              value={question.type || 'text'}
                              onChange={(e) =>
                                handleQuestionChange(
                                  selectedRound,
                                  topicIndex,
                                  questionIndex,
                                  'type',
                                  e.target.value as 'text' | 'image' | 'video' | 'audio'
                                )
                              }
                              className="question-type-select"
                            >
                              <option value="text">Текст</option>
                              <option value="image">Изображение</option>
                              <option value="video">Видео</option>
                              <option value="audio">Аудио</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Вопрос:</label>
                            <textarea
                              value={question.text}
                              onChange={(e) =>
                                handleQuestionChange(selectedRound, topicIndex, questionIndex, 'text', e.target.value)
                              }
                              className="question-textarea"
                              rows={3}
                            />
                          </div>
                          {(question.type === 'image' || question.type === 'video' || question.type === 'audio') && (
                            <div className="form-group">
                              <label>
                                {question.type === 'image' && 'URL изображения'}
                                {question.type === 'video' && 'URL видео'}
                                {question.type === 'audio' && 'URL аудио'}
                                :
                              </label>
                              <input
                                type="url"
                                value={question.mediaUrl || ''}
                                onChange={(e) =>
                                  handleQuestionChange(selectedRound, topicIndex, questionIndex, 'mediaUrl', e.target.value)
                                }
                                className="question-media-input"
                                placeholder="https://example.com/media.jpg"
                              />
                              {question.mediaUrl && (
                                <div className="media-preview">
                                  {question.type === 'image' && (
                                    <img src={question.mediaUrl} alt="Preview" className="media-preview-image" />
                                  )}
                                  {question.type === 'video' && (
                                    <video src={question.mediaUrl} controls className="media-preview-video" />
                                  )}
                                  {question.type === 'audio' && (
                                    <audio src={question.mediaUrl} controls className="media-preview-audio" />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="form-group">
                            <label>Ответ:</label>
                            <textarea
                              value={question.answer}
                              onChange={(e) =>
                                handleQuestionChange(selectedRound, topicIndex, questionIndex, 'answer', e.target.value)
                              }
                              className="question-textarea"
                              rows={2}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="question-preview">
                          <div className="question-type-badge">
                            {question.type === 'image' && '🖼️ Изображение'}
                            {question.type === 'video' && '🎥 Видео'}
                            {question.type === 'audio' && '🎵 Аудио'}
                            {(!question.type || question.type === 'text') && '📝 Текст'}
                          </div>
                          <div className="question-text-preview">{question.text}</div>
                          {question.mediaUrl && (
                            <div className="question-media-preview">
                              {question.type === 'image' && (
                                <img src={question.mediaUrl} alt="Media" className="preview-media-image" />
                              )}
                              {question.type === 'video' && (
                                <video src={question.mediaUrl} controls className="preview-media-video" />
                              )}
                              {question.type === 'audio' && (
                                <audio src={question.mediaUrl} controls className="preview-media-audio" />
                              )}
                            </div>
                          )}
                          <div className="question-answer-preview">Ответ: {question.answer}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showQuestionPicker && (
        <QuestionPickerModal
          onSelect={handleSelectQuestion}
          onClose={() => setShowQuestionPicker(null)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={dbCategories}
          questions={filteredQuestions}
        />
      )}
    </div>
  )
}

function QuestionPickerModal({
  onSelect,
  onClose,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  questions,
}: {
  onSelect: (item: QuestionDBItem) => void
  onClose: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  categories: string[]
  questions: QuestionDBItem[]
}) {
  return (
    <div className="question-picker-overlay" onClick={onClose}>
      <div className="question-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="question-picker-header">
          <h3>Выбрать вопрос из базы</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="question-picker-filters">
          <div className="filter-group">
            <label>Поиск:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedCategory('')
              }}
              placeholder="Поиск по тексту вопроса или ответа..."
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <label>Категория:</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSearchQuery('')
              }}
              className="category-select"
            >
              <option value="">Все категории</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="questions-db-list">
          {questions.length === 0 ? (
            <div className="empty-db-message">Вопросы не найдены</div>
          ) : (
            questions.map((item) => (
              <div
                key={item.id}
                className="question-db-item"
                onClick={() => onSelect(item)}
              >
                <div className="question-db-category">{item.category}</div>
                <div className="question-db-text">{item.question.text}</div>
                <div className="question-db-answer">Ответ: {item.question.answer}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

