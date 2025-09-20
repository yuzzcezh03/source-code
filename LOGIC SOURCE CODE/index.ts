// Logic Source Code - Main Entry Point
// Extracted and reorganized launcher logic modules

// Core utilities and types
export * from './CORE/types'
export * from './CORE/math'
export * from './CORE/capabilities'
export * from './CORE/ticker'
export * from './CORE/utils'

// Logic modules
export * from './Basic'
export * from './SpinL'
export * from './Orbit'
export * from './Effect'

// Re-export processors for easy access
export { BasicProcessor } from './Basic'
export { SpinLProcessor } from './SpinL'
export { OrbitProcessor } from './Orbit'
export { EffectProcessor } from './Effect'

// Main orchestrator
import type { Application } from 'pixi.js'
import type { LogicConfig, BuildResult, BuildContext, LogicProcessor } from './CORE/types'
import { BasicProcessor } from './Basic'
import { SpinLProcessor } from './SpinL'
import { OrbitProcessor } from './Orbit'
import { EffectProcessor } from './Effect'
import { createTicker } from './CORE/ticker'
import { sortLayersByZIndex, resolveImageUrl } from './CORE/utils'
import { Assets, Container, Sprite } from 'pixi.js'

/**
 * Main Logic Engine - Orchestrates all processors
 */
export class LogicEngine {
  private processors: LogicProcessor[] = []
  private ticker = createTicker()
  private context: BuildContext | null = null

  constructor() {
    // Initialize processors in order
    this.processors = [
      new BasicProcessor(),
      new SpinLProcessor(),
      new OrbitProcessor(),
      new EffectProcessor()
    ]
  }

  /**
   * Build scene from logic configuration
   */
  async buildScene(app: Application, config: LogicConfig): Promise<BuildResult> {
    const container = new Container()
    container.sortableChildren = true

    // Sort layers by z-index
    const sortedLayers = sortLayersByZIndex(config.layers)

    // Preload all assets
    const urls = new Set<string>()
    for (const layer of sortedLayers) {
      const url = resolveImageUrl(config, layer.imageRef)
      if (url) urls.add(url)
    }

    try {
      await Promise.all(
        Array.from(urls).map(url =>
          Assets.load(url).catch(e => {
            console.warn('[LogicEngine] Preload failed for', url, e)
          })
        )
      )
    } catch {}

    // Build sprites
    const builtLayers = []
    for (const layer of sortedLayers) {
      const url = resolveImageUrl(config, layer.imageRef)
      if (!url) {
        console.warn('[LogicEngine] Missing image URL for layer', layer.id)
        continue
      }

      try {
        const texture = await Assets.load(url)
        const sprite = new Sprite(texture)
        sprite.anchor.set(0.5)
        container.addChild(sprite)
        
        builtLayers.push({
          id: layer.id,
          sprite,
          cfg: layer
        })
      } catch (e) {
        console.error('[LogicEngine] Failed to load', url, 'for layer', layer.id, e)
      }
    }

    // Create build context
    this.context = {
      app,
      container,
      cfg: config,
      layers: builtLayers
    }

    // Initialize all processors
    for (const processor of this.processors) {
      processor.init(this.context)
    }

    // Setup ticker for animations
    this.ticker.add((deltaTime) => {
      if (!this.context) return
      
      for (const processor of this.processors) {
        processor.tick?.(deltaTime, this.context)
      }
    })

    // Setup resize handler
    const handleResize = () => {
      if (!this.context) return
      
      for (const processor of this.processors) {
        processor.onResize?.(this.context)
      }
    }

    window.addEventListener('resize', handleResize)

    // Store cleanup function
    const cleanup = () => {
      this.dispose()
      window.removeEventListener('resize', handleResize)
    }
    ;(container as any)._cleanup = cleanup

    // Start ticker if there are animated layers
    if (this.hasAnimatedLayers(builtLayers)) {
      this.ticker.start()
    }

    return { container, layers: builtLayers }
  }

  /**
   * Check if any layers have animations
   */
  private hasAnimatedLayers(layers: any[]): boolean {
    return layers.some(layer => 
      layer.cfg.spinRPM > 0 ||
      layer.cfg.orbitRPM > 0 ||
      (layer.cfg.effects && layer.cfg.effects.length > 0)
    )
  }

  /**
   * Get processor by type
   */
  getProcessor<T extends LogicProcessor>(ProcessorClass: new () => T): T | null {
    return this.processors.find(p => p instanceof ProcessorClass) as T || null
  }

  /**
   * Dispose the engine and cleanup resources
   */
  dispose(): void {
    this.ticker.stop()
    
    for (const processor of this.processors) {
      processor.dispose?.()
    }
    
    this.processors.length = 0
    this.context = null
  }
}

/**
 * Legacy compatibility - build scene using the new engine
 */
export async function buildSceneFromLogic(app: Application, config: LogicConfig): Promise<BuildResult> {
  const engine = new LogicEngine()
  return await engine.buildScene(app, config)
}

/**
 * Configuration utilities
 */
export const ConfigUtils = {
  /**
   * Create default layer configuration
   */
  createDefaultLayer(id: string, imageId: string): import('./CORE/types').LayerConfig {
    return {
      id,
      imageRef: { kind: 'urlId', id: imageId },
      position: { xPct: 50, yPct: 50 },
      scale: { pct: 100 },
      angleDeg: 0
    }
  },

  /**
   * Create default logic configuration
   */
  createDefaultConfig(): LogicConfig {
    return {
      layersID: [],
      imageRegistry: {},
      layers: []
    }
  },

  /**
   * Validate configuration
   */
  validateConfig(config: LogicConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.layers || !Array.isArray(config.layers)) {
      errors.push('Missing or invalid layers array')
    }

    if (!config.imageRegistry || typeof config.imageRegistry !== 'object') {
      errors.push('Missing or invalid image registry')
    }

    for (const layer of config.layers || []) {
      if (!layer.id) errors.push(`Layer missing ID: ${JSON.stringify(layer)}`)
      if (!layer.imageRef) errors.push(`Layer ${layer.id} missing imageRef`)
      if (!layer.position) errors.push(`Layer ${layer.id} missing position`)
    }

    return { valid: errors.length === 0, errors }
  }
}

/**
 * Performance utilities
 */
export const PerformanceUtils = {
  /**
   * Check if configuration is performance-intensive
   */
  isPerformanceIntensive(config: LogicConfig): boolean {
    let animatedLayers = 0
    let advancedEffects = 0

    for (const layer of config.layers) {
      if (layer.spinRPM && layer.spinRPM > 0) animatedLayers++
      if (layer.orbitRPM && layer.orbitRPM > 0) animatedLayers++
      if (layer.effects) {
        advancedEffects += layer.effects.filter(e => 
          e.type === 'glow' || e.type === 'bloom' || e.type === 'distort' || e.type === 'shockwave'
        ).length
      }
    }

    return animatedLayers > 10 || advancedEffects > 5
  },

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(config: LogicConfig): string[] {
    const recommendations: string[] = []

    if (this.isPerformanceIntensive(config)) {
      recommendations.push('Consider reducing the number of animated layers')
    }

    const totalLayers = config.layers.length
    if (totalLayers > 50) {
      recommendations.push('Large number of layers may impact performance')
    }

    return recommendations
  }
}