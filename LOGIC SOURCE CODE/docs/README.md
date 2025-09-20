# Animation Logic Library

A powerful, modular TypeScript animation library built on PixiJS for creating complex sprite animations and visual effects.

## 🚀 Overview

This library provides a comprehensive animation system with hardware-optimized performance, supporting:

- **Basic Transformations**: Position, scale, rotation with percentage-based coordinates
- **Rotation Animations**: RPM-based spinning with clockwise/counter-clockwise control
- **Orbital Motion**: Complex orbital mechanics around dynamic center points
- **Visual Effects**: Basic effects (fade, pulse, tilt) and advanced GPU-accelerated effects (glow, bloom, distort, shockwave)

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [API Reference](./API.md)
- [Configuration Guide](./Configuration.md)
- [Examples](./Examples.md)
- [Performance Guide](./Performance.md)
- [Advanced Usage](./Advanced.md)

## ⚡ Quick Start

### Installation

```bash
npm install pixi.js
# Copy the library files to your project
```

### Basic Usage

```typescript
import { LogicEngine } from './path-to-library'
import { Application } from 'pixi.js'

// Create PixiJS application
const app = new Application({
  width: 1024,
  height: 1024,
  backgroundColor: 0x1099bb
})

// Create engine
const engine = new LogicEngine()

// Define configuration
const config = {
  layersID: ['layer1', 'layer2'],
  imageRegistry: {
    'image1': 'path/to/image1.png',
    'image2': 'path/to/image2.png'
  },
  layers: [
    {
      id: 'layer1',
      imageRef: { kind: 'urlId', id: 'image1' },
      position: { xPct: 50, yPct: 50 },
      scale: { pct: 100 },
      angleDeg: 0,
      spinRPM: 10, // Rotate at 10 RPM
      effects: [
        { type: 'pulse', property: 'scale', amp: 0.1, periodMs: 1000 }
      ]
    }
  ]
}

// Build and start animation
const result = await engine.buildScene(app, config)
app.stage.addChild(result.container)
```

## 🏗️ Architecture

The library follows a modular processor architecture:

```
LogicEngine
├── BasicProcessor    - Transform operations
├── SpinLProcessor    - Rotation animations  
├── OrbitProcessor    - Orbital motion
└── EffectProcessor   - Visual effects
```

### Execution Flow

1. **Initialization**: Engine creates and initializes all processors
2. **Asset Loading**: Preloads images and creates sprites
3. **Processing Chain**: Each processor handles its specific animations
4. **Animation Loop**: RAF-based ticker updates all active animations
5. **Cleanup**: Proper resource disposal when finished

## 🔧 Core Concepts

### Processors

Each processor implements the `LogicProcessor` interface:

```typescript
interface LogicProcessor {
  init(ctx: BuildContext): void
  onResize?(ctx: BuildContext): void
  tick?(dt: number, ctx: BuildContext): void
  dispose?(): void
}
```

### Configuration-Driven

Animations are defined declaratively through configuration objects:

```typescript
type LayerConfig = {
  id: string
  imageRef: ImageRef
  position: { xPct: number; yPct: number }
  scale?: { pct?: number }
  angleDeg?: number
  spinRPM?: number
  orbitRPM?: number
  effects?: EffectConfig[]
}
```

### Hardware Optimization

The library automatically detects hardware capabilities and adjusts performance:

- **WebGL Detection**: Falls back to DOM rendering if needed
- **Memory Checking**: Optimizes effects based on available memory
- **CPU Detection**: Adjusts animation complexity based on cores

## 📊 Performance Features

- **Efficient RAF Ticker**: Minimizes garbage collection
- **Hardware Capability Detection**: Optimizes based on device capabilities  
- **Lazy Loading**: Only loads required assets
- **Smart Culling**: Disables animations for off-screen elements
- **Memory Management**: Proper cleanup and resource disposal

## 🎯 Use Cases

Perfect for:

- **Interactive Dashboards**: Animated data visualizations
- **Game UIs**: Dynamic interface elements
- **Digital Signage**: Eye-catching animated content
- **Educational Apps**: Interactive learning materials
- **Data Visualization**: Real-time animated charts and graphs

## 📖 Documentation Links

- **[API Reference](./API.md)** - Complete API documentation
- **[Configuration Guide](./Configuration.md)** - Detailed configuration options
- **[Examples](./Examples.md)** - Practical usage examples
- **[Performance Guide](./Performance.md)** - Optimization tips and best practices
- **[Advanced Usage](./Advanced.md)** - Advanced patterns and techniques

## 🤝 Contributing

This library was extracted and reorganized from a launcher application. All original functionality has been preserved while improving:

- Better separation of concerns
- Enhanced performance optimizations  
- Clearer documentation
- Easier testing and debugging
- Type safety improvements

## 📄 License

[Add your license information here]