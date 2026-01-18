import { useState, useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'
import { useNavigate } from 'react-router-dom'
import './GameSettings.css'

export default function GameSettings() {
  const { gameState, resetGame } = useGame()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const handleResetGame = () => {
    if (confirm('Вы уверены, что хотите сбросить игру и вернуться к настройкам?')) {
      resetGame()
      navigate('/')
      setIsOpen(false)
    }
  }

  const handleBackToConfig = () => {
    if (confirm('Вы уверены, что хотите вернуться к настройкам? Текущий прогресс будет потерян.')) {
      resetGame()
      navigate('/')
      setIsOpen(false)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const element = document.documentElement
      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen()
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen()
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen()
      }
    }
  }

  if (!gameState) {
    return null
  }

  return (
    <div className="game-settings-container">
      <button
        className="icon-button fullscreen-button"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
      >
        {isFullscreen ? '⛶' : '⛶'}
      </button>
      <button
        className="icon-button settings-icon-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Настройки игры"
      >
        ⚙️
      </button>
      {isOpen && (
        <div className="settings-menu" ref={menuRef}>
          <div className="settings-menu-header">
            <h3>Настройки игры</h3>
          </div>
          <div className="settings-menu-content">
            <div className="settings-info">
              <div className="info-item">
                <span className="info-label">Раундов:</span>
                <span className="info-value">{gameState.numberOfRounds}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Команд:</span>
                <span className="info-value">{gameState.teams.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Текущий раунд:</span>
                <span className="info-value">{gameState.currentRound}</span>
              </div>
            </div>
            <div className="settings-actions">
              {gameState?.gameId ? (
                <>
                  <a 
                    href={`/host/${gameState.gameId}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="settings-action-button host-link"
                  >
                    📊 Панель ведущего
                  </a>
                  <div className="host-url-info">
                    <span className="host-url-label">URL для другого устройства:</span>
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/host/${gameState.gameId}`}
                      className="host-url-input"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                </>
              ) : (
                <div className="host-url-info">
                  <span className="host-url-label" style={{ color: '#9CA3AF' }}>
                    URL панели ведущего появится после запуска игры
                  </span>
                </div>
              )}
              <button className="settings-action-button" onClick={handleBackToConfig}>
                Вернуться к настройкам
              </button>
              <button className="settings-action-button danger" onClick={handleResetGame}>
                Сбросить игру
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


