import { memo, useCallback } from 'react'
import type { Song } from '../types/song.types'
import { SongActions } from './ui/SongActions'
import { ModerationBadge } from '@features/moderation'
import { useRoles } from '@features/auth/hooks/useRoles'
import styles from './SongCard.module.css'

interface SongCardProps {
  song: Song
  onClick?: (song: Song) => void
  onDelete?: (songId: string) => void
}

export const SongCard = memo(function SongCard({ song, onClick, onDelete }: SongCardProps) {
  const { isModerator, isAdmin } = useRoles()
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
      {/* Show moderation badge for moderators */}
      {(isModerator || isAdmin) && song.metadata && (
        <div className={styles.moderationBadgeContainer}>
          <ModerationBadge 
            moderationStatus={song.metadata.moderationStatus}
            isPrivate={!song.metadata.isPublic}
          />
        </div>
      )}
      <div className={styles.themesContainer}>
        {song.themes?.map(theme => (
          <span 
            key={theme}
            className={styles.themeTag}
          >
            {theme}
          </span>
        )) || <span style={{ color: 'var(--text-secondary)', fontSize: '0.8em', fontStyle: 'italic' }}>No themes</span>}
      </div>
      <div onClick={e => e.stopPropagation()}>
        <SongActions 
          song={song}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
})