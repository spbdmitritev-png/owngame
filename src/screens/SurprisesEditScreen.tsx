import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import { SurpriseType } from '../types'
import './SurprisesEditScreen.css'

const SURPRISE_TYPES: SurpriseType[] = ['cat', 'auction', 'toast', 'gift']

const SURPRISE_NAMES: Record<SurpriseType, string> = {
  cat: 'Кот в мешке',
  auction: 'Аукцион',
  toast: 'Вопрос-тост',
  gift: 'Мгновенный подарок',
}

const SURPRISE_EMOJIS: Record<SurpriseType, string> = {
  cat: '🐱',
  auction: '🔨',
  toast: '🥂',
  gift: '🎁',
}

export default function SurprisesEditScreen() {
  const { roundNumber } = useParams<{ roundNumber: string }>()
  const navigate = useNavigate()
  const { gameState, setSurprise, moveSurprise } = useGame()
  const [draggedFrom, setDraggedFrom] = useState<{ topicIndex: number; questionIndex: number } | null>(null)

  if (!gameState || !roundNumber) {
    return <div>Загрузка...</div>
  }

  const roundNum = parseInt(roundNumber)
  const round = gameState.rounds[roundNum - 1]

  if (!round) {
    return <div>Раунд не найден</div>
  }

  const handleAddSurprise = (topicIndex: number, questionIndex: number, surpriseType: SurpriseType) => {
    setSurprise(roundNum, topicIndex, questionIndex, surpriseType)
  }

  const handleRemoveSurprise = (topicIndex: number, questionIndex: number) => {
    setSurprise(roundNum, topicIndex, questionIndex, undefined)
  }

  const handleDragStart = (topicIndex: number, questionIndex: number) => {
    const question = round.topics[topicIndex]?.questions[questionIndex]
    if (question?.surprise) {
      setDraggedFrom({ topicIndex, questionIndex })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (toTopicIndex: number, toQuestionIndex: number) => {
    if (draggedFrom) {
      moveSurprise(
        roundNum,
        draggedFrom.topicIndex,
        draggedFrom.questionIndex,
        toTopicIndex,
        toQuestionIndex
      )
      setDraggedFrom(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedFrom(null)
  }

  return (
    <div className="surprises-edit-screen">
      <div className="surprises-edit-header">
        <h1>Редактирование сюрпризов - Раунд {roundNum}</h1>
        <button onClick={() => navigate(`/round/${roundNum}`)} className="back-button">
          Назад к раунду
        </button>
      </div>

      <div className="surprises-edit-instructions">
        <div className="instruction-item">
          <strong>Добавить сюрприз:</strong> Нажмите на ячейку вопроса и выберите тип сюрприза
        </div>
        <div className="instruction-item">
          <strong>Удалить сюрприз:</strong> Нажмите на сюрприз в ячейке
        </div>
        <div className="instruction-item">
          <strong>Переместить сюрприз:</strong> Перетащите сюрприз из одной ячейки в другую
        </div>
      </div>

      <div className="surprises-grid">
        <div className="grid-header">
          <div className="header-cell corner-cell"></div>
          {round.values.map((value, valueIndex) => (
            <div key={valueIndex} className="header-cell value-header">
              {value}
            </div>
          ))}
        </div>

        <div className="surprises-grid-content">
          {round.topics.map((topic, topicIndex) => (
            <div key={topicIndex} className="grid-row">
              <div className="topic-cell">{topic.name}</div>
              {round.values.map((value, valueIndex) => {
                const question = topic.questions[valueIndex]
                const surpriseType = question?.surprise
                const isPlayed = question?.isPlayed || false

                return (
                  <div
                    key={valueIndex}
                    className={`surprise-cell ${surpriseType ? 'has-surprise' : ''} ${isPlayed ? 'played' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={() => !isPlayed && handleDrop(topicIndex, valueIndex)}
                    onDragEnd={handleDragEnd}
                  >
                    {isPlayed ? (
                      <div className="played-indicator">Сыграно</div>
                    ) : surpriseType ? (
                      <SurpriseEditor
                        currentType={surpriseType}
                        onEdit={(newType) => handleAddSurprise(topicIndex, valueIndex, newType)}
                        onRemove={() => handleRemoveSurprise(topicIndex, valueIndex)}
                        onDragStart={() => handleDragStart(topicIndex, valueIndex)}
                      />
                    ) : (
                      <SurpriseSelector
                        onSelect={(type) => handleAddSurprise(topicIndex, valueIndex, type)}
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
  )
}

function SurpriseSelector({ onSelect }: { onSelect: (type: SurpriseType) => void }) {
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
          {SURPRISE_TYPES.map((type) => (
            <button
              key={type}
              className="surprise-option"
              onClick={() => {
                onSelect(type)
                setIsOpen(false)
                setMenuPosition(null)
              }}
            >
              <span className="surprise-emoji">{SURPRISE_EMOJIS[type]}</span>
              <span>{SURPRISE_NAMES[type]}</span>
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
}: {
  currentType: SurpriseType
  onEdit: (type: SurpriseType) => void
  onRemove: () => void
  onDragStart: () => void
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
          title="Нажмите для редактирования или перетащите для перемещения"
        >
          <span className="surprise-emoji">{SURPRISE_EMOJIS[currentType]}</span>
          <span className="surprise-name">{SURPRISE_NAMES[currentType]}</span>
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
            {SURPRISE_TYPES.map((type) => (
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
                <span className="surprise-emoji">{SURPRISE_EMOJIS[type]}</span>
                <span>{SURPRISE_NAMES[type]}</span>
                {type === currentType && <span className="current-indicator">✓</span>}
              </button>
            ))}
          </div>
          <div className="menu-divider"></div>
          <button className="remove-button" onClick={() => {
            onRemove()
            setShowMenu(false)
            setMenuPosition(null)
          }}>
            Удалить сюрприз
          </button>
        </div>
      )}
    </>
  )
}

