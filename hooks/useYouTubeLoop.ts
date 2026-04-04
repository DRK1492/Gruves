'use client'

import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
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
  const [loopStart, setLoopStart] = useState<number | null>(null)
  const [loopEnd, setLoopEnd] = useState<number | null>(null)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [availablePlaybackRates, setAvailablePlaybackRates] = useState<number[]>(
    DEFAULT_PLAYBACK_RATES
  )
  const [currentTime, setCurrentTime] = useState(0)

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
      player.seekTo(loopStart, true)
      player.playVideo()
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
    setLoopEnabled(prev => (loopEnd != null && nextLoopStart < loopEnd ? prev : false))
  }

  const setLoopEndFromCurrentTime = () => {
    const nextLoopEnd = getSafeCurrentTime(player)
    setLoopEnd(nextLoopEnd)
    setCurrentTime(nextLoopEnd)
    setLoopEnabled(prev => (loopStart != null && loopStart < nextLoopEnd ? prev : false))
  }

  const toggleLooping = () => {
    setLoopEnabled(prev => {
      if (prev) return false
      return canLoop
    })
  }

  const jumpToTime = (seconds: number | null) => {
    if (!player || seconds == null) return
    player.seekTo(seconds, true)
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

  const loadLoop = (nextLoopStart: number, nextLoopEnd: number, autoEnable = false) => {
    setLoopStart(nextLoopStart)
    setLoopEnd(nextLoopEnd)
    setLoopEnabled(autoEnable && nextLoopStart < nextLoopEnd)
    jumpToTime(nextLoopStart)
  }

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
