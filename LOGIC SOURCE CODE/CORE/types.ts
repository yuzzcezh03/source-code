// Core types and interfaces for all logic modules
import type { Application, Container, Sprite } from 'pixi.js'

// Core geometric types
export type Vec2 = { x: number; y: number }

// Core layer configuration
export type LayerConfig = {
  id: string
  imageRef: ImageRef
  position: { xPct: number; yPct: number }
  scale?: { pct?: number }
  angleDeg?: number
  // Runtime animation properties
  spinRPM?: number | null
  spinDir?: 'cw' | 'ccw'
  orbitRPM?: number | null
  orbitDir?: 'cw' | 'ccw'
  orbitCenter?: { xPct: number; yPct: number }
  orbitPhaseDeg?: number | null
  orbitOrientPolicy?: 'none' | 'auto' | 'override'
  orbitOrientDeg?: number | null
  effects?: EffectConfig[]
}

// Image reference types
export type ImageRef =
  | { kind: 'urlId'; id: string }
  | { kind: 'url'; url: string }

// Effect types
export type EffectConfig = 
  | FadeEffect | PulseEffect | TiltEffect | GlowEffect | BloomEffect | DistortEffect | ShockwaveEffect

export type FadeEffect = {
  type: 'fade'
  from?: number
  to?: number
  durationMs?: number
  loop?: boolean
  easing?: 'linear' | 'sineInOut'
}

export type PulseEffect = {
  type: 'pulse'
  property?: 'scale' | 'alpha'
  amp?: number
  periodMs?: number
  phaseDeg?: number
}

export type TiltEffect = {
  type: 'tilt'
  mode?: 'pointer' | 'device' | 'time'
  axis?: 'both' | 'x' | 'y'
  maxDeg?: number
  periodMs?: number
}

export type GlowEffect = {
  type: 'glow'
  color?: number
  alpha?: number
  scale?: number
  pulseMs?: number
}

export type BloomEffect = {
  type: 'bloom'
  strength?: number
  threshold?: number
}

export type DistortEffect = {
  type: 'distort'
  ampPx?: number
  speed?: number
}

export type ShockwaveEffect = {
  type: 'shockwave'
  periodMs?: number
  maxScale?: number
  fade?: boolean
}

// Built layer type
export type BuiltLayer = {
  id: string
  sprite: Sprite
  cfg: LayerConfig
}

// Logic configuration
export type LogicConfig = {
  layersID: string[]
  imageRegistry: Record<string, string>
  layers: LayerConfig[]
}

// Build context
export type BuildContext = {
  app: Application
  container: Container
  cfg: LogicConfig
  layers: BuiltLayer[]
}

// Build result
export type BuildResult = {
  container: Container
  layers: BuiltLayer[]
}

// Processor interface
export interface LogicProcessor {
  init(ctx: BuildContext): void
  onResize?(ctx: BuildContext): void
  tick?(dt: number, ctx: BuildContext): void
  dispose?(): void
}

// Stage dimensions (fixed design canvas)
export const STAGE_WIDTH = 1024
export const STAGE_HEIGHT = 1024