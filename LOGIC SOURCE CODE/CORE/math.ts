// Core mathematical utilities for all logic modules

/**
 * Convert degrees to radians
 */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Convert radians to degrees
 */
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

/**
 * Clamp a number between min and max values
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/**
 * Clamp a number between 0 and 1
 */
export function clamp01(n: number): number {
  return clamp(n, 0, 1)
}

/**
 * Normalize degrees to 0-360 range
 */
export function normDeg(deg: number): number {
  const d = deg % 360
  return d < 0 ? d + 360 : d
}

/**
 * Clamp RPM values between 0 and 60
 */
export function clampRpm60(v: unknown): number {
  const n = typeof v === 'number' ? v : v == null ? 0 : Number(v)
  if (!isFinite(n) || n <= 0) return 0
  return Math.min(60, Math.max(0, n))
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Rotate a 2D vector by angle (in radians)
 */
export function rotateVec(v: { x: number; y: number }, angle: number): { x: number; y: number } {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return {
    x: v.x * c - v.y * s,
    y: v.x * s + v.y * c,
  }
}