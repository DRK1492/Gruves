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
  onSaveLoop?: (loop: { name: string; loopStart: number; loopEnd: number }) => Promise<void> | void
}

export default function YouTubePracticePlayer({
  title = 'YouTube practice player',
  videoUrl,
  savedLoops = [],
  onDeleteLoop,
  onSaveLoop,
}: YouTubePracticePlayerProps) {
  const videoId = useMemo(() => getYouTubeVideoId(videoUrl), [videoUrl])

  return (
    <YouTubePracticePlayerInner
      key={videoId ?? videoUrl}
      savedLoops={savedLoops}
      onDeleteLoop={onDeleteLoop}
      onSaveLoop={onSaveLoop}
      title={title}
      videoId={videoId}
    />
  )
}

type YouTubePracticePlayerInnerProps = {
  savedLoops: PracticeLoop[]
  onDeleteLoop?: (loopId: string) => Promise<void> | void
  onSaveLoop?: (loop: { name: string; loopStart: number; loopEnd: number }) => Promise<void> | void
  title: string
  videoId: string | null
}

function YouTubePracticePlayerInner({
  savedLoops,
  onDeleteLoop,
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

  useEffect(() => {
    if (player && activeSavedLoopId && savedLoops.length > 0) {
      const activeLoop = savedLoops.find(loop => loop.id === activeSavedLoopId)
      if (activeLoop) {
        loadLoop(activeLoop.loopStart, activeLoop.loopEnd, true)
        player.playVideo()
      }
    }
  }, [player, activeSavedLoopId, savedLoops, loadLoop])

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
    <div>
      <div className="aspect-video overflow-hidden rounded">
        <div
          ref={playerHostRef}
          className="h-full w-full"
          aria-label={title}
        />
      </div>

      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="label">Now</span>
          <span className="mono">{formatYouTubeTime(currentTime)}</span>
          <span className="label">A</span>
          <span className="mono">{formatYouTubeTime(loopStart)}</span>
          <span className="label">B</span>
          <span className="mono">{formatYouTubeTime(loopEnd)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="button-primary"
            onClick={setLoopStartFromCurrentTime}
            disabled={!player}
          >
            Set A
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={setLoopEndFromCurrentTime}
            disabled={!player}
          >
            Set B
          </button>
          <button
            type="button"
            className={isLooping ? 'button-primary' : 'button-ghost'}
            onClick={toggleLooping}
            disabled={!canLoop}
            aria-pressed={isLooping}
          >
            {isLooping ? 'Loop On' : 'Loop Off'}
          </button>
          <label className="label" htmlFor={speedSelectId}>
            Speed
          </label>
          <select
            id={speedSelectId}
            className="input w-auto min-w-[5.5rem]"
            value={playbackRate}
            onChange={event => updatePlaybackRate(Number(event.target.value))}
            disabled={!player}
          >
            {playbackRateOptions.map(rate => (
              <option key={rate} value={rate}>
                {rate}x
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="button-ghost"
            onClick={jumpToLoopStart}
            disabled={loopStart == null}
          >
            Jump A
          </button>
          <button
            type="button"
            className="button-ghost"
            onClick={jumpToLoopEnd}
            disabled={loopEnd == null}
          >
            Jump B
          </button>
          <button
            type="button"
            className="button-ghost"
            onClick={clearLoop}
            disabled={loopStart == null && loopEnd == null}
          >
            Clear Loop
          </button>
        </div>

        {onSaveLoop && (
          <div className="card-strong p-3">
            <p className="label mb-2">Save Practice Loop</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="input min-w-[12rem] flex-1"
                placeholder="Intro riff"
                value={loopName}
                onChange={event => setLoopName(event.target.value)}
              />
              <button
                type="button"
                className="button-primary"
                onClick={handleSaveLoop}
                disabled={!canLoop || isSavingLoop}
              >
                {isSavingLoop ? 'Saving...' : 'Save Loop'}
              </button>
            </div>
            <p className="mt-2 text-xs muted">
              Save the current A/B range so you can reopen it from this mini player later.
            </p>
            {saveError && <p className="mt-2 text-xs text-red-300">{saveError}</p>}
          </div>
        )}

        <div className="card-strong p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="label">Saved Loops</p>
            <p className="text-xs muted">{savedLoops.length} saved</p>
          </div>
          {savedLoops.length === 0 ? (
            <p className="text-xs muted">No saved loops for this video yet.</p>
          ) : (
            <div className="space-y-2">
              {savedLoops.map(loop => (
                <div
                  key={loop.id}
                  className={loop.id === activeSavedLoopId ? 'row row-accent' : 'row'}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{loop.name}</p>
                      <p className="text-xs muted">
                        {formatYouTubeTime(loop.loopStart)} to {formatYouTubeTime(loop.loopEnd)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="button-primary"
                        onClick={() => handleLoadSavedLoop(loop)}
                      >
                        Load
                      </button>
                      {onDeleteLoop && (
                        <button
                          type="button"
                          className="button-ghost button-danger"
                          onClick={() => handleDeleteLoop(loop.id)}
                          disabled={deletingLoopId === loop.id}
                        >
                          {deletingLoopId === loop.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {savedLoopError && <p className="mt-2 text-xs text-red-300">{savedLoopError}</p>}
        </div>

        <p className="text-xs muted">{helperText}</p>
      </div>
    </div>
  )
}
