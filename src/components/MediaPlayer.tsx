import { useState, useRef } from 'react'
import './MediaPlayer.css'

interface MediaPlayerProps {
  src: string
  type: 'video' | 'audio'
}

export default function MediaPlayer({ src, type }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null)

  const handleMediaClick = () => {
    const media = mediaRef.current
    if (!media) return

    if (isPlaying) {
      media.pause()
      setIsPlaying(false)
    } else {
      media.play()
      setIsPlaying(true)
    }
  }

  const handleMediaEnded = () => {
    setIsPlaying(false)
  }

  const handleMediaPlay = () => {
    setIsPlaying(true)
  }

  const handleMediaPause = () => {
    setIsPlaying(false)
  }

  if (type === 'video') {
    return (
      <div className="media-player-wrapper" onClick={handleMediaClick}>
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          className={`media-player video-player ${isPlaying ? 'playing' : 'paused'}`}
          onEnded={handleMediaEnded}
          onPlay={handleMediaPlay}
          onPause={handleMediaPause}
        />
        {!isPlaying && (
          <div className="media-play-overlay">
            <div className="media-play-icon">▶</div>
            <div className="media-play-text">Нажмите для воспроизведения</div>
          </div>
        )}
      </div>
    )
  }

  if (type === 'audio') {
    return (
      <div className="media-player-wrapper audio-wrapper" onClick={handleMediaClick}>
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={src}
          className="media-player audio-player"
          onEnded={handleMediaEnded}
          onPlay={handleMediaPlay}
          onPause={handleMediaPause}
        />
        <div className={`audio-controls ${isPlaying ? 'playing' : 'paused'}`}>
          <div className="audio-icon">{isPlaying ? '⏸' : '▶'}</div>
          <div className="audio-text">{isPlaying ? 'Нажмите для паузы' : 'Нажмите для воспроизведения'}</div>
        </div>
      </div>
    )
  }

  return null
}
