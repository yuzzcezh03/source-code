// Basic Transform Logic Module
// Handles positioning, scaling, rotation, and z-index management

import type { Application, Sprite } from 'pixi.js'
import type { LayerConfig, BuiltLayer, LogicProcessor, BuildContext } from '../CORE/types'
import { toRad, clamp } from '../CORE/math'
import { extractZIndex, percentToStageCoords } from '../CORE/utils'
import { STAGE_WIDTH, STAGE_HEIGHT } from '../CORE/types'

export type BasicTransform = {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  zIndex: number
}

/**
 * Calculate z-index from layer configuration
 */
export function calculateZIndex(cfg: LayerConfig): number {
  return extractZIndex(cfg.id)
}

/**
 * Apply basic transform properties to a sprite
 */
export function applyBasicTransform(app: Application, sprite: Sprite, cfg: LayerConfig): void {
  const w = STAGE_WIDTH
  const h = STAGE_HEIGHT
  
  // Position (percentage-based)
  const xPct = cfg.position.xPct ?? 0
  const yPct = cfg.position.yPct ?? 0
  const coords = percentToStageCoords(xPct, yPct, w, h)
  sprite.x = coords.x
  sprite.y = coords.y
  
  // Scale (percentage-based)
  const scalePct = (cfg.scale?.pct ?? 100) / 100
  sprite.scale.set(scalePct, scalePct)
  
  // Rotation (degrees to radians)
  sprite.rotation = toRad(cfg.angleDeg ?? 0)
  
  // Z-index for layering
  sprite.zIndex = calculateZIndex(cfg)
}

/**
 * Get basic transform data from configuration
 */
export function getBasicTransform(cfg: LayerConfig): BasicTransform {
  const w = STAGE_WIDTH
  const h = STAGE_HEIGHT
  
  const xPct = cfg.position.xPct ?? 0
  const yPct = cfg.position.yPct ?? 0
  const coords = percentToStageCoords(xPct, yPct, w, h)
  
  const scalePct = (cfg.scale?.pct ?? 100) / 100
  
  return {
    x: coords.x,
    y: coords.y,
    scaleX: scalePct,
    scaleY: scalePct,
    rotation: toRad(cfg.angleDeg ?? 0),
    zIndex: calculateZIndex(cfg)
  }
}

/**
 * Apply transform data to sprite
 */
export function applyTransformToSprite(sprite: Sprite, transform: BasicTransform): void {
  sprite.x = transform.x
  sprite.y = transform.y
  sprite.scale.set(transform.scaleX, transform.scaleY)
  sprite.rotation = transform.rotation
  sprite.zIndex = transform.zIndex
}

/**
 * Basic transform processor for the logic system
 */
export class BasicProcessor implements LogicProcessor {
  private transforms: Map<string, BasicTransform> = new Map()

  init(ctx: BuildContext): void {
    // Calculate and store transforms for all layers
    for (const layer of ctx.layers) {
      const transform = getBasicTransform(layer.cfg)
      this.transforms.set(layer.id, transform)
      applyTransformToSprite(layer.sprite, transform)
    }
  }

  onResize(ctx: BuildContext): void {
    // Recalculate transforms on resize (percentage-based positioning)
    for (const layer of ctx.layers) {
      const transform = getBasicTransform(layer.cfg)
      this.transforms.set(layer.id, transform)
      applyTransformToSprite(layer.sprite, transform)
    }
  }

  dispose(): void {
    this.transforms.clear()
  }

  /**
   * Get stored transform for a layer
   */
  getTransform(layerId: string): BasicTransform | null {
    return this.transforms.get(layerId) || null
  }

  /**
   * Update transform for a layer
   */
  updateTransform(layerId: string, transform: Partial<BasicTransform>): void {
    const current = this.transforms.get(layerId)
    if (current) {
      const updated = { ...current, ...transform }
      this.transforms.set(layerId, updated)
    }
  }
}

/**
 * Utility functions for working with transforms
 */
export const BasicUtils = {
  /**
   * Interpolate between two transforms
   */
  lerpTransforms(from: BasicTransform, to: BasicTransform, t: number): BasicTransform {
    const clampedT = clamp(t, 0, 1)
    return {
      x: from.x + (to.x - from.x) * clampedT,
      y: from.y + (to.y - from.y) * clampedT,
      scaleX: from.scaleX + (to.scaleX - from.scaleX) * clampedT,
      scaleY: from.scaleY + (to.scaleY - from.scaleY) * clampedT,
      rotation: from.rotation + (to.rotation - from.rotation) * clampedT,
      zIndex: Math.round(from.zIndex + (to.zIndex - from.zIndex) * clampedT)
    }
  },

  /**
   * Create identity transform
   */
  createIdentityTransform(): BasicTransform {
    return {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      zIndex: 0
    }
  },

  /**
   * Compare two transforms for equality
   */
  transformsEqual(a: BasicTransform, b: BasicTransform, epsilon = 0.001): boolean {
    return (
      Math.abs(a.x - b.x) < epsilon &&
      Math.abs(a.y - b.y) < epsilon &&
      Math.abs(a.scaleX - b.scaleX) < epsilon &&
      Math.abs(a.scaleY - b.scaleY) < epsilon &&
      Math.abs(a.rotation - b.rotation) < epsilon &&
      a.zIndex === b.zIndex
    )
  }
}

// Export all public APIs