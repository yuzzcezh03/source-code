# API Reference

Complete API documentation for the Animation Logic Library.

## Core Classes

### LogicEngine

The main orchestrator class that manages all animation processors.

```typescript
class LogicEngine {
  constructor()
  async buildScene(app: Application, config: LogicConfig): Promise<BuildResult>
  getProcessor<T extends LogicProcessor>(ProcessorClass: new () => T): T | null
  dispose(): void
}
```

#### Methods

##### `buildScene(app, config)`

Creates an animated scene from configuration.

**Parameters:**
- `app: Application` - PixiJS application instance
- `config: LogicConfig` - Animation configuration

**Returns:** `Promise<BuildResult>`

**Example:**
```typescript
const result = await engine.buildScene(app, {
  layersID: ['layer1'],
  imageRegistry: { 'img1': 'path/to/image.png' },
  layers: [
    {
      id: 'layer1',
      imageRef: { kind: 'urlId', id: 'img1' },
      position: { xPct: 50, yPct: 50 }
    }
  ]
})
```

##### `getProcessor<T>(ProcessorClass)`

Retrieves a specific processor instance.

**Parameters:**
- `ProcessorClass` - The processor class constructor

**Returns:** `T | null`

**Example:**
```typescript
const basicProcessor = engine.getProcessor(BasicProcessor)
const spinProcessor = engine.getProcessor(SpinLProcessor)
```

##### `dispose()`

Cleans up all resources and stops animations.

```typescript
engine.dispose()
```

---

## Processors

### BasicProcessor

Handles fundamental sprite transformations.

```typescript
class BasicProcessor implements LogicProcessor {
  init(ctx: BuildContext): void
  onResize(ctx: BuildContext): void
  dispose(): void
  getTransform(layerId: string): BasicTransform | null
  updateTransform(layerId: string, transform: Partial<BasicTransform>): void
}
```

#### Types

```typescript
type BasicTransform = {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  zIndex: number
}
```

#### Methods

##### `getTransform(layerId)`

Gets the current transform for a layer.

```typescript
const transform = basicProcessor.getTransform('layer1')
console.log(transform.x, transform.y) // Current position
```

##### `updateTransform(layerId, transform)`

Updates transform properties for a layer.

```typescript
basicProcessor.updateTransform('layer1', {
  x: 100,
  y: 200,
  scaleX: 1.5
})
```

#### Utility Functions

##### `applyBasicTransform(app, sprite, cfg)`

Applies basic transform to a sprite.

```typescript
applyBasicTransform(app, sprite, {
  position: { xPct: 25, yPct: 75 },
  scale: { pct: 150 },
  angleDeg: 45
})
```

---

### SpinLProcessor

Manages rotation animations with RPM control.

```typescript
class SpinLProcessor implements LogicProcessor {
  init(ctx: BuildContext): void
  tick(deltaTime: number, ctx: BuildContext): void
  dispose(): void
  getRPM(sprite: Sprite): number
  updateRPM(layerId: string, rpm: number): void
  toggleSpin(layerId: string): void
  setDirection(layerId: string, direction: SpinDirection): void
  getActiveItems(): SpinItem[]
  reset(): void
}
```

#### Types

```typescript
type SpinDirection = 'cw' | 'ccw'

type SpinItem = {
  sprite: Sprite
  layerId: string
  baseRotation: number
  radPerSecond: number
  direction: 1 | -1
  rpm: number
  active: boolean
}
```

#### Methods

##### `updateRPM(layerId, rpm)`

Changes the rotation speed for a layer.

```typescript
spinProcessor.updateRPM('layer1', 30) // 30 RPM
```

##### `setDirection(layerId, direction)`

Changes rotation direction.

```typescript
spinProcessor.setDirection('layer1', 'ccw') // Counter-clockwise
```

##### `toggleSpin(layerId)`

Pauses/resumes rotation for a layer.

```typescript
spinProcessor.toggleSpin('layer1')
```

#### Utility Functions

##### `rpmToRadPerSecond(rpm)`

Converts RPM to radians per second.

```typescript
const radPerSec = rpmToRadPerSecond(60) // 6.28 rad/s
```

---

### OrbitProcessor

Controls orbital motion around center points.

```typescript
class OrbitProcessor implements LogicProcessor {
  init(ctx: BuildContext): void
  onResize(ctx: BuildContext): void
  tick(deltaTime: number, ctx: BuildContext): void
  dispose(): void
  getOrbitItem(layerId: string): OrbitItem | null
  updateRPM(layerId: string, rpm: number): void
  setDirection(layerId: string, direction: OrbitDirection): void
  updateCenter(layerId: string, centerPercent: { x: number; y: number }): void
  getActiveItems(): OrbitItem[]
}
```

#### Types

```typescript
type OrbitDirection = 'cw' | 'ccw'

type OrbitItem = {
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
```

#### Methods

##### `updateCenter(layerId, centerPercent)`

Changes the orbit center point.

```typescript
orbitProcessor.updateCenter('layer1', { x: 25, y: 75 })
```

##### `updateRPM(layerId, rpm)`

Changes orbital speed.

```typescript
orbitProcessor.updateRPM('layer1', 15) // 15 RPM orbit
```

#### Configuration

```typescript
// Layer config for orbital motion
{
  id: 'orbiting-element',
  orbitRPM: 10,
  orbitDir: 'cw',
  orbitCenter: { xPct: 50, yPct: 50 },
  orbitPhaseDeg: 0,
  orbitOrientPolicy: 'auto'
}
```

---

### EffectProcessor

Manages visual effects system.

```typescript
class EffectProcessor implements LogicProcessor {
  init(ctx: BuildContext): void
  tick(deltaTime: number, ctx: BuildContext): void
  dispose(): void
  getBasicEffectsForLayer(layerIndex: number): BasicEffectItem | null
  getAdvancedEffectsForLayer(layerIndex: number): AdvancedEffectItem | null
  getAllActiveEffects(): { basic: BasicEffectItem[]; advanced: AdvancedEffectItem[] }
}
```

#### Effect Types

##### Basic Effects

```typescript
// Fade effect
{
  type: 'fade',
  from: 1,
  to: 0.5,
  durationMs: 2000,
  loop: true,
  easing: 'sineInOut'
}

// Pulse effect  
{
  type: 'pulse',
  property: 'scale',
  amp: 0.1,
  periodMs: 1000,
  phaseDeg: 0
}

// Tilt effect
{
  type: 'tilt',
  mode: 'pointer',
  axis: 'both',
  maxDeg: 15
}
```

##### Advanced Effects

```typescript
// Glow effect
{
  type: 'glow',
  color: 0xffff00,
  alpha: 0.4,
  scale: 0.15,
  pulseMs: 1500
}

// Bloom effect
{
  type: 'bloom',
  strength: 0.6,
  threshold: 0.5
}

// Distort effect
{
  type: 'distort',
  ampPx: 2,
  speed: 0.5
}

// Shockwave effect
{
  type: 'shockwave',
  periodMs: 1200,
  maxScale: 1.3,
  fade: true
}
```

---

## Core Types

### LogicConfig

Main configuration object for the animation system.

```typescript
type LogicConfig = {
  layersID: string[]
  imageRegistry: Record<string, string>
  layers: LayerConfig[]
}
```

### LayerConfig

Configuration for individual animated layers.

```typescript
type LayerConfig = {
  id: string
  imageRef: ImageRef
  position: { xPct: number; yPct: number }
  scale?: { pct?: number }
  angleDeg?: number
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
```

### ImageRef

Reference to image assets.

```typescript
type ImageRef =
  | { kind: 'urlId'; id: string }
  | { kind: 'url'; url: string }
```

### BuildResult

Result of building an animated scene.

```typescript
type BuildResult = {
  container: Container
  layers: BuiltLayer[]
}
```

---

## Utility Functions

### Math Utilities

```typescript
// Angle conversion
toRad(degrees: number): number
toDeg(radians: number): number

// Clamping
clamp(n: number, min: number, max: number): number
clamp01(n: number): number
clampRpm60(v: unknown): number

// Interpolation
lerp(a: number, b: number, t: number): number

// Distance and rotation
distance(x1: number, y1: number, x2: number, y2: number): number
rotateVec(v: { x: number; y: number }, angle: number): { x: number; y: number }
```

### Configuration Utilities

```typescript
// Create default configurations
ConfigUtils.createDefaultLayer(id: string, imageId: string): LayerConfig
ConfigUtils.createDefaultConfig(): LogicConfig
ConfigUtils.validateConfig(config: LogicConfig): { valid: boolean; errors: string[] }
```

### Performance Utilities

```typescript
// Performance analysis
PerformanceUtils.isPerformanceIntensive(config: LogicConfig): boolean
PerformanceUtils.getPerformanceRecommendations(config: LogicConfig): string[]
```

### Capability Detection

```typescript
// Hardware detection
isWebGLAvailable(): boolean
detectRenderer(mode?: RendererMode): 'pixi' | 'dom'
canUseAdvancedEffects(): boolean
```