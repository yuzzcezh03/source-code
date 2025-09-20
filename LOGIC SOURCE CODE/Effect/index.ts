// Effect Logic Module
// Handles all visual effects including fade, pulse, tilt, glow, bloom, distort, shockwave

import type { Application, Sprite } from 'pixi.js'
import type { LayerConfig, BuiltLayer, LogicProcessor, BuildContext, EffectConfig } from '../CORE/types'
import { canUseAdvancedEffects } from '../CORE/capabilities'

// Basic Effect Types
export type FadeSpec = { 
  type: 'fade'
  from: number
  to: number
  durationMs: number
  loop: boolean
  easing: 'linear' | 'sineInOut'
}

export type PulseSpec = { 
  type: 'pulse'
  property: 'scale' | 'alpha'
  amp: number
  periodMs: number
  phaseDeg: number
}

export type TiltSpec = { 
  type: 'tilt'
  mode: 'pointer' | 'device' | 'time'
  axis: 'both' | 'x' | 'y'
  maxDeg: number
  periodMs?: number
}

// Advanced Effect Types
export type GlowSpec = {
  type: 'glow'
  color: number
  alpha: number
  scale: number
  pulseMs?: number
}

export type BloomSpec = {
  type: 'bloom'
  strength: number
  threshold?: number
}

export type DistortSpec = {
  type: 'distort'
  ampPx: number
  speed: number
}

export type ShockwaveSpec = {
  type: 'shockwave'
  periodMs: number
  maxScale: number
  fade: boolean
}

export type EffectSpec = FadeSpec | PulseSpec | TiltSpec | GlowSpec | BloomSpec | DistortSpec | ShockwaveSpec

export type BasicEffectItem = {
  spriteIdx: number
  specs: (FadeSpec | PulseSpec | TiltSpec)[]
  baseAlpha: number
  baseScale: number
  prevTiltRad?: number
}

export type AdvancedEffectItem = {
  spriteIdx: number
  auras: AuraSprite[]
  distort?: DistortSettings
  shock?: ShockSettings
}

export type AuraSprite = {
  sprite: Sprite
  baseScale: number
  strength: number
  pulseMs?: number
  color?: number
  alpha: number
}

export type DistortSettings = {
  ampPx: number
  speed: number
  baseX: number
  baseY: number
}

export type ShockSettings = {
  period: number
  maxScale: number
  fade: boolean
  baseScale: number
}

/**
 * Normalize effect configurations
 */
export const EffectNormalizers = {
  fade(e: any): FadeSpec {
    return {
      type: 'fade',
      from: typeof e.from === 'number' ? e.from : 1,
      to: typeof e.to === 'number' ? e.to : 1,
      durationMs: typeof e.durationMs === 'number' && e.durationMs > 0 ? e.durationMs : 1000,
      loop: e.loop !== false,
      easing: e.easing === 'sineInOut' ? 'sineInOut' : 'linear'
    }
  },

  pulse(e: any): PulseSpec {
    return {
      type: 'pulse',
      property: e.property === 'alpha' ? 'alpha' : 'scale',
      amp: typeof e.amp === 'number' ? e.amp : (e.property === 'alpha' ? 0.1 : 0.05),
      periodMs: typeof e.periodMs === 'number' && e.periodMs > 0 ? e.periodMs : 1000,
      phaseDeg: typeof e.phaseDeg === 'number' ? e.phaseDeg : 0
    }
  },

  tilt(e: any): TiltSpec {
    const mode: TiltSpec['mode'] = (e.mode === 'device' || e.mode === 'time') ? e.mode : 'pointer'
    const axis: TiltSpec['axis'] = (e.axis === 'x' || e.axis === 'y') ? e.axis : 'both'
    const maxDeg = typeof e.maxDeg === 'number' ? e.maxDeg : 8
    const periodMs = typeof e.periodMs === 'number' && e.periodMs > 0 ? e.periodMs : 4000
    return { type: 'tilt', mode, axis, maxDeg, periodMs }
  },

  glow(e: any): GlowSpec {
    return {
      type: 'glow',
      color: typeof e.color === 'number' ? e.color : 0xffff00,
      alpha: typeof e.alpha === 'number' ? e.alpha : 0.4,
      scale: typeof e.scale === 'number' ? e.scale : 0.15,
      pulseMs: typeof e.pulseMs === 'number' ? e.pulseMs : undefined
    }
  },

  bloom(e: any): BloomSpec {
    return {
      type: 'bloom',
      strength: typeof e.strength === 'number' ? e.strength : 0.6,
      threshold: typeof e.threshold === 'number' ? e.threshold : 0.5
    }
  },

  distort(e: any): DistortSpec {
    return {
      type: 'distort',
      ampPx: typeof e.ampPx === 'number' ? e.ampPx : 2,
      speed: typeof e.speed === 'number' ? e.speed : 0.5
    }
  },

  shockwave(e: any): ShockwaveSpec {
    return {
      type: 'shockwave',
      periodMs: typeof e.periodMs === 'number' ? e.periodMs : 1200,
      maxScale: typeof e.maxScale === 'number' ? e.maxScale : 1.3,
      fade: e.fade !== false
    }
  }
}

/**
 * Parse effects from layer configuration
 */
function parseEffects(cfg: LayerConfig): EffectSpec[] {
  const list = cfg.effects
  if (!Array.isArray(list) || list.length === 0) return []
  
  const out: EffectSpec[] = []
  for (const e of list) {
    if (!e || typeof e !== 'object') continue
    
    const type = (e as any).type
    switch (type) {
      case 'fade': out.push(EffectNormalizers.fade(e)); break
      case 'pulse': out.push(EffectNormalizers.pulse(e)); break
      case 'tilt': out.push(EffectNormalizers.tilt(e)); break
      case 'glow': out.push(EffectNormalizers.glow(e)); break
      case 'bloom': out.push(EffectNormalizers.bloom(e)); break
      case 'distort': out.push(EffectNormalizers.distort(e)); break
      case 'shockwave': out.push(EffectNormalizers.shockwave(e)); break
    }
  }
  return out
}

/**
 * Build basic effects system
 */
function buildBasicEffects(app: Application, layers: BuiltLayer[]) {
  const items: BasicEffectItem[] = []
  
  // Pointer state tracking for tilt effects
  let pointerX = 0.5
  let pointerY = 0.5
  
  const handleMouse = (ev: MouseEvent) => {
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    pointerX = Math.max(0, Math.min(1, ev.clientX / w))
    pointerY = Math.max(0, Math.min(1, ev.clientY / h))
  }
  
  const handleTouch = (ev: TouchEvent) => {
    const touch = ev.touches && ev.touches[0]
    if (!touch) return
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    pointerX = Math.max(0, Math.min(1, touch.clientX / w))
    pointerY = Math.max(0, Math.min(1, touch.clientY / h))
  }
  
  try {
    window.addEventListener('mousemove', handleMouse, { passive: true })
    window.addEventListener('touchmove', handleTouch, { passive: true })
  } catch {}
  
  // Process layers for basic effects
  layers.forEach((layer, idx) => {
    const effects = parseEffects(layer.cfg)
    const basicEffects = effects.filter(e => e.type === 'fade' || e.type === 'pulse' || e.type === 'tilt') as (FadeSpec | PulseSpec | TiltSpec)[]
    
    if (basicEffects.length === 0) return
    
    const baseScale = (layer.cfg.scale?.pct ?? 100) / 100
    const baseAlpha = 1
    
    items.push({
      spriteIdx: idx,
      specs: basicEffects,
      baseAlpha,
      baseScale
    })
  })
  
  // Easing functions
  const easeLinear = (t: number) => t
  const easeSineInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * 2 * t)
  
  const tick = (elapsed: number, layersRef: BuiltLayer[]) => {
    for (const item of items) {
      const layer = layersRef[item.spriteIdx]
      if (!layer) continue
      
      let alpha = item.baseAlpha
      let scaleMul = 1
      let tiltRad = 0
      
      for (const effect of item.specs) {
        if (effect.type === 'fade') {
          const T = effect.durationMs / 1000
          if (T <= 0) continue
          
          let phase = (elapsed % T) / T
          if (effect.loop) {
            // Ping-pong animation
            if (phase > 0.5) phase = 1 - (phase - 0.5) * 2
            else phase = phase * 2
          }
          
          const t = effect.easing === 'sineInOut' ? easeSineInOut(phase) : easeLinear(phase)
          alpha = effect.from + (effect.to - effect.from) * t
          
        } else if (effect.type === 'pulse') {
          const T = effect.periodMs / 1000
          if (T <= 0) continue
          
          const omega = (2 * Math.PI) / T
          const phase = (effect.phaseDeg || 0) * Math.PI / 180
          const s = 1 + effect.amp * Math.sin(omega * elapsed + phase)
          
          if (effect.property === 'scale') scaleMul *= s
          else alpha *= Math.max(0, Math.min(1, s))
          
        } else if (effect.type === 'tilt') {
          const axisCount = effect.axis === 'both' ? 2 : 1
          
          if (effect.mode === 'time') {
            const T = (effect.periodMs ?? 4000) / 1000
            if (T > 0) {
              const s = Math.sin((2 * Math.PI / T) * elapsed)
              const deg = effect.maxDeg * s
              tiltRad += (deg * Math.PI) / 180
            }
          } else {
            // Pointer-based tilt
            const dx = (pointerX - 0.5) * 2
            const dy = (pointerY - 0.5) * 2
            let v = 0
            
            if (effect.axis === 'x') v = dy
            else if (effect.axis === 'y') v = -dx
            else v = (dy + -dx) / axisCount
            
            const deg = Math.max(-effect.maxDeg, Math.min(effect.maxDeg, v * effect.maxDeg))
            tiltRad += (deg * Math.PI) / 180
          }
        }
      }
      
      // Apply computed values
      layer.sprite.alpha = Math.max(0, Math.min(1, alpha))
      const finalScale = item.baseScale * scaleMul
      layer.sprite.scale.set(finalScale, finalScale)
      
      const prevTilt = item.prevTiltRad || 0
      if (tiltRad !== prevTilt) {
        layer.sprite.rotation += (tiltRad - prevTilt)
        item.prevTiltRad = tiltRad
      }
    }
  }
  
  const cleanup = () => {
    try { window.removeEventListener('mousemove', handleMouse as any) } catch {}
    try { window.removeEventListener('touchmove', handleTouch as any) } catch {}
  }
  
  return { items, tick, cleanup }
}

/**
 * Build advanced effects system
 */
function buildAdvancedEffects(app: Application, layers: BuiltLayer[]) {
  if (!canUseAdvancedEffects()) {
    return { 
      items: [] as AdvancedEffectItem[], 
      tick: (_elapsed: number, _layers: BuiltLayer[]) => {}, 
      cleanup: () => {} 
    }
  }
  
  const items: AdvancedEffectItem[] = []
  
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]
    if (!layer) continue
    
    const effects = parseEffects(layer.cfg)
    const advancedEffects = effects.filter(e => e.type === 'glow' || e.type === 'bloom' || e.type === 'distort' || e.type === 'shockwave')
    
    if (advancedEffects.length === 0) continue
    
    const baseScale = (layer.cfg.scale?.pct ?? 100) / 100
    const item: AdvancedEffectItem = { spriteIdx: i, auras: [] }
    
    for (const effect of advancedEffects) {
      if (effect.type === 'glow') {
        const glowEffect = effect as GlowSpec
        const auraSprite = new Sprite(layer.sprite.texture)
        auraSprite.anchor.set(0.5)
        auraSprite.tint = glowEffect.color
        auraSprite.alpha = glowEffect.alpha
        auraSprite.blendMode = 1 // ADD blend mode
        
        const parent = layer.sprite.parent
        if (parent) {
          const index = parent.getChildIndex(layer.sprite)
          parent.addChildAt(auraSprite, index)
        }
        
        item.auras.push({
          sprite: auraSprite,
          baseScale: baseScale * (1 + glowEffect.scale),
          strength: 1,
          pulseMs: glowEffect.pulseMs,
          color: glowEffect.color,
          alpha: glowEffect.alpha
        })
        
      } else if (effect.type === 'bloom') {
        const bloomEffect = effect as BloomSpec
        const auraSprite = new Sprite(layer.sprite.texture)
        auraSprite.anchor.set(0.5)
        auraSprite.alpha = Math.min(1, 0.3 + bloomEffect.strength * 0.4)
        auraSprite.blendMode = 1 // ADD blend mode
        
        const parent = layer.sprite.parent
        if (parent) {
          const index = parent.getChildIndex(layer.sprite)
          parent.addChildAt(auraSprite, index)
        }
        
        item.auras.push({
          sprite: auraSprite,
          baseScale: baseScale * (1 + 0.2 + bloomEffect.strength * 0.2),
          strength: bloomEffect.strength,
          alpha: auraSprite.alpha
        })
        
      } else if (effect.type === 'distort') {
        const distortEffect = effect as DistortSpec
        item.distort = {
          ampPx: distortEffect.ampPx,
          speed: distortEffect.speed,
          baseX: layer.sprite.x,
          baseY: layer.sprite.y
        }
        
      } else if (effect.type === 'shockwave') {
        const shockEffect = effect as ShockwaveSpec
        item.shock = {
          period: shockEffect.periodMs,
          maxScale: shockEffect.maxScale,
          fade: shockEffect.fade,
          baseScale
        }
      }
    }
    
    if (item.auras.length || item.distort || item.shock) {
      items.push(item)
    }
  }
  
  const tick = (elapsed: number, layersRef: BuiltLayer[]) => {
    for (const item of items) {
      const layer = layersRef[item.spriteIdx]
      if (!layer) continue
      
      // Update auras
      for (const aura of item.auras) {
        aura.sprite.x = layer.sprite.x
        aura.sprite.y = layer.sprite.y
        aura.sprite.rotation = layer.sprite.rotation
        
        let scale = aura.baseScale
        if (aura.pulseMs) {
          const T = aura.pulseMs / 1000
          if (T > 0) scale = aura.baseScale * (1 + 0.05 * Math.sin((2 * Math.PI / T) * elapsed))
        }
        aura.sprite.scale.set(scale, scale)
      }
      
      // Update distortion
      if (item.distort) {
        const { ampPx, speed } = item.distort
        const t = elapsed * speed * 2 * Math.PI
        layer.sprite.x += ampPx * Math.sin(t)
        layer.sprite.y += ampPx * Math.cos(t * 0.9)
      }
      
      // Update shockwave
      if (item.shock) {
        const T = item.shock.period / 1000
        if (T > 0) {
          const phase = (elapsed % T) / T
          const mul = 1 + (item.shock.maxScale - 1) * Math.sin(Math.PI * phase)
          const scale = item.shock.baseScale * mul
          layer.sprite.scale.set(scale, scale)
          
          if (item.shock.fade) {
            layer.sprite.alpha = 0.8 + 0.2 * Math.cos(Math.PI * phase)
          }
        }
      }
    }
  }
  
  const cleanup = () => {
    for (const item of items) {
      for (const aura of item.auras) {
        try {
          aura.sprite.destroy()
        } catch {
          // ignore destroy errors
        }
      }
    }
  }
  
  return { items, tick, cleanup }
}

/**
 * Build complete effects system
 */
export function buildEffectSystem(app: Application, layers: BuiltLayer[]) {
  const basic = buildBasicEffects(app, layers)
  const advanced = buildAdvancedEffects(app, layers)
  
  return {
    basicItems: basic.items,
    advancedItems: advanced.items,
    tick: (elapsed: number, layersRef: BuiltLayer[]) => {
      basic.tick(elapsed, layersRef)
      advanced.tick(elapsed, layersRef)
    },
    cleanup: () => {
      basic.cleanup()
      advanced.cleanup()
    }
  }
}

/**
 * Effect processor for the logic system
 */
export class EffectProcessor implements LogicProcessor {
  private basicItems: BasicEffectItem[] = []
  private advancedItems: AdvancedEffectItem[] = []
  private tickFn: ((elapsed: number, layers: BuiltLayer[]) => void) | null = null
  private cleanupFn: (() => void) | null = null
  private elapsedTime = 0

  init(ctx: BuildContext): void {
    const system = buildEffectSystem(ctx.app, ctx.layers)
    this.basicItems = system.basicItems
    this.advancedItems = system.advancedItems
    this.tickFn = system.tick
    this.cleanupFn = system.cleanup
    this.elapsedTime = 0
  }

  tick(deltaTime: number, ctx: BuildContext): void {
    if (this.basicItems.length === 0 && this.advancedItems.length === 0) return
    
    this.elapsedTime += deltaTime
    this.tickFn?.(this.elapsedTime, ctx.layers)
  }

  dispose(): void {
    this.cleanupFn?.()
    this.basicItems.length = 0
    this.advancedItems.length = 0
    this.tickFn = null
    this.cleanupFn = null
    this.elapsedTime = 0
  }

  /**
   * Get effect items for a layer
   */
  getBasicEffectsForLayer(layerIndex: number): BasicEffectItem | null {
    return this.basicItems.find(item => item.spriteIdx === layerIndex) || null
  }

  getAdvancedEffectsForLayer(layerIndex: number): AdvancedEffectItem | null {
    return this.advancedItems.find(item => item.spriteIdx === layerIndex) || null
  }

  /**
   * Get all active effect items
   */
  getAllActiveEffects(): { basic: BasicEffectItem[]; advanced: AdvancedEffectItem[] } {
    return {
      basic: this.basicItems,
      advanced: this.advancedItems
    }
  }
}

/**
 * Utility functions for effects
 */
export const EffectUtils = {
  /**
   * Check if effect type is advanced
   */
  isAdvancedEffect(type: string): boolean {
    return ['glow', 'bloom', 'distort', 'shockwave'].includes(type)
  },

  /**
   * Check if effect type is basic
   */
  isBasicEffect(type: string): boolean {
    return ['fade', 'pulse', 'tilt'].includes(type)
  },

  /**
   * Calculate effect intensity at given time
   */
  calculatePulseIntensity(elapsed: number, periodMs: number, phaseDeg: number = 0): number {
    const T = periodMs / 1000
    if (T <= 0) return 1
    
    const omega = (2 * Math.PI) / T
    const phase = (phaseDeg * Math.PI) / 180
    return Math.sin(omega * elapsed + phase)
  },

  /**
   * Calculate fade progress
   */
  calculateFadeProgress(elapsed: number, durationMs: number, loop: boolean = true): number {
    const T = durationMs / 1000
    if (T <= 0) return 1
    
    let phase = (elapsed % T) / T
    if (loop) {
      // Ping-pong animation
      if (phase > 0.5) phase = 1 - (phase - 0.5) * 2
      else phase = phase * 2
    }
    return phase
  },

  /**
   * Apply easing function
   */
  applyEasing(t: number, easing: 'linear' | 'sineInOut'): number {
    if (easing === 'sineInOut') {
      return 0.5 - 0.5 * Math.cos(Math.PI * 2 * t)
    }
    return t
  }
}

// Export all public APIs