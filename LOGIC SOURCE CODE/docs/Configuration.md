# Configuration Guide

Comprehensive guide to configuring animations in the Animation Logic Library.

## Overview

The library uses a declarative configuration approach where animations are defined through configuration objects. This guide covers all available options and their usage patterns.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Layer Configuration](#layer-configuration)
- [Animation Properties](#animation-properties)
- [Effect Configuration](#effect-configuration)
- [Advanced Configuration](#advanced-configuration)
- [Best Practices](#best-practices)

---

## Basic Configuration

### LogicConfig Structure

The main configuration object that defines your entire animated scene:

```typescript
type LogicConfig = {
  layersID: string[]           // Array of layer IDs for ordering
  imageRegistry: Record<string, string>  // Image URL mapping
  layers: LayerConfig[]        // Individual layer configurations
}
```

### Simple Example

```typescript
const config: LogicConfig = {
  layersID: ['background', 'spinner', 'overlay'],
  imageRegistry: {
    'bg': '/assets/background.png',
    'wheel': '/assets/spinning-wheel.png',
    'glow': '/assets/glow-overlay.png'
  },
  layers: [
    {
      id: 'background',
      imageRef: { kind: 'urlId', id: 'bg' },
      position: { xPct: 50, yPct: 50 }
    },
    {
      id: 'spinner',
      imageRef: { kind: 'urlId', id: 'wheel' },
      position: { xPct: 50, yPct: 50 },
      spinRPM: 20
    },
    {
      id: 'overlay',
      imageRef: { kind: 'urlId', id: 'glow' },
      position: { xPct: 50, yPct: 50 },
      effects: [
        { type: 'pulse', property: 'alpha', amp: 0.3, periodMs: 2000 }
      ]
    }
  ]
}
```

---

## Layer Configuration

### LayerConfig Properties

```typescript
type LayerConfig = {
  // Required properties
  id: string                   // Unique identifier
  imageRef: ImageRef          // Image reference
  position: { xPct: number; yPct: number }  // Position as percentages
  
  // Optional transform properties
  scale?: { pct?: number }    // Scale as percentage (default: 100)
  angleDeg?: number          // Initial rotation in degrees
  
  // Animation properties
  spinRPM?: number | null    // Rotation speed (0-60 RPM)
  spinDir?: 'cw' | 'ccw'    // Spin direction
  orbitRPM?: number | null   // Orbital speed (0-60 RPM)
  orbitDir?: 'cw' | 'ccw'   // Orbit direction
  orbitCenter?: { xPct: number; yPct: number }  // Orbit center
  orbitPhaseDeg?: number | null              // Initial orbit angle
  orbitOrientPolicy?: 'none' | 'auto' | 'override'  // Orientation behavior
  orbitOrientDeg?: number | null             // Override orientation angle
  
  // Visual effects
  effects?: EffectConfig[]   // Array of visual effects
}
```

### Image References

Two ways to reference images:

```typescript
// Reference by ID (recommended)
imageRef: { kind: 'urlId', id: 'my-image' }

// Direct URL reference
imageRef: { kind: 'url', url: '/path/to/image.png' }
```

### Position System

The library uses percentage-based positioning for responsive layouts:

```typescript
// Center of stage
position: { xPct: 50, yPct: 50 }

// Top-left corner
position: { xPct: 0, yPct: 0 }

// Bottom-right corner
position: { xPct: 100, yPct: 100 }

// Off-screen positioning is allowed
position: { xPct: -10, yPct: 110 }
```

---

## Animation Properties

### Spinning Animation

Control rotation around the sprite's center:

```typescript
{
  id: 'gear',
  spinRPM: 15,           // 15 revolutions per minute
  spinDir: 'cw',         // Clockwise rotation
  // spinDir: 'ccw'      // Counter-clockwise rotation
}
```

**RPM Guidelines:**
- `0`: No rotation
- `1-10`: Slow, subtle rotation
- `10-30`: Medium speed, clearly visible
- `30-60`: Fast rotation (maximum)

### Orbital Animation

Control movement around a center point:

```typescript
{
  id: 'planet',
  orbitRPM: 8,                           // 8 orbits per minute
  orbitDir: 'cw',                        // Clockwise orbit
  orbitCenter: { xPct: 50, yPct: 50 },   // Orbit around center
  orbitPhaseDeg: 0,                      // Starting angle
  orbitOrientPolicy: 'auto'              // Face direction of travel
}
```

**Orbit Orientation Policies:**
- `'none'`: No orientation change (sprite keeps original rotation)
- `'auto'`: Automatically face direction of movement
- `'override'`: Use specific angle from `orbitOrientDeg`

**Advanced Orbit Configuration:**

```typescript
{
  id: 'moon',
  position: { xPct: 70, yPct: 30 },      // Initial position
  orbitRPM: 12,
  orbitCenter: { xPct: 50, yPct: 50 },   // Earth center
  orbitPhaseDeg: 90,                     // Start at 90° angle
  orbitOrientPolicy: 'override',
  orbitOrientDeg: 45,                    // Always tilted 45°
  spinRPM: 2                             // Also spin while orbiting
}
```

---

## Effect Configuration

### Basic Effects

#### Fade Effect

```typescript
{
  type: 'fade',
  from: 1,                    // Starting alpha (0-1)
  to: 0.3,                   // Ending alpha (0-1)
  durationMs: 2000,          // Animation duration
  loop: true,                // Ping-pong loop
  easing: 'sineInOut'        // 'linear' or 'sineInOut'
}
```

#### Pulse Effect

```typescript
{
  type: 'pulse',
  property: 'scale',         // 'scale' or 'alpha'
  amp: 0.1,                 // Amplitude (0-1)
  periodMs: 1500,           // Period in milliseconds
  phaseDeg: 0               // Phase offset in degrees
}
```

#### Tilt Effect

```typescript
{
  type: 'tilt',
  mode: 'pointer',          // 'pointer', 'device', or 'time'
  axis: 'both',             // 'both', 'x', or 'y'
  maxDeg: 12,               // Maximum tilt angle
  periodMs: 4000            // Period for time-based tilt
}
```

### Advanced Effects

#### Glow Effect

```typescript
{
  type: 'glow',
  color: 0x00aaff,          // Glow color (hex)
  alpha: 0.4,               // Glow opacity
  scale: 0.15,              // Glow size multiplier
  pulseMs: 2000             // Optional pulsing period
}
```

#### Bloom Effect

```typescript
{
  type: 'bloom',
  strength: 0.6,            // Bloom intensity (0-1)
  threshold: 0.5            // Brightness threshold (0-1)
}
```

#### Distort Effect

```typescript
{
  type: 'distort',
  ampPx: 3,                 // Distortion amplitude in pixels
  speed: 0.7                // Distortion speed multiplier
}
```

#### Shockwave Effect

```typescript
{
  type: 'shockwave',
  periodMs: 1500,           // Shockwave period
  maxScale: 1.4,            // Maximum scale multiplier
  fade: true                // Enable alpha fade during shockwave
}
```

### Multiple Effects

You can combine multiple effects on a single layer:

```typescript
{
  id: 'magical-orb',
  imageRef: { kind: 'urlId', id: 'orb' },
  position: { xPct: 50, yPct: 50 },
  spinRPM: 5,
  effects: [
    {
      type: 'pulse',
      property: 'scale',
      amp: 0.05,
      periodMs: 2000
    },
    {
      type: 'glow',
      color: 0xff00aa,
      alpha: 0.3,
      scale: 0.2,
      pulseMs: 3000
    },
    {
      type: 'tilt',
      mode: 'pointer',
      axis: 'both',
      maxDeg: 8
    }
  ]
}
```

---

## Advanced Configuration

### Z-Index Ordering

Layer rendering order is determined by numeric suffixes in layer IDs:

```typescript
{
  layersID: [
    'background-0',    // Rendered first (bottom)
    'content-10',      // Middle layer
    'ui-20',          // Top layer
    'overlay-30'       // Rendered last (top)
  ],
  layers: [
    { id: 'background-0', /* ... */ },
    { id: 'content-10', /* ... */ },
    { id: 'ui-20', /* ... */ },
    { id: 'overlay-30', /* ... */ }
  ]
}
```

### Complex Scene Example

```typescript
const complexConfig: LogicConfig = {
  layersID: [
    'space-bg-0',
    'star-field-5',
    'planet-10',
    'moon-15',
    'satellite-20',
    'ui-overlay-30'
  ],
  imageRegistry: {
    'space': '/assets/space-background.jpg',
    'stars': '/assets/star-field.png',
    'earth': '/assets/earth.png',
    'moon': '/assets/moon.png',
    'sat': '/assets/satellite.png',
    'ui': '/assets/ui-overlay.png'
  },
  layers: [
    {
      id: 'space-bg-0',
      imageRef: { kind: 'urlId', id: 'space' },
      position: { xPct: 50, yPct: 50 },
      scale: { pct: 110 }
    },
    {
      id: 'star-field-5',
      imageRef: { kind: 'urlId', id: 'stars' },
      position: { xPct: 50, yPct: 50 },
      spinRPM: 0.5,
      effects: [
        {
          type: 'pulse',
          property: 'alpha',
          amp: 0.1,
          periodMs: 8000
        }
      ]
    },
    {
      id: 'planet-10',
      imageRef: { kind: 'urlId', id: 'earth' },
      position: { xPct: 50, yPct: 50 },
      spinRPM: 2,
      effects: [
        {
          type: 'glow',
          color: 0x4488ff,
          alpha: 0.2,
          scale: 0.1
        }
      ]
    },
    {
      id: 'moon-15',
      imageRef: { kind: 'urlId', id: 'moon' },
      position: { xPct: 65, yPct: 40 },
      scale: { pct: 30 },
      orbitRPM: 6,
      orbitCenter: { xPct: 50, yPct: 50 },
      orbitPhaseDeg: 45,
      spinRPM: 1
    },
    {
      id: 'satellite-20',
      imageRef: { kind: 'urlId', id: 'sat' },
      position: { xPct: 75, yPct: 25 },
      scale: { pct: 15 },
      orbitRPM: 18,
      orbitCenter: { xPct: 50, yPct: 50 },
      orbitOrientPolicy: 'auto',
      effects: [
        {
          type: 'pulse',
          property: 'scale',
          amp: 0.2,
          periodMs: 500
        }
      ]
    },
    {
      id: 'ui-overlay-30',
      imageRef: { kind: 'urlId', id: 'ui' },
      position: { xPct: 50, yPct: 50 },
      effects: [
        {
          type: 'fade',
          from: 0,
          to: 1,
          durationMs: 1000,
          loop: false
        }
      ]
    }
  ]
}
```

---

## Best Practices

### Performance Optimization

```typescript
// Good: Reasonable RPM values
spinRPM: 15,        // Smooth, visible rotation
orbitRPM: 8,        // Clear orbital motion

// Avoid: Excessive RPM values
spinRPM: 100,       // Will be clamped to 60, wastes CPU
orbitRPM: 200,      // Unnecessarily high values
```

### Effect Selection

```typescript
// Mobile-friendly: Use basic effects
effects: [
  { type: 'fade', /* ... */ },
  { type: 'pulse', /* ... */ }
]

// Desktop: Can use advanced effects
effects: [
  { type: 'glow', /* ... */ },
  { type: 'bloom', /* ... */ },
  { type: 'distort', /* ... */ }
]
```

### Layer Organization

```typescript
// Good: Clear naming with z-index
layersID: [
  'background-0',
  'content-main-10',
  'effects-overlay-20',
  'ui-controls-30'
]

// Good: Logical grouping
imageRegistry: {
  // Backgrounds
  'bg-space': '/assets/backgrounds/space.jpg',
  'bg-nebula': '/assets/backgrounds/nebula.png',
  
  // Characters
  'char-hero': '/assets/characters/hero.png',
  'char-enemy': '/assets/characters/enemy.png',
  
  // UI
  'ui-button': '/assets/ui/button.png',
  'ui-panel': '/assets/ui/panel.png'
}
```

### Configuration Validation

Always validate your configuration:

```typescript
import { ConfigUtils } from './animation-library'

const validation = ConfigUtils.validateConfig(config)
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors)
} else {
  // Safe to use configuration
  const result = await engine.buildScene(app, config)
}
```

### Performance Checking

```typescript
import { PerformanceUtils } from './animation-library'

if (PerformanceUtils.isPerformanceIntensive(config)) {
  const recommendations = PerformanceUtils.getPerformanceRecommendations(config)
  console.warn('Performance recommendations:', recommendations)
  
  // Consider reducing complexity for mobile devices
  if (isMobileDevice()) {
    config = createMobileOptimizedConfig(config)
  }
}
```

This configuration guide provides the foundation for creating complex, performant animations with the Animation Logic Library. Experiment with different combinations to create unique visual experiences!