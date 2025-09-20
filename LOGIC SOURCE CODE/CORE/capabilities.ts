// Core capability detection utilities

export type RendererMode = 'auto' | 'pixi' | 'dom'

/**
 * Check if WebGL is available in the browser
 */
export function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Get renderer override from URL params or localStorage
 */
function getRendererOverride(): 'pixi' | 'dom' | null {
  try {
    const sp = new URLSearchParams(window.location.search)
    const q = sp.get('renderer')
    if (q === 'pixi' || q === 'dom') return q
  } catch {}
  
  try {
    const ls = localStorage.getItem('renderer')
    if (ls === 'pixi' || ls === 'dom') return ls
  } catch {}
  
  return null
}

/**
 * Detect optimal renderer based on capabilities
 */
export function detectRenderer(mode: RendererMode = 'auto'): 'pixi' | 'dom' {
  if (mode === 'pixi' || mode === 'dom') return mode
  
  const override = getRendererOverride()
  if (override) return override
  
  // Conservative: prefer Pixi if WebGL exists; else DOM
  return isWebGLAvailable() ? 'pixi' : 'dom'
}

/**
 * Check if advanced effects can be used (hardware/performance requirements)
 */
export function canUseAdvancedEffects(): boolean {
  const hasWebGL = isWebGLAvailable()
  
  // Check device memory if available
  // @ts-ignore
  const deviceMemory = (navigator as any).deviceMemory as number | undefined
  const hasEnoughMemory = deviceMemory === undefined || deviceMemory >= 4
  
  // Check CPU cores
  const cores = navigator.hardwareConcurrency || 4
  const hasEnoughCores = cores >= 4
  
  return hasWebGL && hasEnoughMemory && hasEnoughCores
}