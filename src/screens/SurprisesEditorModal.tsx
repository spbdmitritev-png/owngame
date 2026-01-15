import { useState, useEffect, useRef } from 'react'
import { Round, SurpriseType, CustomSurprise } from '../types'
import './SurprisesEditorModal.css'

const DEFAULT_SURPRISE_TYPES: SurpriseType[] = ['cat', 'auction', 'toast', 'gift']

const DEFAULT_SURPRISE_NAMES: Record<string, string> = {
  cat: 'Кот в мешке',
  auction: 'Аукцион',
  toast: 'Вопрос-тост',
  gift: 'Мгновенный подарок',
}

const DEFAULT_SURPRISE_EMOJIS: Record<string, string> = {
  cat: '🐱',
  auction: '🔨',
  toast: '🥂',
  gift: '🎁',
}

interface SurprisesEditorModalProps {
  rounds: Round[]
  onClose: () => void
  onSurprisesChange: (roundNumber: number, round: Round) => void
  customSurprises: Record<string, CustomSurprise>
  onCustomSurprisesChange: (surprises: Record<string, CustomSurprise>) => void
}

export default function SurprisesEditorModal({
  rounds,
  onClose,
  onSurprisesChange,
  customSurprises,
  onCustomSurprisesChange,
}: SurprisesEditorModalProps) {
  const [selectedRound, setSelectedRound] = useState(1)
  const [localRounds, setLocalRounds] = useState<Round[]>(rounds)
  const [showSurpriseManager, setShowSurpriseManager] = useState(false)
  const [showRandomDistributor, setShowRandomDistributor] = useState(false)
  const [surpriseCounts, setSurpriseCounts] = useState<Record<number, Record<SurpriseType, number>>>({})
  const [draggedFrom, setDraggedFrom] = useState<{
    roundNumber: number
    topicIndex: number
    questionIndex: number
  } | null>(null)

  const getSurpriseName = (type: SurpriseType): string => {
    // Сначала проверяем кастомную версию стандартного сюрприза
    const customDefault = customSurprises[`default_${type}`]
    if (customDefault) {
      return customDefault.name
    }
    // Затем проверяем стандартное название
    if (DEFAULT_SURPRISE_NAMES[type]) {
      return DEFAULT_SURPRISE_NAMES[type]
    }
    // Затем проверяем кастомный сюрприз
    return customSurprises[type]?.name || type
  }

  const getSurpriseEmoji = (type: SurpriseType): string => {
    // Сначала проверяем кастомную версию стандартного сюрприза
    const customDefault = customSurprises[`default_${type}`]
    if (customDefault) {
      return customDefault.emoji
    }
    // Затем проверяем стандартный эмодзи
    if (DEFAULT_SURPRISE_EMOJIS[type]) {
      return DEFAULT_SURPRISE_EMOJIS[type]
    }
    // Затем проверяем кастомный сюрприз
    return customSurprises[type]?.emoji || '🎁'
  }

  const getAllSurpriseTypes = (): SurpriseType[] => {
    return [...DEFAULT_SURPRISE_TYPES, ...Object.keys(customSurprises)]
  }

  useEffect(() => {
    setLocalRounds(rounds)
  }, [rounds])

  const currentRound = localRounds.find((r) => r.number === selectedRound)

  const handleAddSurprise = (
    roundNumber: number,
    topicIndex: number,
    questionIndex: number,
    surpriseType: SurpriseType
  ) => {
    const updatedRounds = localRounds.map((round) => {
      if (round.number === roundNumber) {
        const newTopics = round.topics.map((topic, tIdx) => {
          if (tIdx === topicIndex) {
            return {
              ...topic,
              questions: topic.questions.map((q, qIdx) =>
                qIdx === questionIndex ? { ...q, surprise: surpriseType } : q
              ),
            }
          }
          return topic
        })
        return { ...round, topics: newTopics }
      }
      return round
    })
    setLocalRounds(updatedRounds)
    const updatedRound = updatedRounds.find((r) => r.number === roundNumber)
    if (updatedRound) {
      onSurprisesChange(roundNumber, updatedRound)
    }
  }

  const handleRemoveSurprise = (roundNumber: number, topicIndex: number, questionIndex: number) => {
    const updatedRounds = localRounds.map((round) => {
      if (round.number === roundNumber) {
        const newTopics = round.topics.map((topic, tIdx) => {
          if (tIdx === topicIndex) {
            return {
              ...topic,
              questions: topic.questions.map((q, qIdx) =>
                qIdx === questionIndex ? { ...q, surprise: undefined } : q
              ),
            }
          }
          return topic
        })
        return { ...round, topics: newTopics }
      }
      return round
    })
    setLocalRounds(updatedRounds)
    const updatedRound = updatedRounds.find((r) => r.number === roundNumber)
    if (updatedRound) {
      onSurprisesChange(roundNumber, updatedRound)
    }
  }

  const handleDragStart = (roundNumber: number, topicIndex: number, questionIndex: number) => {
    const round = localRounds.find((r) => r.number === roundNumber)
    const question = round?.topics[topicIndex]?.questions[questionIndex]
    if (question?.surprise) {
      setDraggedFrom({ roundNumber, topicIndex, questionIndex })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (
    toRoundNumber: number,
    toTopicIndex: number,
    toQuestionIndex: number
  ) => {
    if (draggedFrom) {
      const fromRound = localRounds.find((r) => r.number === draggedFrom.roundNumber)
      const fromQuestion =
        fromRound?.topics[draggedFrom.topicIndex]?.questions[draggedFrom.questionIndex]
      const surpriseType = fromQuestion?.surprise

      if (surpriseType) {
        // Убираем сюрприз с исходного места
        let updatedRounds = localRounds.map((round) => {
          if (round.number === draggedFrom.roundNumber) {
            const newTopics = round.topics.map((topic, tIdx) => {
              if (tIdx === draggedFrom.topicIndex) {
                return {
                  ...topic,
                  questions: topic.questions.map((q, qIdx) =>
                    qIdx === draggedFrom.questionIndex ? { ...q, surprise: undefined } : q
                  ),
                }
              }
              return topic
            })
            return { ...round, topics: newTopics }
          }
          return round
        })

        // Добавляем сюрприз на новое место
        updatedRounds = updatedRounds.map((round) => {
          if (round.number === toRoundNumber) {
            const newTopics = round.topics.map((topic, tIdx) => {
              if (tIdx === toTopicIndex) {
                return {
                  ...topic,
                  questions: topic.questions.map((q, qIdx) =>
                    qIdx === toQuestionIndex ? { ...q, surprise: surpriseType } : q
                  ),
                }
              }
              return topic
            })
            return { ...round, topics: newTopics }
          }
          return round
        })

        setLocalRounds(updatedRounds)
        const updatedRound = updatedRounds.find((r) => r.number === toRoundNumber)
        if (updatedRound) {
          onSurprisesChange(toRoundNumber, updatedRound)
        }
        if (draggedFrom.roundNumber !== toRoundNumber) {
          const fromRound = updatedRounds.find((r) => r.number === draggedFrom.roundNumber)
          if (fromRound) {
            onSurprisesChange(draggedFrom.roundNumber, fromRound)
          }
        }
      }
      setDraggedFrom(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedFrom(null)
  }

  const handleRandomDistribute = (roundNumber: number) => {
    const round = localRounds.find((r) => r.number === roundNumber)
    if (!round) return

    const counts = surpriseCounts[roundNumber] || {}
    const totalQuestions = round.topics.length * round.topics[0]?.questions.length || 0
    
    // Проверяем, что сумма не превышает количество вопросов
    const totalSurprises = Object.values(counts).reduce((sum, count) => sum + (count || 0), 0)
    if (totalSurprises > totalQuestions) {
      alert(`Общее количество сюрпризов (${totalSurprises}) превышает количество вопросов (${totalQuestions})`)
      return
    }

    // Создаем список всех позиций
    const positions: Array<{ topicIndex: number; questionIndex: number }> = []
    round.topics.forEach((topic, topicIndex) => {
      topic.questions.forEach((_, questionIndex) => {
        positions.push({ topicIndex, questionIndex })
      })
    })

    // Перемешиваем позиции
    const shuffled = [...positions].sort(() => Math.random() - 0.5)

    // Создаем список сюрпризов для размещения
    const surprisesToPlace: SurpriseType[] = []
    getAllSurpriseTypes().forEach((type) => {
      const count = counts[type] || 0
      for (let i = 0; i < count; i++) {
        surprisesToPlace.push(type)
      }
    })

    // Очищаем все существующие сюрпризы в раунде
    const updatedRounds = localRounds.map((r) => {
      if (r.number === roundNumber) {
        const newTopics = r.topics.map((topic) => ({
          ...topic,
          questions: topic.questions.map((q) => ({ ...q, surprise: undefined })),
        }))
        return { ...r, topics: newTopics }
      }
      return r
    })

    // Размещаем сюрпризы случайным образом
    surprisesToPlace.forEach((surpriseType, index) => {
      if (index < shuffled.length) {
        const pos = shuffled[index]
        const roundIndex = updatedRounds.findIndex((r) => r.number === roundNumber)
        if (roundIndex !== -1) {
          const round = updatedRounds[roundIndex]
          const topic = round.topics[pos.topicIndex]
          if (topic && topic.questions[pos.questionIndex]) {
            const newTopics = round.topics.map((t, tIdx) => {
              if (tIdx === pos.topicIndex) {
                return {
                  ...t,
                  questions: t.questions.map((q, qIdx) =>
                    qIdx === pos.questionIndex ? { ...q, surprise: surpriseType } : q
                  ),
                }
              }
              return t
            })
            updatedRounds[roundIndex] = { ...round, topics: newTopics }
          }
        }
      }
    })

    setLocalRounds(updatedRounds)
    const updatedRound = updatedRounds.find((r) => r.number === roundNumber)
    if (updatedRound) {
      onSurprisesChange(roundNumber, updatedRound)
    }
  }

  const updateSurpriseCount = (roundNumber: number, type: SurpriseType, count: number) => {
    setSurpriseCounts({
      ...surpriseCounts,
      [roundNumber]: {
        ...(surpriseCounts[roundNumber] || {}),
        [type]: Math.max(0, count),
      },
    })
  }

  if (!currentRound) return null

  return (
    <div className="surprises-modal-overlay" onClick={onClose}>
      <div className="surprises-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="surprises-modal-header">
          <h2>Редактирование сюрпризов</h2>
          <div className="header-actions">
            <button
              className="manage-surprises-button"
              onClick={() => setShowSurpriseManager(!showSurpriseManager)}
              title="Управление сюрпризами"
            >
              ⚙️ Управление сюрпризами
            </button>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {showSurpriseManager && (
          <SurpriseManager
            customSurprises={customSurprises}
            onCustomSurprisesChange={onCustomSurprisesChange}
            onClose={() => setShowSurpriseManager(false)}
          />
        )}

        <div className="rounds-tabs">
          {rounds.map((round) => (
            <button
              key={round.number}
              className={`round-tab ${selectedRound === round.number ? 'active' : ''}`}
              onClick={() => setSelectedRound(round.number)}
            >
              Раунд {round.number}
            </button>
          ))}
        </div>

        <div className="surprises-edit-instructions">
          <div className="instruction-item">
            <strong>Добавить сюрприз:</strong> Нажмите на ячейку вопроса и выберите тип сюрприза
          </div>
          <div className="instruction-item">
            <strong>Удалить/Изменить сюрприз:</strong> Нажмите на сюрприз в ячейке
          </div>
          <div className="instruction-item">
            <strong>Переместить сюрприз:</strong> Перетащите сюрприз из одной ячейки в другую
          </div>
          <div className="instruction-item">
            <strong>Случайное распределение:</strong> Укажите количество каждого типа сюрприза и нажмите "Случайно распределить"
          </div>
        </div>

        <div className="random-distribute-section">
          <button
            className="toggle-random-button"
            onClick={() => setShowRandomDistributor(!showRandomDistributor)}
          >
            {showRandomDistributor ? '▼' : '▶'} Случайное распределение сюрпризов
          </button>
          {showRandomDistributor && (
            <RandomSurpriseDistributor
              roundNumber={selectedRound}
              totalQuestions={currentRound.topics.length * currentRound.topics[0]?.questions.length || 0}
              surpriseCounts={surpriseCounts[selectedRound] || {}}
              onCountChange={(type, count) => updateSurpriseCount(selectedRound, type, count)}
              onDistribute={() => handleRandomDistribute(selectedRound)}
              getAllSurpriseTypes={getAllSurpriseTypes}
              getSurpriseName={getSurpriseName}
              getSurpriseEmoji={getSurpriseEmoji}
            />
          )}
        </div>

        <div className="surprises-grid">
          <div className="grid-header">
            <div className="header-cell corner-cell"></div>
            {currentRound.values.map((value, valueIndex) => (
              <div key={valueIndex} className="header-cell value-header">
                {value}
              </div>
            ))}
          </div>

          <div className="surprises-grid-content">
            {currentRound.topics.map((topic, topicIndex) => (
              <div key={topicIndex} className="grid-row">
                <div className="topic-cell">{topic.name}</div>
                {currentRound.values.map((value, valueIndex) => {
                  const question = topic.questions[valueIndex]
                  const surpriseType = question?.surprise

                  return (
                    <div
                      key={valueIndex}
                      className={`surprise-cell ${surpriseType ? 'has-surprise' : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(selectedRound, topicIndex, valueIndex)}
                      onDragEnd={handleDragEnd}
                    >
                      {surpriseType ? (
                        <SurpriseEditor
                          currentType={surpriseType}
                          onEdit={(newType) =>
                            handleAddSurprise(selectedRound, topicIndex, valueIndex, newType)
                          }
                          onRemove={() =>
                            handleRemoveSurprise(selectedRound, topicIndex, valueIndex)
                          }
                          onDragStart={() =>
                            handleDragStart(selectedRound, topicIndex, valueIndex)
                          }
                          getSurpriseName={getSurpriseName}
                          getSurpriseEmoji={getSurpriseEmoji}
                          getAllSurpriseTypes={getAllSurpriseTypes}
                        />
                      ) : (
                        <SurpriseSelector
                          onSelect={(type) =>
                            handleAddSurprise(selectedRound, topicIndex, valueIndex, type)
                          }
                          getSurpriseName={getSurpriseName}
                          getSurpriseEmoji={getSurpriseEmoji}
                          getAllSurpriseTypes={getAllSurpriseTypes}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmojiPicker({
  emojis,
  onSelect,
  onClose,
}: {
  emojis: string[]
  onSelect: (emoji: string) => void
  onClose: () => void
}) {
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  return (
    <div className="emoji-picker-overlay">
      <div className="emoji-picker" ref={pickerRef}>
        <div className="emoji-picker-header">
          <h4>Выберите эмодзи</h4>
          <button className="close-emoji-picker" onClick={onClose}>×</button>
        </div>
        <div className="emoji-grid">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              className="emoji-item"
              onClick={() => onSelect(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SurpriseSelector({
  onSelect,
  getSurpriseName,
  getSurpriseEmoji,
  getAllSurpriseTypes,
}: {
  onSelect: (type: SurpriseType) => void
  getSurpriseName: (type: SurpriseType) => string
  getSurpriseEmoji: (type: SurpriseType) => string
  getAllSurpriseTypes: () => SurpriseType[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; maxHeight?: number } | null>(null)
  const selectorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setMenuPosition(null)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Вычисляем позицию меню
      if (selectorRef.current) {
        const rect = selectorRef.current.getBoundingClientRect()
        const menuMaxHeight = 250 // Максимальная высота меню
        const menuMinHeight = 150 // Минимальная высота меню
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const padding = 10 // Отступ от края экрана
        
        let top: number
        let maxHeight: number
        
        // Показываем меню снизу, если есть место, иначе сверху
        if (spaceBelow >= menuMinHeight || spaceBelow > spaceAbove) {
          // Меню снизу
          top = rect.bottom + 5
          maxHeight = Math.min(menuMaxHeight, spaceBelow - padding)
        } else {
          // Меню сверху
          top = Math.max(padding, rect.top - menuMaxHeight - 5)
          maxHeight = Math.min(menuMaxHeight, spaceAbove - padding)
        }
        
        setMenuPosition({
          top,
          left: rect.left + rect.width / 2,
          maxHeight
        })
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <>
      <div className="surprise-selector" ref={selectorRef}>
        <button
          className="add-surprise-button"
          onClick={() => setIsOpen(!isOpen)}
          title="Добавить сюрприз"
        >
          +
        </button>
      </div>
      {isOpen && menuPosition && (
        <div 
          className="surprise-options" 
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            transform: 'translateX(-50%)',
            maxHeight: menuPosition.maxHeight ? `${menuPosition.maxHeight}px` : '80vh',
          }}
        >
          {getAllSurpriseTypes().map((type) => (
            <button
              key={type}
              className="surprise-option"
              onClick={() => {
                onSelect(type)
                setIsOpen(false)
                setMenuPosition(null)
              }}
            >
              <span className="surprise-emoji">{getSurpriseEmoji(type)}</span>
              <span>{getSurpriseName(type)}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function SurpriseEditor({
  currentType,
  onEdit,
  onRemove,
  onDragStart,
  getSurpriseName,
  getSurpriseEmoji,
  getAllSurpriseTypes,
}: {
  currentType: SurpriseType
  onEdit: (type: SurpriseType) => void
  onRemove: () => void
  onDragStart: () => void
  getSurpriseName: (type: SurpriseType) => string
  getSurpriseEmoji: (type: SurpriseType) => string
  getAllSurpriseTypes: () => SurpriseType[]
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; maxHeight?: number } | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setShowMenu(false)
        setMenuPosition(null)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      // Вычисляем позицию меню
      if (editorRef.current) {
        const rect = editorRef.current.getBoundingClientRect()
        const menuMaxHeight = 300 // Максимальная высота меню
        const menuMinHeight = 150 // Минимальная высота меню
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const padding = 10 // Отступ от края экрана
        
        let top: number
        let maxHeight: number
        
        // Показываем меню снизу, если есть место, иначе сверху
        if (spaceBelow >= menuMinHeight || spaceBelow > spaceAbove) {
          // Меню снизу
          top = rect.bottom + 5
          maxHeight = Math.min(menuMaxHeight, spaceBelow - padding)
        } else {
          // Меню сверху
          top = Math.max(padding, rect.top - menuMaxHeight - 5)
          maxHeight = Math.min(menuMaxHeight, spaceAbove - padding)
        }
        
        setMenuPosition({
          top,
          left: rect.left + rect.width / 2,
          maxHeight
        })
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  return (
    <>
      <div className="surprise-editor" ref={editorRef}>
        <div
          className="surprise-item"
          draggable
          onDragStart={onDragStart}
          onClick={() => setShowMenu(!showMenu)}
          title={getSurpriseName(currentType)}
        >
          <span className="surprise-emoji">{getSurpriseEmoji(currentType)}</span>
        </div>
      </div>
      {showMenu && menuPosition && (
        <div 
          className="surprise-menu" 
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            transform: 'translateX(-50%)',
            maxHeight: menuPosition.maxHeight ? `${menuPosition.maxHeight}px` : '80vh',
          }}
        >
          <div className="menu-section">
            <div className="menu-title">Изменить тип:</div>
            {getAllSurpriseTypes().map((type) => (
              <button
                key={type}
                className={`surprise-option ${type === currentType ? 'current' : ''}`}
                onClick={() => {
                  if (type !== currentType) {
                    onEdit(type)
                  }
                  setShowMenu(false)
                  setMenuPosition(null)
                }}
              >
                <span className="surprise-emoji">{getSurpriseEmoji(type)}</span>
                <span>{getSurpriseName(type)}</span>
                {type === currentType && <span className="current-indicator">✓</span>}
              </button>
            ))}
          </div>
          <div className="menu-divider"></div>
          <button
            className="remove-button"
            onClick={() => {
              onRemove()
              setShowMenu(false)
              setMenuPosition(null)
            }}
          >
            Удалить сюрприз
          </button>
        </div>
      )}
    </>
  )
}

const POPULAR_EMOJIS = [
  '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧', '🎵', '🎶',
  '🎸', '🎹', '🎺', '🎻', '🥁', '🎷', '🏆', '🥇', '🥈', '🥉',
  '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎁', '🎀', '🎂', '🎃',
  '🎄', '🎅', '🎆', '🎇', '✨', '🎈', '🎉', '🎊', '🎋', '🎌',
  '🎍', '🎎', '🎏', '🎐', '🎑', '🎒', '🎓', '🎙️', '🎚️', '🎛️',
  '🎠', '🎡', '🎢', '🎣', '🎥', '🎦', '🎩', '🎮', '🎰', '🎱',
  '🎳', '🎴', '🎼', '🎽', '🎾', '🎿', '🏀', '🏁', '🏂', '🏃',
  '🏄', '🏇', '🏈', '🏉', '🏊', '🏋️', '🏌️', '🏍️', '🏎️', '🏏',
  '🏐', '🏑', '🏒', '🏓', '🏔️', '🏕️', '🏖️', '🏗️', '🏘️', '🏙️',
  '🏚️', '🏛️', '🏜️', '🏝️', '🏞️', '🏟️', '🏠', '🏡', '🏢', '🏣',
  '🏤', '🏥', '🏦', '🏧', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭',
  '🏮', '🏯', '🏰', '🏱', '🏲', '🏳️', '🏴', '🏵️', '🏶', '🏷️'
]

function SurpriseManager({
  customSurprises,
  onCustomSurprisesChange,
  onClose,
}: {
  customSurprises: Record<string, CustomSurprise>
  onCustomSurprisesChange: (surprises: Record<string, CustomSurprise>) => void
  onClose: () => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newSurprise, setNewSurprise] = useState({ name: '', emoji: '' })
  const [editingSurprise, setEditingSurprise] = useState({ name: '', emoji: '' })
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiPickerFor, setEmojiPickerFor] = useState<'new' | string>('new')

  const handleCreate = () => {
    if (newSurprise.name.trim() && newSurprise.emoji.trim()) {
      const id = `custom_${Date.now()}`
      onCustomSurprisesChange({
        ...customSurprises,
        [id]: {
          id,
          name: newSurprise.name.trim(),
          emoji: newSurprise.emoji.trim(),
        },
      })
      setNewSurprise({ name: '', emoji: '' })
    }
  }

  const handleStartEdit = (id: string) => {
    const allSurprises = getAllSurprises()
    const surprise = allSurprises.find((s) => s.id === id)
    if (surprise) {
      setEditingId(id)
      setEditingSurprise({ name: surprise.name, emoji: surprise.emoji })
    }
  }

  const handleSaveEdit = () => {
    if (editingId && editingSurprise.name.trim() && editingSurprise.emoji.trim()) {
      onCustomSurprisesChange({
        ...customSurprises,
        [editingId]: {
          id: editingId,
          name: editingSurprise.name.trim(),
          emoji: editingSurprise.emoji.trim(),
        },
      })
      setEditingId(null)
      setEditingSurprise({ name: '', emoji: '' })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Удалить этот сюрприз? Он будет удален из всех ячеек, где используется.')) {
      const updated = { ...customSurprises }
      delete updated[id]
      onCustomSurprisesChange(updated)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    if (emojiPickerFor === 'new') {
      setNewSurprise({ ...newSurprise, emoji })
    } else {
      setEditingSurprise({ ...editingSurprise, emoji })
    }
    setShowEmojiPicker(false)
  }

  const getAllSurprises = (): CustomSurprise[] => {
    const allSurprises: CustomSurprise[] = []
    
    // Добавляем стандартные сюрпризы (с кастомными версиями если есть)
    DEFAULT_SURPRISE_TYPES.forEach((type) => {
      const customId = `default_${type}`
      const custom = customSurprises[customId]
      allSurprises.push({
        id: customId,
        name: custom?.name || DEFAULT_SURPRISE_NAMES[type],
        emoji: custom?.emoji || DEFAULT_SURPRISE_EMOJIS[type],
      })
    })
    
    // Добавляем кастомные сюрпризы
    Object.values(customSurprises)
      .filter((s) => !s.id.startsWith('default_'))
      .forEach((surprise) => allSurprises.push(surprise))
    
    return allSurprises
  }

  return (
    <div className="surprise-manager">
      <div className="manager-header">
        <h3>Управление сюрпризами</h3>
        <button className="close-manager-button" onClick={onClose}>×</button>
      </div>

      <div className="manager-content">
        <div className="manager-section">
          <h4>Все сюрпризы</h4>
          <div className="surprises-list">
            {getAllSurprises().map((surprise) => (
              <div key={surprise.id} className="surprise-manager-item">
                {editingId === surprise.id ? (
                  <>
                    <button
                      className="emoji-picker-button"
                      onClick={() => {
                        setEmojiPickerFor(surprise.id)
                        setShowEmojiPicker(true)
                      }}
                      title="Выбрать эмодзи"
                    >
                      {editingSurprise.emoji || '😀'}
                    </button>
                    <input
                      type="text"
                      value={editingSurprise.name}
                      onChange={(e) =>
                        setEditingSurprise({ ...editingSurprise, name: e.target.value })
                      }
                      placeholder="Название"
                      className="edit-input name-input"
                    />
                    <button className="save-button" onClick={handleSaveEdit}>
                      ✓
                    </button>
                    <button
                      className="cancel-button"
                      onClick={() => {
                        setEditingId(null)
                        setEditingSurprise({ name: '', emoji: '' })
                      }}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <span className="surprise-preview">
                      <span className="surprise-emoji">{surprise.emoji}</span>
                      <span className="surprise-name">{surprise.name}</span>
                    </span>
                    <button
                      className="edit-button"
                      onClick={() => handleStartEdit(surprise.id)}
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    {!surprise.id.startsWith('default_') && (
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(surprise.id)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
            {getAllSurprises().length === 0 && (
              <div className="empty-message">Нет сюрпризов</div>
            )}
          </div>
        </div>

        <div className="manager-section">
          <h4>Создать новый сюрприз</h4>
          <div className="create-surprise-form">
            <button
              className="emoji-picker-button"
              onClick={() => {
                setEmojiPickerFor('new')
                setShowEmojiPicker(true)
              }}
              title="Выбрать эмодзи"
            >
              {newSurprise.emoji || '😀'}
            </button>
            <input
              type="text"
              value={newSurprise.name}
              onChange={(e) => setNewSurprise({ ...newSurprise, name: e.target.value })}
              placeholder="Название (например: Бонусный вопрос)"
              className="create-input"
            />
            <button className="create-button" onClick={handleCreate}>
              + Создать
            </button>
          </div>
        </div>
      </div>

      {showEmojiPicker && (
        <EmojiPicker
          emojis={POPULAR_EMOJIS}
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  )
}

function RandomSurpriseDistributor({
  roundNumber,
  totalQuestions,
  surpriseCounts,
  onCountChange,
  onDistribute,
  getAllSurpriseTypes,
  getSurpriseName,
  getSurpriseEmoji,
}: {
  roundNumber: number
  totalQuestions: number
  surpriseCounts: Record<SurpriseType, number>
  onCountChange: (type: SurpriseType, count: number) => void
  onDistribute: () => void
  getAllSurpriseTypes: () => SurpriseType[]
  getSurpriseName: (type: SurpriseType) => string
  getSurpriseEmoji: (type: SurpriseType) => string
}) {
  const totalSurprises = Object.values(surpriseCounts).reduce((sum, count) => sum + (count || 0), 0)
  const remaining = totalQuestions - totalSurprises

  return (
    <div className="random-distributor">
      <div className="distributor-header">
        <h4>Раунд {roundNumber}</h4>
        <div className="questions-info">
          Всего вопросов: {totalQuestions} | Осталось мест: {remaining}
        </div>
      </div>
      <div className="surprise-counts-list">
        {getAllSurpriseTypes().map((type) => (
          <div key={type} className="surprise-count-item">
            <span className="surprise-count-emoji">{getSurpriseEmoji(type)}</span>
            <span className="surprise-count-name">{getSurpriseName(type)}</span>
            <input
              type="number"
              min="0"
              max={totalQuestions}
              value={surpriseCounts[type] || 0}
              onChange={(e) => onCountChange(type, parseInt(e.target.value) || 0)}
              className="surprise-count-input"
            />
          </div>
        ))}
      </div>
      <button
        className="distribute-button"
        onClick={onDistribute}
        disabled={totalSurprises === 0 || totalSurprises > totalQuestions}
      >
        🎲 Случайно распределить
      </button>
      {totalSurprises > totalQuestions && (
        <div className="error-message">
          Общее количество сюрпризов превышает количество вопросов!
        </div>
      )}
    </div>
  )
}

