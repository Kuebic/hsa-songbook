import { memo, useCallback } from 'react'
import type { Song } from '../types/song.types'
import styles from './SongCard.module.css'

interface SongCardProps {
  song: Song
  onClick?: (song: Song) => void
}

export const SongCard = memo(function SongCard({ song, onClick }: SongCardProps) {
  const handleClick = useCallback(() => {
    onClick?.(song)
  }, [onClick, song])

  const cardClassName = onClick 
    ? `${styles.songCard} ${styles.clickable}`
    : styles.songCard

  return (
    <div 
      className={cardClassName}
      onClick={handleClick}
    >
      <h3 className={styles.title}>
        {song.title}
      </h3>
      <p className={styles.artist}>
        {song.artist} {song.compositionYear && `(${song.compositionYear})`}
      </p>
      <div className={styles.themesContainer}>
        {song.themes.map(theme => (
          <span 
            key={theme}
            className={styles.themeTag}
          >
            {theme}
          </span>
        ))}
      </div>
      {song.metadata.ratings && (
        <div className={styles.ratings}>
          ⭐ {song.metadata.ratings.average.toFixed(1)} ({song.metadata.ratings.count} reviews)
        </div>
      )}
    </div>
  )
})