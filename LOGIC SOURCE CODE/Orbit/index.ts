// Orbit Logic Module
// Handles orbital motion around center points

import type { Application, Sprite } from 'pixi.js'
import type { LayerConfig, BuiltLayer, LogicProcessor, BuildContext } from '../CORE/types'
import { clampRpm60, clamp, clamp01, toRad, normDeg } from '../CORE/math'
import { percentToStageCoords } from '../CORE/utils'
import { STAGE_WIDTH, STAGE_HEIGHT } from '../CORE/types'

export type OrbitDirection = 'cw' | 'ccw'

export type OrbitItem = {
  sprite: Sprite
  layerId: string
  cfg: LayerConfig
  direction: 1 | -1
  radPerSecond: number
  centerPercent: { x: number; y: number }
  centerPixels: { cx: number; cy: number }
  radius: number
  basePhase: number
  orientPolicy: 'none' | 'auto' | 'override'
  orientRadians: number
  spinRpm: number
  active: boolean
}

export type OrbitConfig = {
  rpm: number
  direction: OrbitDirection
  centerPercent: { x: number; y: number }
  phaseDegrees?: number | null
  orientPolicy?: 'none' | 'auto' | 'override'
  orientDegrees?: number | null
  enabled: boolean
}

/**
 * Project a point to the rectangle border
 */
function projectToRectBorder(
  centerX: number,
  centerY: number,
  pointX: number,
  pointY: number,
  width: number,
  height: number
): { x: number; y: number } {
  // If point is already inside bounds, return as-is
  if (pointX >= 0 && pointX <= width && pointY >= 0 && pointY <= height) {
    return { x: pointX, y: pointY }
  }

  const dx = pointX - centerX
  const dy = pointY - centerY

  if (dx === 0 && dy === 0) return { x: centerX, y: centerY }

  const epsilon = 1e-6
  const candidates: { t: number; x: number; y: number }[] = []

  // Check intersection with left and right edges
  if (Math.abs(dx) > epsilon) {
    // Left edge (x = 0)
    const t1 = (0 - centerX) / dx
    const y1 = centerY + t1 * dy
    if (t1 > 0 && y1 >= -1 && y1 <= height + 1) {
      candidates.push({ t: t1, x: 0, y: y1 })
    }

    // Right edge (x = width)
    const t2 = (width - centerX) / dx
    const y2 = centerY + t2 * dy
    if (t2 > 0 && y2 >= -1 && y2 <= height + 1) {
      candidates.push({ t: t2, x: width, y: y2 })
    }
  }

  // Check intersection with top and bottom edges
  if (Math.abs(dy) > epsilon) {
    // Top edge (y = 0)
    const t3 = (0 - centerY) / dy
    const x3 = centerX + t3 * dx
    if (t3 > 0 && x3 >= -1 && x3 <= width + 1) {
      candidates.push({ t: t3, x: x3, y: 0 })
    }

    // Bottom edge (y = height)
    const t4 = (height - centerY) / dy
    const x4 = centerX + t4 * dx
    if (t4 > 0 && x4 >= -1 && x4 <= width + 1) {
      candidates.push({ t: t4, x: x4, y: height })
    }
  }

  if (candidates.length === 0) {
    return { x: clamp(pointX, 0, width), y: clamp(pointY, 0, height) }
  }

  // Sort by parameter t and return the closest intersection
  candidates.sort((a, b) => a.t - b.t)
  const first = candidates[0]
  return { x: first.x, y: first.y }
}

/**
 * Create orbit configuration from layer config
 */
export function createOrbitConfig(cfg: LayerConfig): OrbitConfig {
  const rpm = clampRpm60(cfg.orbitRPM)
  const direction = cfg.orbitDir === 'ccw' ? 'ccw' : 'cw'
  const center = cfg.orbitCenter || { xPct: 50, yPct: 50 }
  const centerPercent = {
    x: clamp(center.xPct ?? 50, 0, 100),
    y: clamp(center.yPct ?? 50, 0, 100)
  }
  
  return {
    rpm,
    direction,
    centerPercent,
    phaseDegrees: cfg.orbitPhaseDeg,
    orientPolicy: cfg.orbitOrientPolicy || 'none',
    orientDegrees: cfg.orbitOrientDeg,
    enabled: rpm > 0
  }
}

/**
 * Create orbit item from layer
 */
export function createOrbitItem(layer: BuiltLayer, spinRpmBySprite: Map<Sprite, number>): OrbitItem | null {
  const orbitConfig = createOrbitConfig(layer.cfg)
  
  if (!orbitConfig.enabled) return null
  
  const direction = orbitConfig.direction === 'ccw' ? -1 : 1
  const w = STAGE_WIDTH
  const h = STAGE_HEIGHT
  
  // Calculate center position in pixels
  const centerCoords = percentToStageCoords(orbitConfig.centerPercent.x, orbitConfig.centerPercent.y, w, h)
  
  // Calculate initial position of the sprite
  const spriteCoords = percentToStageCoords(
    layer.cfg.position?.xPct ?? 0,
    layer.cfg.position?.yPct ?? 0,
    w,
    h
  )
  
  // Project sprite position to stage border to determine orbit radius
  const startPoint = projectToRectBorder(centerCoords.x, centerCoords.y, spriteCoords.x, spriteCoords.y, w, h)
  const radius = Math.hypot(startPoint.x - centerCoords.x, startPoint.y - centerCoords.y)
  
  if (radius <= 0) return null
  
  // Calculate initial phase
  const phaseDegrees = orbitConfig.phaseDegrees
  const basePhase = typeof phaseDegrees === 'number' && isFinite(phaseDegrees)
    ? toRad(normDeg(phaseDegrees))
    : Math.atan2(startPoint.y - centerCoords.y, startPoint.x - centerCoords.x)
  
  // Orientation settings
  const orientPolicy = orbitConfig.orientPolicy as 'none' | 'auto' | 'override'
  const orientDegrees = typeof orbitConfig.orientDegrees === 'number' && isFinite(orbitConfig.orientDegrees)
    ? orbitConfig.orientDegrees
    : 0
  const orientRadians = toRad(normDeg(orientDegrees))
  
  const radPerSecond = (orbitConfig.rpm * Math.PI) / 30
  const spinRpm = spinRpmBySprite.get(layer.sprite) ?? 0
  
  return {
    sprite: layer.sprite,
    layerId: layer.id,
    cfg: layer.cfg,
    direction,
    radPerSecond,
    centerPercent: orbitConfig.centerPercent,
    centerPixels: centerCoords,
    radius,
    basePhase,
    orientPolicy,
    orientRadians,
    spinRpm,
    active: true
  }
}

/**
 * Update orbit item position
 */
export function updateOrbitItem(item: OrbitItem, elapsedTime: number): void {
  if (!item.active || item.radius <= 0) return
  
  const angle = item.basePhase + item.direction * item.radPerSecond * elapsedTime
  
  // Calculate new position
  item.sprite.x = item.centerPixels.cx + item.radius * Math.cos(angle)
  item.sprite.y = item.centerPixels.cy + item.radius * Math.sin(angle)
  
  // Apply orientation if needed
  if (item.orientPolicy === 'override' || (item.orientPolicy === 'auto' && item.spinRpm <= 0)) {
    item.sprite.rotation = angle + item.orientRadians
  }
}

/**
 * Recompute orbit item (for resize or config changes)
 */
export function recomputeOrbitItem(item: OrbitItem, elapsedTime: number): void {
  const w = STAGE_WIDTH
  const h = STAGE_HEIGHT
  
  // Recalculate center position
  const centerCoords = percentToStageCoords(item.centerPercent.x, item.centerPercent.y, w, h)
  
  // Get current angle to maintain position
  const oldAngle = Math.atan2(item.sprite.y - item.centerPixels.cy, item.sprite.x - item.centerPixels.cx)
  
  // Update center and radius
  item.centerPixels = centerCoords
  
  // Recalculate radius based on initial config
  const spriteCoords = percentToStageCoords(
    item.cfg.position?.xPct ?? 0,
    item.cfg.position?.yPct ?? 0,
    w,
    h
  )
  const startPoint = projectToRectBorder(centerCoords.x, centerCoords.y, spriteCoords.x, spriteCoords.y, w, h)
  const newRadius = Math.hypot(startPoint.x - centerCoords.x, startPoint.y - centerCoords.y)
  
  item.radius = newRadius
  
  if (newRadius > 0) {
    // Adjust base phase to maintain current position
    item.basePhase = oldAngle - item.direction * item.radPerSecond * elapsedTime
    
    // Update position immediately
    item.sprite.x = centerCoords.x + newRadius * Math.cos(oldAngle)
    item.sprite.y = centerCoords.y + newRadius * Math.sin(oldAngle)
  }
}

/**
 * Build orbit system from layers
 */
export function buildOrbitSystem(app: Application, layers: BuiltLayer[], spinRpmBySprite: Map<Sprite, number>) {
  const items: OrbitItem[] = []
  
  for (const layer of layers) {
    const orbitItem = createOrbitItem(layer, spinRpmBySprite)
    if (orbitItem) {
      items.push(orbitItem)
    }
  }
  
  return {
    items,
    recompute: (elapsedTime: number) => {
      for (const item of items) {
        recomputeOrbitItem(item, elapsedTime)
      }
    },
    tick: (elapsedTime: number) => {
      for (const item of items) {
        updateOrbitItem(item, elapsedTime)
      }
    }
  }
}

/**
 * Orbit processor for the logic system
 */
export class OrbitProcessor implements LogicProcessor {
  private items: OrbitItem[] = []
  private elapsedTime = 0

  init(ctx: BuildContext): void {
    // Get spin RPM data from SpinL processor if available
    const spinRpmBySprite = new Map<Sprite, number>()
    
    const system = buildOrbitSystem(ctx.app, ctx.layers, spinRpmBySprite)
    this.items = system.items
    this.elapsedTime = 0
  }

  onResize(ctx: BuildContext): void {
    for (const item of this.items) {
      recomputeOrbitItem(item, this.elapsedTime)
    }
  }

  tick(deltaTime: number, ctx: BuildContext): void {
    if (this.items.length === 0) return
    
    this.elapsedTime += deltaTime
    
    for (const item of this.items) {
      updateOrbitItem(item, this.elapsedTime)
    }
  }

  dispose(): void {
    this.items.length = 0
    this.elapsedTime = 0
  }

  /**
   * Get orbit item by layer ID
   */
  getOrbitItem(layerId: string): OrbitItem | null {
    return this.items.find(item => item.layerId === layerId) || null
  }

  /**
   * Update orbit RPM for a layer
   */
  updateRPM(layerId: string, rpm: number): void {
    const item = this.getOrbitItem(layerId)
    if (item) {
      const clampedRpm = clampRpm60(rpm)
      item.radPerSecond = (clampedRpm * Math.PI) / 30
      item.active = clampedRpm > 0
    }
  }

  /**
   * Set orbit direction for a layer
   */
  setDirection(layerId: string, direction: OrbitDirection): void {
    const item = this.getOrbitItem(layerId)
    if (item) {
      item.direction = direction === 'ccw' ? -1 : 1
    }
  }

  /**
   * Update orbit center for a layer
   */
  updateCenter(layerId: string, centerPercent: { x: number; y: number }): void {
    const item = this.getOrbitItem(layerId)
    if (item) {
      item.centerPercent = {
        x: clamp(centerPercent.x, 0, 100),
        y: clamp(centerPercent.y, 0, 100)
      }
      recomputeOrbitItem(item, this.elapsedTime)
    }
  }

  /**
   * Get all active orbit items
   */
  getActiveItems(): OrbitItem[] {
    return this.items.filter(item => item.active)
  }
}

/**
 * Utility functions for Orbit
 */
export const OrbitUtils = {
  /**
   * Calculate orbital period in seconds
   */
  calculatePeriod(rpm: number): number {
    return rpm > 0 ? 60 / rpm : 0
  },

  /**
   * Calculate orbital speed in pixels per second
   */
  calculateSpeed(radius: number, rpm: number): number {
    return radius * (rpm * Math.PI) / 30
  },

  /**
   * Get position on orbit at specific angle
   */
  getOrbitPosition(centerX: number, centerY: number, radius: number, angle: number): { x: number; y: number } {
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    }
  },

  /**
   * Calculate angle between two points
   */
  getAngleBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1)
  },

  /**
   * Normalize orbit radius to stage bounds
   */
  normalizeRadius(centerX: number, centerY: number, radius: number): number {
    const maxX = Math.max(centerX, STAGE_WIDTH - centerX)
    const maxY = Math.max(centerY, STAGE_HEIGHT - centerY)
    const maxRadius = Math.hypot(maxX, maxY)
    return Math.min(radius, maxRadius)
  }
}

// Export all public APIs