export const YOUTUBE_IFRAME_API_SRC = 'https://www.youtube.com/iframe_api'

export const YOUTUBE_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

export type YouTubePlayer = {
  destroy: () => void
  getAvailablePlaybackRates: () => number[]
  getCurrentTime: () => number
  getPlaybackRate: () => number
  getPlayerState: () => number
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setPlaybackRate: (rate: number) => void
}

export type YouTubePlayerEvent = {
  data?: number
  target: YouTubePlayer
}

type YouTubePlayerConstructor = new (
  target: HTMLElement | string,
  options: {
    height?: string
    width?: string
    videoId: string
    playerVars?: Record<string, number | string>
    events?: {
      onReady?: (event: YouTubePlayerEvent) => void
      onStateChange?: (event: YouTubePlayerEvent) => void
      onError?: (event: YouTubePlayerEvent) => void
    }
  }
) => YouTubePlayer

type YouTubeApi = {
  Player: YouTubePlayerConstructor
  PlayerState: typeof YOUTUBE_PLAYER_STATE
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeIframeApiPromise: Promise<YouTubeApi> | null = null

export const getYouTubeVideoId = (url: string) => {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0]
      return videoId || null
    }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v')
      }

      const segments = parsed.pathname.split('/').filter(Boolean)
      if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live') {
        return segments[1] || null
      }
    }
  } catch {
    return null
  }

  return null
}

export const getYouTubeEmbedUrl = (url: string) => {
  const videoId = getYouTubeVideoId(url)
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

export const formatYouTubeTime = (seconds: number | null) => {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) {
    return '--:--'
  }

  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export const loadYouTubeIframeApi = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube IFrame API can only be loaded in the browser.'))
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (youtubeIframeApiPromise) {
    return youtubeIframeApiPromise
  }

  youtubeIframeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${YOUTUBE_IFRAME_API_SRC}"]`
    )
    const previousReadyHandler = window.onYouTubeIframeAPIReady

    const handleReady = () => {
      if (!window.YT?.Player) {
        reject(new Error('YouTube IFrame API loaded without a Player constructor.'))
        return
      }
      resolve(window.YT)
    }

    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.()
      handleReady()
    }

    if (existingScript) {
      return
    }

    const script = document.createElement('script')
    script.src = YOUTUBE_IFRAME_API_SRC
    script.async = true
    script.onerror = () => {
      youtubeIframeApiPromise = null
      reject(new Error('Failed to load the YouTube IFrame API script.'))
    }
    document.head.appendChild(script)
  })

  return youtubeIframeApiPromise
}
