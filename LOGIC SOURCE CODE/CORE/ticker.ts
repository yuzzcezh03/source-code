// Core animation ticker using RequestAnimationFrame

export type TickerCallback = (deltaTime: number) => void

export interface Ticker {
  add(callback: TickerCallback): void
  remove(callback: TickerCallback): void
  start(): void
  stop(): void
  dispose(): void
  isRunning(): boolean
}

/**
 * Create a RAF-based ticker for animations
 */
export function createTicker(): Ticker {
  const callbacks = new Set<TickerCallback>()
  let isRunning = false
  let rafId = 0
  let lastTime = 0

  const tick = (currentTime: number) => {
    rafId = requestAnimationFrame(tick)
    
    const deltaTime = lastTime ? (currentTime - lastTime) / 1000 : 0
    lastTime = currentTime
    
    // Execute all callbacks
    for (const callback of callbacks) {
      try {
        callback(deltaTime || 0)
      } catch (error) {
        console.error('Ticker callback error:', error)
      }
    }
  }

  return {
    add(callback: TickerCallback) {
      callbacks.add(callback)
    },

    remove(callback: TickerCallback) {
      callbacks.delete(callback)
    },

    start() {
      if (isRunning) return
      isRunning = true
      lastTime = 0
      rafId = requestAnimationFrame(tick)
    },

    stop() {
      if (!isRunning) return
      isRunning = false
      cancelAnimationFrame(rafId)
      rafId = 0
    },

    dispose() {
      this.stop()
      callbacks.clear()
    },

    isRunning() {
      return isRunning
    }
  }
}