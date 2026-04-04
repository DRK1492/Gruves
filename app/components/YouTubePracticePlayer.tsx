'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useYouTubeLoop } from '@/hooks/useYouTubeLoop'
import {
  formatYouTubeTime,
  getYouTubeVideoId,
  loadYouTubeIframeApi,
  type YouTubePlayer,
} from '@/utils/youtubeHelpers'

export type PracticeLoop = {
  id: string
  name: string
  loopStart: number
  loopEnd: number
}

type YouTubePracticePlayerProps = {
  title?: string
  videoUrl: string
  savedLoops?: PracticeLoop[]
  onDeleteLoop?: (loopId: string) => Promise<void> | void
  onRenameLoop?: (loopId: string, name: string) => Promise<void> | void
  onSaveLoop?: (loop: { name: string; loopStart: number; loopEnd: number }) => Promise<void> | void
}

export default function YouTubePracticePlayer({
  title = 'YouTube practice player',
  videoUrl,
  savedLoops = [],
  onDeleteLoop,
  onRenameLoop,
  onSaveLoop,
}: YouTubePracticePlayerProps) {
  const videoId = useMemo(() => getYouTubeVideoId(videoUrl), [videoUrl])

  return (
    <YouTubePracticePlayerInner
      key={videoId ?? videoUrl}
      savedLoops={savedLoops}
      onDeleteLoop={onDeleteLoop}
      onRenameLoop={onRenameLoop}
      onSaveLoop={onSaveLoop}
      title={title}
      videoId={videoId}
    />
  )
}

type YouTubePracticePlayerInnerProps = {
  savedLoops: PracticeLoop[]
  onDeleteLoop?: (loopId: string) => Promise<void> | void
  onRenameLoop?: (loopId: string, name: string) => Promise<void> | void
  onSaveLoop?: (loop: { name: string; loopStart: number; loopEnd: number }) => Promise<void> | void
  title: string
  videoId: string | null
}

function YouTubePracticePlayerInner({
  savedLoops,
  onDeleteLoop,
  onRenameLoop,
  onSaveLoop,
  title,
  videoId,
}: YouTubePracticePlayerInnerProps) {
  const playerHostRef = useRef<HTMLDivElement | null>(null)
  const playerInstanceRef = useRef<YouTubePlayer | null>(null)
  const speedSelectId = useId()

  const [player, setPlayer] = useState<YouTubePlayer | null>(null)
  const [playerState, setPlayerState] = useState<number | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loopName, setLoopName] = useState('')
  const [saveError, setSaveError] = useState('')
  const [savedLoopError, setSavedLoopError] = useState('')
  const [isSavingLoop, setIsSavingLoop] = useState(false)
  const [deletingLoopId, setDeletingLoopId] = useState<string | null>(null)
  const [activeSavedLoopId, setActiveSavedLoopId] = useState<string | null>(savedLoops[0]?.id ?? null)
  const [editingLoopId, setEditingLoopId] = useState<string | null>(null)
  const [editingLoopName, setEditingLoopName] = useState('')
  const [renameError, setRenameError] = useState('')

  const {
    canLoop,
    clearLoop,
    currentTime,
    isLooping,
    jumpToLoopEnd,
    jumpToLoopStart,
    loadLoop,
    loopEnd,
    loopStart,
    playbackRate,
    playbackRateOptions,
    setLoopEndFromCurrentTime,
    setLoopStartFromCurrentTime,
    syncPlayerMetadata,
    toggleLooping,
    updatePlaybackRate,
  } = useYouTubeLoop({
    player,
    playerState,
  })

  useEffect(() => {
    setActiveSavedLoopId(current => {
      if (current && savedLoops.some(loop => loop.id === current)) return current
      return savedLoops[0]?.id ?? null
    })
  }, [savedLoops])

  // Keep a ref so the auto-load effect can read the latest loops without re-firing
  // when the savedLoops array reference changes on a parent re-render.
  const savedLoopsRef = useRef(savedLoops)
  useEffect(() => { savedLoopsRef.current = savedLoops }, [savedLoops])

  useEffect(() => {
    if (!player || !activeSavedLoopId) return
    const activeLoop = savedLoopsRef.current.find(loop => loop.id === activeSavedLoopId)
    if (activeLoop) {
      loadLoop(activeLoop.loopStart, activeLoop.loopEnd, true)
      player.playVideo()
    }
  }, [player, activeSavedLoopId, loadLoop])

  useEffect(() => {
    if (!videoId || !playerHostRef.current) return

    let isCancelled = false
    const hostElement = playerHostRef.current
    hostElement.innerHTML = ''

    loadYouTubeIframeApi()
      .then(YT => {
        if (isCancelled) return

        playerInstanceRef.current = new YT.Player(hostElement, {
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: event => {
              if (isCancelled) return
              setPlayer(event.target)
              syncPlayerMetadata(event.target)
              setLoadError('')
            },
            onStateChange: event => {
              if (isCancelled) return
              setPlayer(event.target)
              setPlayerState(event.data ?? null)
              syncPlayerMetadata(event.target)
            },
            onError: () => {
              if (isCancelled) return
              setLoadError('Could not load this YouTube video.')
            },
          },
        })
      })
      .catch(() => {
        if (isCancelled) return
        setLoadError('Could not load the YouTube player.')
      })

    return () => {
      isCancelled = true

      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy()
        playerInstanceRef.current = null
      }

      hostElement.innerHTML = ''
    }
  }, [syncPlayerMetadata, videoId])

  const playerError = !videoId ? 'Unsupported YouTube link.' : loadError

  const helperText = useMemo(() => {
    if (loopStart != null && loopEnd != null && !canLoop) {
      return 'Loop start must be earlier than loop end.'
    }

    if (!canLoop) {
      return 'Set A and B to enable looping.'
    }

    return isLooping ? 'Looping between A and B.' : 'Loop is ready.'
  }, [canLoop, isLooping, loopEnd, loopStart])

  const handleSaveLoop = async () => {
    if (!onSaveLoop || !canLoop || loopStart == null || loopEnd == null) return

    const nextLoopName = loopName.trim()
    if (!nextLoopName) {
      setSaveError('Name this loop before saving it.')
      return
    }

    setIsSavingLoop(true)
    setSaveError('')
    setSavedLoopError('')

    try {
      await onSaveLoop({
        name: nextLoopName,
        loopStart,
        loopEnd,
      })
      setLoopName('')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this loop.')
    } finally {
      setIsSavingLoop(false)
    }
  }

  const handleDeleteLoop = async (loopId: string) => {
    if (!onDeleteLoop) return

    setDeletingLoopId(loopId)
    try {
      await onDeleteLoop(loopId)
      setActiveSavedLoopId(current => (current === loopId ? null : current))
      setSavedLoopError('')
    } catch (error) {
      setSavedLoopError(error instanceof Error ? error.message : 'Could not delete this loop.')
    } finally {
      setDeletingLoopId(current => (current === loopId ? null : current))
    }
  }

  const handleCommitRename = async () => {
    if (!editingLoopId || !onRenameLoop) { setEditingLoopId(null); return }
    const trimmed = editingLoopName.trim()
    if (!trimmed) { setEditingLoopId(null); return }
    try {
      await onRenameLoop(editingLoopId, trimmed)
      setRenameError('')
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : 'Could not rename loop.')
    } finally {
      setEditingLoopId(null)
    }
  }

  const handleLoadSavedLoop = (loop: PracticeLoop) => {
    loadLoop(loop.loopStart, loop.loopEnd, true)
    setActiveSavedLoopId(loop.id)
    setSaveError('')
    setSavedLoopError('')
  }

  if (playerError) {
    return (
      <div className="card-strong flex min-h-[12rem] items-center justify-center rounded p-4 text-center">
        <p className="text-sm muted">{playerError}</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div className="aspect-video rounded">
        <div
          ref={playerHostRef}
          className="h-full w-full"
          aria-label={title}
        />
      </div>

      <div className="player-controls">
        {/* Row 1: A marker · B marker · Now · Speed */}
        <div className="player-controls-row">
          <div className="player-ab-group">
            <span className="player-marker-label">A</span>
            <button
              type="button"
              className="player-time-chip"
              onClick={jumpToLoopStart}
              disabled={loopStart == null}
              title={loopStart != null ? 'Jump to A' : undefined}
            >
              {formatYouTubeTime(loopStart)}
            </button>
            <button
              type="button"
              className="player-set-btn"
              onClick={setLoopStartFromCurrentTime}
              disabled={!player}
              title="Set A to current time"
            >
              Set
            </button>
          </div>

          <span className="player-ab-arrow" aria-hidden="true">→</span>

          <div className="player-ab-group">
            <span className="player-marker-label">B</span>
            <button
              type="button"
              className="player-time-chip"
              onClick={jumpToLoopEnd}
              disabled={loopEnd == null}
              title={loopEnd != null ? 'Jump to B' : undefined}
            >
              {formatYouTubeTime(loopEnd)}
            </button>
            <button
              type="button"
              className="player-set-btn"
              onClick={setLoopEndFromCurrentTime}
              disabled={!player}
              title="Set B to current time"
            >
              Set
            </button>
          </div>

          <div className="player-controls-spacer" />

          {/* Current time display */}
          <div className="player-now-display" title="Current position">
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="6" cy="6" r="4.5" />
              <path d="M6 3.5V6l1.8 1.8" />
            </svg>
            {formatYouTubeTime(currentTime)}
          </div>

          {/* Speed selector */}
          <div className="player-speed-wrap">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className="player-speed-icon">
              <path d="M8 3a5 5 0 1 0 4.546 2.914" />
              <path d="M8 8l2.5-3" />
              <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
            </svg>
            <select
              id={speedSelectId}
              className="player-speed-select"
              value={playbackRate}
              onChange={event => updatePlaybackRate(Number(event.target.value))}
              disabled={!player}
              title="Playback speed"
            >
              {playbackRateOptions.map(rate => (
                <option key={rate} value={rate}>{rate}×</option>
              ))}
            </select>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true" className="player-speed-chevron">
              <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
        </div>

        {/* Row 2: Loop toggle · Clear · hint */}
        <div className="player-controls-row">
          <button
            type="button"
            className={`player-loop-btn${isLooping ? ' player-loop-btn-active' : ''}`}
            onClick={toggleLooping}
            disabled={!canLoop}
            aria-pressed={isLooping}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            {isLooping ? 'Looping' : 'Loop'}
          </button>

          <button
            type="button"
            className="player-clear-btn"
            onClick={clearLoop}
            disabled={loopStart == null && loopEnd == null}
          >
            × Clear
          </button>

          {loopStart != null && loopEnd != null && !canLoop && (
            <span className="player-hint">A must be before B</span>
          )}
        </div>

        {/* Saved loops chips + inline save */}
        {(savedLoops.length > 0 || onSaveLoop) && (
          <div className="player-loops-row">
            {savedLoops.map(loop => (
              <div
                key={loop.id}
                className={`player-loop-chip${loop.id === activeSavedLoopId ? ' player-loop-chip-active' : ''}`}
              >
                {editingLoopId === loop.id ? (
                  <>
                    <input
                      className="player-loop-chip-edit-input"
                      value={editingLoopName}
                      onChange={e => { setEditingLoopName(e.target.value); setRenameError('') }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); handleCommitRename() }
                        if (e.key === 'Escape') { setEditingLoopId(null) }
                      }}
                      onBlur={handleCommitRename}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      className="player-loop-chip-delete"
                      onMouseDown={e => { e.preventDefault(); setEditingLoopId(null) }}
                      title="Cancel rename"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="player-loop-chip-btn"
                      onClick={() => handleLoadSavedLoop(loop)}
                      title={`${formatYouTubeTime(loop.loopStart)} → ${formatYouTubeTime(loop.loopEnd)}`}
                    >
                      {loop.id === activeSavedLoopId && (
                        <span className="player-loop-chip-dot" aria-hidden="true" />
                      )}
                      {loop.name}
                    </button>
                    {onRenameLoop && (
                      <button
                        type="button"
                        className="player-loop-chip-rename"
                        onClick={e => { e.stopPropagation(); setEditingLoopId(loop.id); setEditingLoopName(loop.name) }}
                        title="Rename loop"
                      >
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
                          <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61z" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                    {onDeleteLoop && (
                      <button
                        type="button"
                        className="player-loop-chip-delete"
                        onClick={() => handleDeleteLoop(loop.id)}
                        disabled={deletingLoopId === loop.id}
                        title="Delete loop"
                      >
                        ×
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}

            {onSaveLoop && canLoop && (
              <div className="player-save-inline">
                <input
                  className="player-save-input"
                  placeholder="Name this loop…"
                  value={loopName}
                  onChange={event => { setLoopName(event.target.value); if (saveError) setSaveError('') }}
                  onKeyDown={event => { if (event.key === 'Enter') handleSaveLoop() }}
                />
                <button
                  type="button"
                  className="player-save-btn"
                  onClick={handleSaveLoop}
                  disabled={isSavingLoop}
                >
                  {isSavingLoop ? '…' : '+ Save'}
                </button>
              </div>
            )}

            {(savedLoopError || saveError || renameError) && (
              <p className="player-error">{savedLoopError || saveError || renameError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
