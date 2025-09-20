// SpinL (Spin Logic) Module
// Handles rotation animations with RPM control

import type { Application, Sprite } from 'pixi.js'
import type { LayerConfig, BuiltLayer, LogicProcessor, BuildContext } from '../CORE/types'
import { clampRpm60 } from '../CORE/math'

export type SpinDirection = 'cw' | 'ccw'

export type SpinItem = {
  sprite: Sprite
  layerId: string
  baseRotation: number
  radPerSecond: number
  direction: 1 | -1
  rpm: number
  active: boolean
}

export type SpinConfig = {
  rpm: number
  direction: SpinDirection
  enabled: boolean
}

/**
 * Convert RPM to radians per second
 */
export function rpmToRadPerSecond(rpm: number): number {
  return (rpm * Math.PI) / 30
}

/**
 * Create spin configuration from layer config
 */
export function createSpinConfig(cfg: LayerConfig): SpinConfig {
  const rpm = clampRpm60(cfg.spinRPM)
  const direction = cfg.spinDir === 'ccw' ? 'ccw' : 'cw'
  const enabled = rpm > 0
  
  return { rpm, direction, enabled }
}

/**
 * Create spin item from layer
 */
export function createSpinItem(layer: BuiltLayer): SpinItem | null {
  const spinConfig = createSpinConfig(layer.cfg)
  
  if (!spinConfig.enabled) return null
  
  const direction = spinConfig.direction === 'ccw' ? -1 : 1
  const radPerSecond = rpmToRadPerSecond(spinConfig.rpm)
  
  return {
    sprite: layer.sprite,
    layerId: layer.id,
    baseRotation: layer.sprite.rotation,
    radPerSecond,
    direction,
    rpm: spinConfig.rpm,
    active: true
  }
}

/**
 * Update spin animation for a single item
 */
export function updateSpinItem(item: SpinItem, elapsedTime: number): void {
  if (!item.active) return
  
  const totalRotation = item.baseRotation + (item.direction * item.radPerSecond * elapsedTime)
  item.sprite.rotation = totalRotation
}

/**
 * Build spin system from layers
 */
export function buildSpinSystem(app: Application, layers: BuiltLayer[]) {
  const items: SpinItem[] = []
  const rpmBySprite = new Map<Sprite, number>()
  
  for (const layer of layers) {
    const spinConfig = createSpinConfig(layer.cfg)
    rpmBySprite.set(layer.sprite, spinConfig.rpm)
    
    const spinItem = createSpinItem(layer)
    if (spinItem) {
      items.push(spinItem)
    }
  }
  
  return { items, rpmBySprite }
}

/**
 * Tick function for spin animations
 */
export function tickSpinSystem(items: SpinItem[], elapsedTime: number): void {
  for (const item of items) {
    updateSpinItem(item, elapsedTime)
  }
}

/**
 * SpinL processor for the logic system
 */
export class SpinLProcessor implements LogicProcessor {
  private items: SpinItem[] = []
  private rpmBySprite = new Map<Sprite, number>()
  private elapsedTime = 0

  init(ctx: BuildContext): void {
    const system = buildSpinSystem(ctx.app, ctx.layers)
    this.items = system.items
    this.rpmBySprite = system.rpmBySprite
    this.elapsedTime = 0
  }

  tick(deltaTime: number, ctx: BuildContext): void {
    if (this.items.length === 0) return
    
    this.elapsedTime += deltaTime
    tickSpinSystem(this.items, this.elapsedTime)
  }

  dispose(): void {
    this.items.length = 0
    this.rpmBySprite.clear()
    this.elapsedTime = 0
  }

  /**
   * Get RPM for a sprite
   */
  getRPM(sprite: Sprite): number {
    return this.rpmBySprite.get(sprite) || 0
  }

  /**
   * Update RPM for a spin item
   */
  updateRPM(layerId: string, rpm: number): void {
    const item = this.items.find(i => i.layerId === layerId)
    if (item) {
      item.rpm = clampRpm60(rpm)
      item.radPerSecond = rpmToRadPerSecond(item.rpm)
      item.active = item.rpm > 0
    }
  }

  /**
   * Toggle spin for a layer
   */
  toggleSpin(layerId: string): void {
    const item = this.items.find(i => i.layerId === layerId)
    if (item) {
      item.active = !item.active
    }
  }

  /**
   * Set spin direction for a layer
   */
  setDirection(layerId: string, direction: SpinDirection): void {
    const item = this.items.find(i => i.layerId === layerId)
    if (item) {
      item.direction = direction === 'ccw' ? -1 : 1
    }
  }

  /**
   * Get all active spin items
   */
  getActiveItems(): SpinItem[] {
    return this.items.filter(item => item.active)
  }

  /**
   * Reset all spins to base rotation
   */
  reset(): void {
    for (const item of this.items) {
      item.sprite.rotation = item.baseRotation
    }
    this.elapsedTime = 0
  }
}

/**
 * Utility functions for SpinL
 */
export const SpinLUtils = {
  /**
   * Calculate rotation speed in degrees per second
   */
  rpmToDegreesPerSecond(rpm: number): number {
    return rpm * 6 // 360 degrees per minute = 6 degrees per second per RPM
  },

  /**
   * Calculate how many full rotations have occurred
   */
  getRotationCount(elapsedTime: number, rpm: number): number {
    return (elapsedTime * rpm) / 60
  },

  /**
   * Get normalized rotation angle (0 to 2π)
   */
  normalizeRotation(rotation: number): number {
    const twoPi = Math.PI * 2
    return ((rotation % twoPi) + twoPi) % twoPi
  },

  /**
   * Check if two RPM values are effectively the same
   */
  rpmEqual(a: number, b: number, epsilon = 0.01): boolean {
    return Math.abs(a - b) < epsilon
  },

  /**
   * Create smooth RPM transition
   */
  createRPMTransition(fromRPM: number, toRPM: number, duration: number) {
    return {
      from: fromRPM,
      to: toRPM,
      duration,
      getValueAt(time: number): number {
        const t = Math.min(1, Math.max(0, time / duration))
        return fromRPM + (toRPM - fromRPM) * t
      }
    }
  }
}

// Export all public APIs