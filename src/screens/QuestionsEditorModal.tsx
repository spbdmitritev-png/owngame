import { useState, useEffect } from 'react'
import { Round, Topic, Question } from '../types'
import { questionsDB, QuestionDBItem } from '../utils/questionsDB'
import { uploadMedia } from '../utils/uploadMedia'
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
  const [dbCategories, setDbCategories] = useState<string[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionDBItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState<Record<string, boolean>>({})
  const [mediaFiles, setMediaFiles] = useState<Record<string, File | null>>({})

  useEffect(() => {
    setLocalRounds(rounds)
  }, [rounds])

  useEffect(() => {
    setLocalFinalRound(finalRound)
  }, [finalRound])

  // Загружаем категории при монтировании
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await questionsDB.getCategories()
        setDbCategories(categories)
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }
    loadCategories()
  }, [])

  // Загружаем вопросы при изменении поиска или категории
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true)
      try {
        let questions: QuestionDBItem[]
        if (searchQuery) {
          questions = await questionsDB.search(searchQuery)
        } else if (selectedCategory) {
          questions = await questionsDB.getByCategory(selectedCategory)
        } else {
          questions = await questionsDB.getAll()
        }
        setFilteredQuestions(questions)
      } catch (error) {
        console.error('Error loading questions:', error)
        setFilteredQuestions([])
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [searchQuery, selectedCategory])

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
              // Если тип изменен на text, убираем mediaUrl
              if (field === 'type') {
                const typeValue = value as 'text' | 'image' | 'video' | 'audio'
                return {
                  ...question,
                  type: typeValue,
                  mediaUrl: typeValue === 'text' ? undefined : question.mediaUrl,
                }
              }
              // Для других полей
              return { ...question, [field]: value }
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
                  // Если тип изменен на text, убираем mediaUrl
                  if (field === 'type') {
                    const typeValue = value as 'text' | 'image' | 'video' | 'audio'
                    return {
                      ...question,
                      type: typeValue,
                      mediaUrl: typeValue === 'text' ? undefined : question.mediaUrl,
                    }
                  }
                  // Для других полей
                  return { ...question, [field]: value }
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
    
    console.log('📥 Selected question from DB:', { question, dbItem })
    
    // Обновляем все поля вопроса, включая медиа
    if (roundNumber === 'final') {
      const newTopics = localFinalRound.topics.map((topic, tIdx) => {
        if (tIdx === topicIndex) {
          const newQuestions = topic.questions.map((q, qIdx) => {
            if (qIdx === questionIndex) {
              // Полностью заменяем вопрос данными из БД
              return {
                text: question.text,
                answer: question.answer,
                type: question.type || 'text',
                mediaUrl: question.mediaUrl,
                isPlayed: false,
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
                  // Полностью заменяем вопрос данными из БД
                  return {
                    text: question.text,
                    answer: question.answer,
                    type: question.type || 'text',
                    mediaUrl: question.mediaUrl,
                    isPlayed: false,
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
    
    // Очищаем выбранный файл, если был
    const mediaKey = `${roundNumber}_${topicIndex}_${questionIndex}`
    setMediaFiles({ ...mediaFiles, [mediaKey]: null })
    
    setShowQuestionPicker(null)
  }

  const handleSaveToDB = async (
    roundNumber: number | 'final',
    topicIndex: number,
    questionIndex: number,
    category: string
  ) => {
    console.log('🔥 SAVE TO DB CLICKED', { roundNumber, topicIndex, questionIndex, category })
    
    const round = roundNumber === 'final' ? localFinalRound : localRounds.find((r) => r.number === roundNumber)
    const question = round?.topics[topicIndex]?.questions[questionIndex]
    
    console.log('📝 Question data:', { question, category })
    
    // Валидация перед отправкой
    if (!question || !category.trim()) {
      alert('Заполните категорию и вопрос')
      return
    }

    if (!question.text || !question.answer) {
      alert('Заполните текст вопроса и ответ')
      return
    }

    // Получаем price из номинала вопроса
    const price = roundNumber === 'final' 
      ? 100 // Для финального раунда используем 100 по умолчанию
      : (currentRound?.values[questionIndex] || 100)

    if (!price || price <= 0) {
      alert('Номинал вопроса должен быть больше 0')
      return
    }

    console.log('🚀 Sending to API:', { category: category.trim(), price, question: question.text, answer: question.answer })

    try {
      // Загружаем медиа, если есть файл
      const key = `${roundNumber}_${topicIndex}_${questionIndex}`
      let media_url = question.mediaUrl || null
      let media_type = question.type && question.type !== 'text' ? question.type : null
      
      const file = mediaFiles[key]
      if (file) {
        setUploadingMedia({ ...uploadingMedia, [key]: true })
        try {
          const uploaded = await uploadMedia(file)
          media_url = uploaded.media_url
          media_type = uploaded.media_type as 'image' | 'video' | 'audio' | null
          console.log('✅ Media uploaded:', { media_url, media_type })
        } catch (uploadError) {
          console.error('❌ Error uploading media:', uploadError)
          alert('Ошибка при загрузке медиа-файла. Вопрос будет сохранён без медиа.')
        } finally {
          setUploadingMedia({ ...uploadingMedia, [key]: false })
        }
      }

      // Создаём вопрос с медиа
      const questionWithMedia: Question = {
        ...question,
        mediaUrl: media_url || undefined,
        type: media_type || question.type || 'text',
      }

      const savedId = await questionsDB.add(category.trim(), questionWithMedia, price)
      console.log('✅ Question saved successfully:', savedId)
      
      // Очищаем файл после успешного сохранения
      setMediaFiles({ ...mediaFiles, [key]: null })
      
      // Очищаем поле категории
      setCategoryInputs({ ...categoryInputs, [key]: '' })
      
      // Обновляем категории и вопросы после сохранения
      const categories = await questionsDB.getCategories()
      setDbCategories(categories)
      
      // Обновляем список вопросов
      let questions: QuestionDBItem[]
      if (searchQuery) {
        questions = await questionsDB.search(searchQuery)
      } else if (selectedCategory) {
        questions = await questionsDB.getByCategory(selectedCategory)
      } else {
        questions = await questionsDB.getAll()
      }
      setFilteredQuestions(questions)
      
      alert('Вопрос успешно сохранён в базу данных!')
    } catch (error) {
      console.error('❌ Error saving question to DB:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert(`Ошибка при сохранении вопроса: ${errorMessage}`)
    }
  }

  const getCategoryInputKey = (roundNumber: number | 'final', topicIndex: number, questionIndex: number) => {
    return `${roundNumber}_${topicIndex}_${questionIndex}`
  }

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
                                  console.log('🔘 Save to DB button clicked')
                                  const key = getCategoryInputKey(selectedRound, topicIndex, questionIndex)
                                  const category = categoryInputs[key] || ''
                                  console.log('📋 Category from input:', category)
                                  if (category.trim()) {
                                    handleSaveToDB(selectedRound, topicIndex, questionIndex, category)
                                  } else {
                                    alert('Введите категорию перед сохранением')
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
                                {question.type === 'image' && 'Медиа (изображение)'}
                                {question.type === 'video' && 'Медиа (видео)'}
                                {question.type === 'audio' && 'Медиа (аудио)'}
                                :
                              </label>
                              <div className="media-upload-container">
                                <input
                                  type="file"
                                  id={`media-upload-${selectedRound}-${topicIndex}-${questionIndex}`}
                                  accept={
                                    question.type === 'image' ? 'image/*'
                                    : question.type === 'video' ? 'video/*'
                                    : question.type === 'audio' ? 'audio/*'
                                    : '*/*'
                                  }
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null
                                    const key = `${selectedRound}_${topicIndex}_${questionIndex}`
                                    setMediaFiles({ ...mediaFiles, [key]: file })
                                    if (file) {
                                      // Автоматически определяем тип по файлу
                                      const fileType = file.type.startsWith('image') ? 'image'
                                        : file.type.startsWith('video') ? 'video'
                                        : file.type.startsWith('audio') ? 'audio'
                                        : 'text'
                                      if (fileType !== question.type) {
                                        handleQuestionChange(selectedRound, topicIndex, questionIndex, 'type', fileType)
                                      }
                                    }
                                  }}
                                  className="question-media-input"
                                  style={{ display: 'none' }}
                                />
                                <label
                                  htmlFor={`media-upload-${selectedRound}-${topicIndex}-${questionIndex}`}
                                  className="upload-media-button"
                                >
                                  📁 Загрузить {question.type === 'image' ? 'изображение' : question.type === 'video' ? 'видео' : 'аудио'}
                                </label>
                              </div>
                              {(() => {
                                const key = `${selectedRound}_${topicIndex}_${questionIndex}`
                                const file = mediaFiles[key]
                                const isUploading = uploadingMedia[key]
                                return (
                                  <>
                                    {file && (
                                      <div className="media-file-info">
                                        Выбран файл: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        {isUploading && <span className="uploading-indicator">⏳ Загрузка...</span>}
                                      </div>
                                    )}
                                    {question.mediaUrl && !file && (
                                      <div className="media-preview">
                                        <div className="media-url-info">Текущий URL: {question.mediaUrl}</div>
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
                                  </>
                                )
                              })()}
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
          loading={loading}
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
  loading,
}: {
  onSelect: (item: QuestionDBItem) => void
  onClose: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  categories: string[]
  questions: QuestionDBItem[]
  loading: boolean
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
          {loading ? (
            <div className="empty-db-message">Загрузка...</div>
          ) : questions.length === 0 ? (
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

