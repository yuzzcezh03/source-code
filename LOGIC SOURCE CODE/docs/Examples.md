# Examples and Tutorials

Practical examples demonstrating how to use the Animation Logic Library for common use cases.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Simple Animations](#simple-animations)
- [Complex Scenes](#complex-scenes)
- [Interactive Examples](#interactive-examples)
- [Real-world Use Cases](#real-world-use-cases)
- [Advanced Techniques](#advanced-techniques)

---

## Basic Setup

### Minimal Example

```typescript
import { LogicEngine } from './animation-library'
import { Application } from 'pixi.js'

// Create PixiJS app
const app = new Application({
  width: 1024,
  height: 1024,
  backgroundColor: 0x222222
})
document.body.appendChild(app.view)

// Create animation engine
const engine = new LogicEngine()

// Simple configuration
const config = {
  layersID: ['spinner'],
  imageRegistry: {
    'gear': '/assets/gear.png'
  },
  layers: [
    {
      id: 'spinner',
      imageRef: { kind: 'urlId', id: 'gear' },
      position: { xPct: 50, yPct: 50 },
      spinRPM: 15,
      spinDir: 'cw'
    }
  ]
}

// Build and start
async function start() {
  const result = await engine.buildScene(app, config)
  app.stage.addChild(result.container)
}

start()
```

### With Error Handling

```typescript
async function createAnimatedScene() {
  try {
    // Validate configuration first
    const validation = ConfigUtils.validateConfig(config)
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`)
    }

    // Check performance implications
    if (PerformanceUtils.isPerformanceIntensive(config)) {
      console.warn('Performance intensive configuration detected')
      const recommendations = PerformanceUtils.getPerformanceRecommendations(config)
      console.log('Recommendations:', recommendations)
    }

    // Build scene
    const result = await engine.buildScene(app, config)
    app.stage.addChild(result.container)

    console.log(`Scene built with ${result.layers.length} layers`)
    
  } catch (error) {
    console.error('Failed to create scene:', error)
  }
}
```

---

## Simple Animations

### Rotating Elements

#### Basic Spinner

```typescript
const spinnerConfig = {
  layersID: ['spinner'],
  imageRegistry: {
    'wheel': '/assets/wheel.png'
  },
  layers: [
    {
      id: 'spinner',
      imageRef: { kind: 'urlId', id: 'wheel' },
      position: { xPct: 50, yPct: 50 },
      scale: { pct: 150 },
      spinRPM: 20,
      spinDir: 'cw'
    }
  ]
}
```

#### Multiple Speed Gears

```typescript
const gearsConfig = {
  layersID: ['big-gear', 'small-gear'],
  imageRegistry: {
    'gear-large': '/assets/gear-large.png',
    'gear-small': '/assets/gear-small.png'
  },
  layers: [
    {
      id: 'big-gear',
      imageRef: { kind: 'urlId', id: 'gear-large' },
      position: { xPct: 40, yPct: 50 },
      spinRPM: 10,
      spinDir: 'cw'
    },
    {
      id: 'small-gear',
      imageRef: { kind: 'urlId', id: 'gear-small' },
      position: { xPct: 60, yPct: 50 },
      scale: { pct: 60 },
      spinRPM: 25,  // Faster rotation for smaller gear
      spinDir: 'ccw'  // Opposite direction
    }
  ]
}
```

### Pulsing Effects

#### Breathing Animation

```typescript
const breathingConfig = {
  layersID: ['orb'],
  imageRegistry: {
    'orb': '/assets/magic-orb.png'
  },
  layers: [
    {
      id: 'orb',
      imageRef: { kind: 'urlId', id: 'orb' },
      position: { xPct: 50, yPct: 50 },
      effects: [
        {
          type: 'pulse',
          property: 'scale',
          amp: 0.15,           // 15% size variation
          periodMs: 3000,      // 3 second cycle
          phaseDeg: 0
        },
        {
          type: 'pulse',
          property: 'alpha',
          amp: 0.2,            // Alpha variation
          periodMs: 3000,      // Same period for sync
          phaseDeg: 90         // Quarter phase offset
        }
      ]
    }
  ]
}
```

### Orbital Motion

#### Planet System

```typescript
const planetConfig = {
  layersID: ['sun', 'earth', 'mars'],
  imageRegistry: {
    'sun': '/assets/sun.png',
    'earth': '/assets/earth.png',
    'mars': '/assets/mars.png'
  },
  layers: [
    {
      id: 'sun',
      imageRef: { kind: 'urlId', id: 'sun' },
      position: { xPct: 50, yPct: 50 },
      scale: { pct: 120 },
      spinRPM: 3  // Slow sun rotation
    },
    {
      id: 'earth',
      imageRef: { kind: 'urlId', id: 'earth' },
      position: { xPct: 70, yPct: 50 },
      orbitRPM: 12,
      orbitCenter: { xPct: 50, yPct: 50 },
      spinRPM: 24,  // Earth spins while orbiting
      orbitOrientPolicy: 'none'  // Keep original orientation
    },
    {
      id: 'mars',
      imageRef: { kind: 'urlId', id: 'mars' },
      position: { xPct: 80, yPct: 50 },
      scale: { pct: 80 },
      orbitRPM: 8,   // Slower orbit
      orbitCenter: { xPct: 50, yPct: 50 },
      orbitPhaseDeg: 180,  // Start opposite Earth
      spinRPM: 22
    }
  ]
}
```

---

## Complex Scenes

### Industrial Dashboard

```typescript
const dashboardConfig = {
  layersID: ['panel', 'gauge1', 'gauge2', 'indicator1', 'indicator2'],
  imageRegistry: {
    'control-panel': '/assets/control-panel.png',
    'gauge': '/assets/gauge.png',
    'status-light': '/assets/status-light.png'
  },
  layers: [
    {
      id: 'panel',
      imageRef: { kind: 'urlId', id: 'control-panel' },
      position: { xPct: 50, yPct: 50 }
    },
    {
      id: 'gauge1',
      imageRef: { kind: 'urlId', id: 'gauge' },
      position: { xPct: 30, yPct: 40 },
      spinRPM: 5,
      spinDir: 'cw',
      effects: [
        {
          type: 'glow',
          color: 0x00ff00,
          alpha: 0.3,
          scale: 0.1,
          pulseMs: 2000
        }
      ]
    },
    {
      id: 'gauge2',
      imageRef: { kind: 'urlId', id: 'gauge' },
      position: { xPct: 70, yPct: 40 },
      spinRPM: 8,
      spinDir: 'ccw',
      effects: [
        {
          type: 'glow',
          color: 0xff8800,
          alpha: 0.4,
          scale: 0.12
        }
      ]
    },
    {
      id: 'indicator1',
      imageRef: { kind: 'urlId', id: 'status-light' },
      position: { xPct: 25, yPct: 70 },
      scale: { pct: 60 },
      effects: [
        {
          type: 'pulse',
          property: 'alpha',
          amp: 0.3,
          periodMs: 1500
        }
      ]
    },
    {
      id: 'indicator2',
      imageRef: { kind: 'urlId', id: 'status-light' },
      position: { xPct: 75, yPct: 70 },
      scale: { pct: 60 },
      effects: [
        {
          type: 'pulse',
          property: 'alpha',
          amp: 0.4,
          periodMs: 800,
          phaseDeg: 180  // Out of phase with indicator1
        }
      ]
    }
  ]
}
```

### Space Scene

```typescript
const spaceConfig = {
  layersID: [
    'nebula-bg-0',
    'star-field-5', 
    'planet-main-10',
    'moon-orbit-15',
    'asteroid-belt-20',
    'ui-overlay-30'
  ],
  imageRegistry: {
    'nebula': '/assets/nebula-background.jpg',
    'stars': '/assets/star-field.png',
    'planet': '/assets/blue-planet.png',
    'moon': '/assets/rocky-moon.png',
    'asteroid': '/assets/asteroid.png',
    'ui-frame': '/assets/ui-frame.png'
  },
  layers: [
    {
      id: 'nebula-bg-0',
      imageRef: { kind: 'urlId', id: 'nebula' },
      position: { xPct: 50, yPct: 50 },
      scale: { pct: 110 },
      spinRPM: 0.2,
      effects: [
        {
          type: 'pulse',
          property: 'alpha',
          amp: 0.1,
          periodMs: 12000
        }
      ]
    },
    {
      id: 'star-field-5',
      imageRef: { kind: 'urlId', id: 'stars' },
      position: { xPct: 50, yPct: 50 },
      spinRPM: 0.5,
      effects: [
        {
          type: 'tilt',
          mode: 'time',
          axis: 'both',
          maxDeg: 2,
          periodMs: 20000
        }
      ]
    },
    {
      id: 'planet-main-10',
      imageRef: { kind: 'urlId', id: 'planet' },
      position: { xPct: 45, yPct: 55 },
      scale: { pct: 200 },
      spinRPM: 1.5,
      effects: [
        {
          type: 'glow',
          color: 0x4488ff,
          alpha: 0.25,
          scale: 0.08,
          pulseMs: 4000
        }
      ]
    },
    {
      id: 'moon-orbit-15',
      imageRef: { kind: 'urlId', id: 'moon' },
      position: { xPct: 65, yPct: 35 },
      scale: { pct: 40 },
      orbitRPM: 8,
      orbitCenter: { xPct: 45, yPct: 55 },
      orbitPhaseDeg: 30,
      spinRPM: 3,
      effects: [
        {
          type: 'pulse',
          property: 'scale',
          amp: 0.05,
          periodMs: 3000
        }
      ]
    },
    {
      id: 'asteroid-belt-20',
      imageRef: { kind: 'urlId', id: 'asteroid' },
      position: { xPct: 85, yPct: 25 },
      scale: { pct: 25 },
      orbitRPM: 15,
      orbitCenter: { xPct: 45, yPct: 55 },
      orbitPhaseDeg: 120,
      orbitOrientPolicy: 'auto',
      spinRPM: 45,
      effects: [
        {
          type: 'distort',
          ampPx: 1,
          speed: 0.3
        }
      ]
    },
    {
      id: 'ui-overlay-30',
      imageRef: { kind: 'urlId', id: 'ui-frame' },
      position: { xPct: 50, yPct: 50 },
      effects: [
        {
          type: 'fade',
          from: 0,
          to: 0.8,
          durationMs: 2000,
          loop: false,
          easing: 'sineInOut'
        }
      ]
    }
  ]
}
```

---

## Interactive Examples

### Mouse-Responsive Elements

```typescript
const interactiveConfig = {
  layersID: ['responsive-orb'],
  imageRegistry: {
    'orb': '/assets/interactive-orb.png'
  },
  layers: [
    {
      id: 'responsive-orb',
      imageRef: { kind: 'urlId', id: 'orb' },
      position: { xPct: 50, yPct: 50 },
      effects: [
        {
          type: 'tilt',
          mode: 'pointer',      // Responds to mouse/touch
          axis: 'both',
          maxDeg: 20
        },
        {
          type: 'pulse',
          property: 'scale',
          amp: 0.05,
          periodMs: 2000
        },
        {
          type: 'glow',
          color: 0x00ccff,
          alpha: 0.5,
          scale: 0.2,
          pulseMs: 3000
        }
      ]
    }
  ]
}
```

### Dynamic Control Example

```typescript
class InteractiveAnimation {
  private engine: LogicEngine
  private spinProcessor: SpinLProcessor
  
  constructor(app: Application) {
    this.engine = new LogicEngine()
  }
  
  async init() {
    const config = {
      layersID: ['controllable-spinner'],
      imageRegistry: {
        'spinner': '/assets/spinner.png'
      },
      layers: [
        {
          id: 'controllable-spinner',
          imageRef: { kind: 'urlId', id: 'spinner' },
          position: { xPct: 50, yPct: 50 },
          spinRPM: 10
        }
      ]
    }
    
    const result = await this.engine.buildScene(app, config)
    app.stage.addChild(result.container)
    
    this.spinProcessor = this.engine.getProcessor(SpinLProcessor)!
    this.setupControls()
  }
  
  setupControls() {
    // Speed control
    const speedSlider = document.getElementById('speed-slider') as HTMLInputElement
    speedSlider.addEventListener('input', () => {
      const rpm = parseInt(speedSlider.value)
      this.spinProcessor.updateRPM('controllable-spinner', rpm)
    })
    
    // Direction toggle
    const directionButton = document.getElementById('direction-btn')
    directionButton.addEventListener('click', () => {
      const currentItems = this.spinProcessor.getActiveItems()
      const item = currentItems.find(i => i.layerId === 'controllable-spinner')
      if (item) {
        const newDirection = item.direction === 1 ? 'ccw' : 'cw'
        this.spinProcessor.setDirection('controllable-spinner', newDirection)
      }
    })
    
    // Pause/Resume
    const pauseButton = document.getElementById('pause-btn')
    pauseButton.addEventListener('click', () => {
      this.spinProcessor.toggleSpin('controllable-spinner')
    })
  }
}

// Usage
const interactive = new InteractiveAnimation(app)
interactive.init()
```

---

## Real-world Use Cases

### Loading Spinner with Progress

```typescript
class LoadingAnimation {
  private engine: LogicEngine
  private effectProcessor: EffectProcessor
  
  async createLoadingSpinner() {
    const config = {
      layersID: ['spinner', 'progress-ring'],
      imageRegistry: {
        'spinner': '/assets/loading-spinner.png',
        'ring': '/assets/progress-ring.png'
      },
      layers: [
        {
          id: 'spinner',
          imageRef: { kind: 'urlId', id: 'spinner' },
          position: { xPct: 50, yPct: 50 },
          spinRPM: 30,
          effects: [
            {
              type: 'pulse',
              property: 'alpha',
              amp: 0.2,
              periodMs: 1000
            }
          ]
        },
        {
          id: 'progress-ring',
          imageRef: { kind: 'urlId', id: 'ring' },
          position: { xPct: 50, yPct: 50 },
          scale: { pct: 120 },
          effects: [
            {
              type: 'glow',
              color: 0x00ff88,
              alpha: 0.4,
              scale: 0.1
            }
          ]
        }
      ]
    }
    
    return await this.engine.buildScene(app, config)
  }
  
  updateProgress(percentage: number) {
    // Update visual feedback based on progress
    const alpha = 0.3 + (percentage / 100) * 0.7
    // Implementation would update the progress ring visibility
  }
}
```

### Data Visualization Gauges

```typescript
const gaugeConfig = {
  layersID: ['gauge-bg', 'needle', 'value-indicator'],
  imageRegistry: {
    'gauge-background': '/assets/gauge-bg.png',
    'gauge-needle': '/assets/needle.png',
    'value-dot': '/assets/value-dot.png'
  },
  layers: [
    {
      id: 'gauge-bg',
      imageRef: { kind: 'urlId', id: 'gauge-background' },
      position: { xPct: 50, yPct: 50 }
    },
    {
      id: 'needle',
      imageRef: { kind: 'urlId', id: 'gauge-needle' },
      position: { xPct: 50, yPct: 50 },
      // Needle can be controlled programmatically for data visualization
      angleDeg: -90,  // Start at top
      effects: [
        {
          type: 'pulse',
          property: 'scale',
          amp: 0.02,
          periodMs: 2000
        }
      ]
    },
    {
      id: 'value-indicator',
      imageRef: { kind: 'urlId', id: 'value-dot' },
      position: { xPct: 50, yPct: 25 },  // Top of gauge
      scale: { pct: 40 },
      effects: [
        {
          type: 'pulse',
          property: 'scale',
          amp: 0.1,
          periodMs: 1200
        }
      ]
    }
  ]
}
```

### Animated Logo Sequence

```typescript
const logoSequenceConfig = {
  layersID: ['logo-bg', 'logo-main', 'logo-accent'],
  imageRegistry: {
    'bg': '/assets/logo-bg.png',
    'main': '/assets/logo-main.png',
    'accent': '/assets/logo-accent.png'
  },
  layers: [
    {
      id: 'logo-bg',
      imageRef: { kind: 'urlId', id: 'bg' },
      position: { xPct: 50, yPct: 50 },
      effects: [
        {
          type: 'fade',
          from: 0,
          to: 1,
          durationMs: 1000,
          loop: false,
          easing: 'sineInOut'
        }
      ]
    },
    {
      id: 'logo-main',
      imageRef: { kind: 'urlId', id: 'main' },
      position: { xPct: 50, yPct: 50 },
      scale: { pct: 80 },
      effects: [
        {
          type: 'fade',
          from: 0,
          to: 1,
          durationMs: 1500,
          loop: false,
          easing: 'sineInOut'
        },
        {
          type: 'pulse',
          property: 'scale',
          amp: 0.03,
          periodMs: 4000
        }
      ]
    },
    {
      id: 'logo-accent',
      imageRef: { kind: 'urlId', id: 'accent' },
      position: { xPct: 50, yPct: 50 },
      spinRPM: 5,
      effects: [
        {
          type: 'glow',
          color: 0xffd700,
          alpha: 0.6,
          scale: 0.15,
          pulseMs: 2500
        },
        {
          type: 'fade',
          from: 0,
          to: 0.8,
          durationMs: 2000,
          loop: false,
          easing: 'sineInOut'
        }
      ]
    }
  ]
}
```

---

## Advanced Techniques

### Performance Monitoring

```typescript
class PerformanceOptimizedApp {
  private engine: LogicEngine
  private performanceMonitor: PerformanceMonitor
  
  async init() {
    // Check device capabilities
    const canUseAdvanced = canUseAdvancedEffects()
    
    // Adapt configuration based on capabilities
    const config = this.createAdaptiveConfig(canUseAdvanced)
    
    // Validate configuration
    const validation = ConfigUtils.validateConfig(config)
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`)
    }
    
    // Check performance implications
    if (PerformanceUtils.isPerformanceIntensive(config)) {
      console.warn('Performance intensive configuration')
      const recommendations = PerformanceUtils.getPerformanceRecommendations(config)
      console.log('Recommendations:', recommendations)
    }
    
    // Build scene
    this.engine = new LogicEngine()
    const result = await this.engine.buildScene(app, config)
    
    // Start performance monitoring
    this.performanceMonitor = new PerformanceMonitor(this.engine)
    
    return result
  }
  
  createAdaptiveConfig(canUseAdvanced: boolean) {
    const baseConfig = {
      layersID: ['spinner'],
      imageRegistry: { 'spinner': '/assets/spinner.png' },
      layers: [{
        id: 'spinner',
        imageRef: { kind: 'urlId', id: 'spinner' },
        position: { xPct: 50, yPct: 50 },
        spinRPM: 15,
        effects: [
          { type: 'pulse', property: 'scale', amp: 0.05, periodMs: 2000 }
        ]
      }]
    }
    
    // Add advanced effects if supported
    if (canUseAdvanced) {
      baseConfig.layers[0].effects.push({
        type: 'glow',
        color: 0x00aaff,
        alpha: 0.3,
        scale: 0.1
      })
    }
    
    return baseConfig
  }
}
```

### Multi-Scene Management

```typescript
class SceneManager {
  private engines = new Map<string, LogicEngine>()
  private currentScene: string | null = null
  
  async loadScene(sceneId: string, config: LogicConfig) {
    // Dispose existing scene
    if (this.engines.has(sceneId)) {
      this.engines.get(sceneId)!.dispose()
    }
    
    // Create new engine and scene
    const engine = new LogicEngine()
    const result = await engine.buildScene(app, config)
    
    this.engines.set(sceneId, engine)
    return result
  }
  
  async switchScene(fromSceneId: string, toSceneId: string) {
    // Fade out current scene
    if (this.currentScene && this.engines.has(this.currentScene)) {
      // Implementation would animate transition
    }
    
    this.currentScene = toSceneId
    
    // Fade in new scene
    // Implementation would animate transition
  }
  
  disposeScene(sceneId: string) {
    const engine = this.engines.get(sceneId)
    if (engine) {
      engine.dispose()
      this.engines.delete(sceneId)
    }
  }
  
  disposeAll() {
    for (const [id, engine] of this.engines) {
      engine.dispose()
    }
    this.engines.clear()
  }
}
```

### Custom Effect Creation

```typescript
// Example: Custom breathing effect that combines multiple basic effects
function createBreathingEffect(config: { 
  scaleAmp: number
  alphaAmp: number 
  periodMs: number 
}) {
  return [
    {
      type: 'pulse',
      property: 'scale',
      amp: config.scaleAmp,
      periodMs: config.periodMs,
      phaseDeg: 0
    },
    {
      type: 'pulse', 
      property: 'alpha',
      amp: config.alphaAmp,
      periodMs: config.periodMs,
      phaseDeg: 45  // Slightly offset phase
    }
  ]
}

// Usage
const breathingOrb = {
  id: 'breathing-orb',
  imageRef: { kind: 'urlId', id: 'orb' },
  position: { xPct: 50, yPct: 50 },
  effects: createBreathingEffect({
    scaleAmp: 0.1,
    alphaAmp: 0.15,
    periodMs: 3000
  })
}
```

These examples provide a comprehensive foundation for building sophisticated animations with the Animation Logic Library. Mix and match techniques to create unique visual experiences for your applications!