// Core utility functions

import type { LayerConfig, LogicConfig, ImageRef } from './types'

/**
 * Extract z-index from layer ID (numeric suffix)
 */
export function extractZIndex(layerId: string): number {
  const match = layerId.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

/**
 * Get URL for image reference from registry
 */
export function resolveImageUrl(cfg: LogicConfig, ref: ImageRef): string | null {
  if (ref.kind === 'url') return ref.url
  
  const url = cfg.imageRegistry[ref.id]
  return url ?? null
}

/**
 * Sort layers by z-index then by ID
 */
export function sortLayersByZIndex(layers: LayerConfig[]): LayerConfig[] {
  return [...layers].sort((a, b) => {
    const za = extractZIndex(a.id)
    const zb = extractZIndex(b.id)
    if (za !== zb) return za - zb
    return a.id.localeCompare(b.id)
  })
}

/**
 * Safe property access with default value
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const keys = path.split('.')
    let current = obj
    for (const key of keys) {
      if (current == null || typeof current !== 'object') return defaultValue
      current = current[key]
    }
    return current != null ? current : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Deep clone an object (simple implementation)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T
  
  const cloned = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = undefined
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = window.setTimeout(later, wait)
  }
}

/**
 * Check if a value is numeric
 */
export function isNumeric(value: any): value is number {
  return typeof value === 'number' && isFinite(value)
}

/**
 * Convert percentage to stage coordinates
 */
export function percentToStageCoords(xPct: number, yPct: number, stageWidth: number, stageHeight: number): { x: number; y: number } {
  return {
    x: (xPct / 100) * stageWidth,
    y: (yPct / 100) * stageHeight
  }
}