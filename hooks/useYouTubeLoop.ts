'use client'

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { YOUTUBE_PLAYER_STATE, type YouTubePlayer } from '@/utils/youtubeHelpers'

const DEFAULT_INTERVAL_MS = 200
const DEFAULT_PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5]

type UseYouTubeLoopOptions = {
  player: YouTubePlayer | null
  playerState: number | null
  intervalMs?: number
}

const getSafeCurrentTime = (player: YouTubePlayer | null) => {
  if (!player) return 0

  try {
    return player.getCurrentTime()
  } catch {
    return 0
  }
}

const getSafePlaybackRate = (player: YouTubePlayer | null) => {
  if (!player) return 1

  try {
    return player.getPlaybackRate()
  } catch {
    return 1
  }
}

const getSafePlaybackRates = (player: YouTubePlayer | null) => {
  if (!player) return DEFAULT_PLAYBACK_RATES

  try {
    const rates = player.getAvailablePlaybackRates()
    return rates.length > 0 ? rates : DEFAULT_PLAYBACK_RATES
  } catch {
    return DEFAULT_PLAYBACK_RATES
  }
}

export function useYouTubeLoop({
  player,
  playerState,
  intervalMs = DEFAULT_INTERVAL_MS,
}: UseYouTubeLoopOptions) {
  const playerRef = useRef<YouTubePlayer | null>(null)

  const [loopStart, setLoopStart] = useState<number | null>(null)
  const [loopEnd, setLoopEnd] = useState<number | null>(null)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [availablePlaybackRates, setAvailablePlaybackRates] = useState<number[]>(
    DEFAULT_PLAYBACK_RATES
  )
  const [currentTime, setCurrentTime] = useState(0)

  // Keep a ref so that stable callbacks (useCallback with []) always see the latest player
  useEffect(() => {
    playerRef.current = player
  }, [player])

  const canLoop = loopStart != null && loopEnd != null && loopStart < loopEnd
  const isLooping = loopEnabled && canLoop
  const isPlaying = playerState === YOUTUBE_PLAYER_STATE.PLAYING

  const syncCurrentTime = useEffectEvent(() => {
    setCurrentTime(getSafeCurrentTime(player))
  })

  useEffect(() => {
    if (!player || !isPlaying) return

    syncCurrentTime()
    const intervalId = window.setInterval(() => {
      syncCurrentTime()
    }, intervalMs)

    return () => window.clearInterval(intervalId)
  }, [player, isPlaying, intervalMs])

  const watchLoopBounds = useEffectEvent(() => {
    if (!player || !isLooping || loopStart == null || loopEnd == null) return

    const nextCurrentTime = getSafeCurrentTime(player)
    setCurrentTime(nextCurrentTime)

    // The A/B loop is enforced with a tight polling interval so the section
    // restarts reliably without depending on static iframe URL parameters.
    if (nextCurrentTime >= loopEnd) {
      // Only resume if the player was already playing — don't override a manual pause.
      const wasPlaying = player.getPlayerState() === YOUTUBE_PLAYER_STATE.PLAYING
      player.seekTo(loopStart, true)
      if (wasPlaying) player.playVideo()
      setCurrentTime(loopStart)
    }
  })

  useEffect(() => {
    if (!player || !isLooping || !canLoop) return

    const intervalId = window.setInterval(() => {
      watchLoopBounds()
    }, intervalMs)

    return () => window.clearInterval(intervalId)
  }, [player, isLooping, canLoop, intervalMs])

  const setLoopStartFromCurrentTime = () => {
    const nextLoopStart = getSafeCurrentTime(player)
    setLoopStart(nextLoopStart)
    setCurrentTime(nextLoopStart)
    // Auto-enable when both markers are set and valid
    setLoopEnabled(loopEnd != null && nextLoopStart < loopEnd)
  }

  const setLoopEndFromCurrentTime = () => {
    const nextLoopEnd = getSafeCurrentTime(player)
    setLoopEnd(nextLoopEnd)
    setCurrentTime(nextLoopEnd)
    // Auto-enable as soon as a valid closed loop exists
    setLoopEnabled(loopStart != null && loopStart < nextLoopEnd)
  }

  const toggleLooping = () => {
    setLoopEnabled(prev => {
      if (prev) return false
      return canLoop
    })
  }

  const jumpToTime = (seconds: number | null) => {
    const p = playerRef.current
    if (!p || seconds == null) return
    p.seekTo(seconds, true)
    setCurrentTime(seconds)
  }

  const jumpToLoopStart = () => {
    jumpToTime(loopStart)
  }

  const jumpToLoopEnd = () => {
    jumpToTime(loopEnd)
  }

  const clearLoop = () => {
    setLoopStart(null)
    setLoopEnd(null)
    setLoopEnabled(false)
  }

  const loadLoop = useCallback((nextLoopStart: number, nextLoopEnd: number, autoEnable = false) => {
    setLoopStart(nextLoopStart)
    setLoopEnd(nextLoopEnd)
    setLoopEnabled(autoEnable && nextLoopStart < nextLoopEnd)
    jumpToTime(nextLoopStart)
  }, [])

  const syncPlayerMetadata = useCallback((nextPlayer: YouTubePlayer | null) => {
    setAvailablePlaybackRates(getSafePlaybackRates(nextPlayer))
    setPlaybackRate(getSafePlaybackRate(nextPlayer))
    setCurrentTime(getSafeCurrentTime(nextPlayer))
  }, [])

  const updatePlaybackRate = (rate: number) => {
    if (!player) return

    const nextPlaybackRates = getSafePlaybackRates(player)
    setAvailablePlaybackRates(nextPlaybackRates)
    if (!nextPlaybackRates.includes(rate)) return

    player.setPlaybackRate(rate)
    setPlaybackRate(rate)
  }

  const playbackRateOptions = useMemo(() => {
    const filteredRates = DEFAULT_PLAYBACK_RATES.filter(rate => availablePlaybackRates.includes(rate))
    return filteredRates.length > 0 ? filteredRates : DEFAULT_PLAYBACK_RATES
  }, [availablePlaybackRates])

  return {
    availablePlaybackRates,
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
  }
}
