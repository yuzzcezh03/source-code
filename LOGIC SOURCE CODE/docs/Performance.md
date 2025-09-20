# Performance Guide

Optimization strategies and best practices for the Animation Logic Library.

## Overview

The Animation Logic Library is designed for performance, but complex animations can still impact frame rates. This guide covers optimization strategies, performance monitoring, and hardware considerations.

## Performance Architecture

### Hardware Detection

The library automatically detects device capabilities:

```typescript
import { isWebGLAvailable, canUseAdvancedEffects, detectRenderer } from './library'

// Check hardware capabilities
const hasWebGL = isWebGLAvailable()
const canUseAdvanced = canUseAdvancedEffects()
const renderer = detectRenderer('auto')

console.log('WebGL available:', hasWebGL)
console.log('Advanced effects supported:', canUseAdvanced)
console.log('Recommended renderer:', renderer)
```

#### Capability Factors

**WebGL Detection:**
- Checks for WebGL2 and WebGL support
- Falls back to DOM rendering if unavailable

**Advanced Effects Eligibility:**
- Requires WebGL support
- Checks device memory (≥4GB recommended)
- Checks CPU cores (≥4 cores recommended)

**Renderer Selection:**
- `'pixi'`: Hardware-accelerated PixiJS rendering
- `'dom'`: Fallback DOM-based rendering
- `'auto'`: Automatic selection based on capabilities

### Animation Ticker

The library uses an efficient RequestAnimationFrame-based ticker:

```typescript
// Efficient RAF ticker with error handling
const ticker = createTicker()

ticker.add((deltaTime) => {
  // Update all animations
  updateAnimations(deltaTime)
})

ticker.start()
```

**Benefits:**
- Synchronized with display refresh rate
- Minimal garbage collection
- Automatic error recovery
- Proper cleanup on disposal

---

## Performance Monitoring

### Built-in Performance Analysis

```typescript
import { PerformanceUtils } from './library'

const config = {
  // Your animation configuration
}

// Check if configuration is performance-intensive
if (PerformanceUtils.isPerformanceIntensive(config)) {
  console.warn('Performance-intensive configuration detected')
  
  // Get specific recommendations
  const recommendations = PerformanceUtils.getPerformanceRecommendations(config)
  recommendations.forEach(rec => console.log('Recommendation:', rec))
}
```

#### Performance Metrics

**Intensive Configuration Indicators:**
- More than 10 animated layers
- More than 5 advanced effects
- Complex combinations of effects

**Common Recommendations:**
- "Consider reducing the number of animated layers"
- "Large number of layers may impact performance"
- "Advanced effects may not be supported on this device"

### Custom Performance Monitoring

```typescript
class PerformanceMonitor {
  private frameCount = 0
  private lastTime = Date.now()
  private fps = 60
  
  constructor(private engine: LogicEngine) {
    this.startMonitoring()
  }
  
  startMonitoring() {
    const monitor = () => {
      this.frameCount++
      const currentTime = Date.now()
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = this.frameCount
        this.frameCount = 0
        this.lastTime = currentTime
        
        this.checkPerformance()
      }
      
      requestAnimationFrame(monitor)
    }
    
    monitor()
  }
  
  checkPerformance() {
    if (this.fps < 30) {
      console.warn(`Low FPS detected: ${this.fps}`)
      this.suggestOptimizations()
    } else if (this.fps < 50) {
      console.log(`Moderate performance: ${this.fps} FPS`)
    }
  }
  
  suggestOptimizations() {
    // Automatically reduce quality
    const effectProcessor = this.engine.getProcessor(EffectProcessor)
    if (effectProcessor) {
      // Disable advanced effects for better performance
      console.log('Consider disabling advanced effects')
    }
  }
}
```

---

## Optimization Strategies

### 1. Layer Management

#### Minimize Layer Count

```typescript
// Bad: Too many individual layers
const badConfig = {
  layers: Array.from({ length: 50 }, (_, i) => ({
    id: `layer-${i}`,
    // ... configuration
  }))
}

// Good: Combine related elements
const goodConfig = {
  layers: [
    {
      id: 'background-group',
      // Multiple images composited into one
    },
    {
      id: 'main-animation',
      // Primary animated element
    },
    {
      id: 'effects-layer', 
      // Secondary animations
    }
  ]
}
```

#### Smart Z-Index Management

```typescript
// Good: Use numeric suffixes for automatic z-ordering
const layerIds = [
  'background-0',    // Lowest z-index
  'content-10',      // Middle layer
  'effects-20',      // Top layer
]

// The library automatically extracts z-index from IDs
```

### 2. Animation Optimization

#### RPM Limits

```typescript
// Good: Stay within optimal RPM ranges
const optimizedSpinning = {
  slowRotation: 5,     // 5 RPM for subtle movement
  mediumRotation: 15,  // 15 RPM for visible rotation
  fastRotation: 30,    // 30 RPM maximum for smooth animation
  maxRPM: 60          // Library maximum (avoid if possible)
}

// Bad: Excessive RPM values
const excessiveRPM = 100  // Will be clamped to 60, wastes CPU
```

#### Effect Selection

```typescript
// Performance impact hierarchy (low to high)
const effectPerformance = {
  low: ['fade', 'pulse', 'tilt'],
  medium: ['glow', 'bloom'],
  high: ['distort', 'shockwave']
}

// Good: Adaptive effect selection
function selectEffects(deviceCapabilities: any) {
  const effects = [
    { type: 'pulse', property: 'scale', amp: 0.05 }  // Always include basic
  ]
  
  if (deviceCapabilities.canUseAdvanced) {
    effects.push({ type: 'glow', color: 0x00aaff, alpha: 0.3 })
  }
  
  if (deviceCapabilities.highEnd) {
    effects.push({ type: 'bloom', strength: 0.4 })
  }
  
  return effects
}
```

### 3. Memory Management

#### Asset Optimization

```typescript
// Good: Appropriate image sizes
const imageOptimization = {
  small: '64x64',    // UI elements, small sprites
  medium: '256x256', // Standard game sprites
  large: '512x512',  // Background elements
  xlarge: '1024x1024' // Full backgrounds (use sparingly)
}

// Good: Format selection
const formatGuidance = {
  png: 'For images with transparency',
  jpg: 'For photos and complex images',
  webp: 'For modern browsers (best compression)'
}
```

#### Resource Cleanup

```typescript
class OptimizedAnimationManager {
  private engines: Map<string, LogicEngine> = new Map()
  
  async createScene(id: string, config: LogicConfig) {
    // Clean up existing scene first
    this.disposeScene(id)
    
    const engine = new LogicEngine()
    const result = await engine.buildScene(app, config)
    
    this.engines.set(id, engine)
    return result
  }
  
  disposeScene(id: string) {
    const engine = this.engines.get(id)
    if (engine) {
      engine.dispose() // Properly cleanup resources
      this.engines.delete(id)
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

### 4. Conditional Rendering

#### Viewport Culling

```typescript
class ViewportCulling {
  private visibleLayers = new Set<string>()
  
  updateVisibility(layers: BuiltLayer[]) {
    const viewport = this.getViewport()
    
    for (const layer of layers) {
      const sprite = layer.sprite
      const bounds = sprite.getBounds()
      
      const isVisible = this.intersects(bounds, viewport)
      
      if (isVisible && !this.visibleLayers.has(layer.id)) {
        // Enable animations for visible layer
        this.enableAnimations(layer.id)
        this.visibleLayers.add(layer.id)
      } else if (!isVisible && this.visibleLayers.has(layer.id)) {
        // Disable animations for off-screen layer
        this.disableAnimations(layer.id)
        this.visibleLayers.delete(layer.id)
      }
    }
  }
  
  private enableAnimations(layerId: string) {
    // Resume animations for this layer
  }
  
  private disableAnimations(layerId: string) {
    // Pause animations for this layer
  }
}
```

#### Distance-Based LOD

```typescript
class LevelOfDetail {
  updateLOD(layers: BuiltLayer[], cameraPosition: { x: number; y: number }) {
    for (const layer of layers) {
      const distance = this.calculateDistance(layer.sprite, cameraPosition)
      
      if (distance < 100) {
        // Close: Full quality
        this.setHighQuality(layer)
      } else if (distance < 300) {
        // Medium: Reduced effects
        this.setMediumQuality(layer)
      } else {
        // Far: Minimal animation
        this.setLowQuality(layer)
      }
    }
  }
  
  private setHighQuality(layer: BuiltLayer) {
    // Enable all effects and smooth animations
  }
  
  private setMediumQuality(layer: BuiltLayer) {
    // Disable advanced effects, keep basic animations
  }
  
  private setLowQuality(layer: BuiltLayer) {
    // Minimal or no animation
  }
}
```

---

## Device-Specific Optimizations

### Mobile Optimization

```typescript
const mobileOptimizations = {
  // Detect mobile devices
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  
  // Mobile-specific configuration
  getMobileConfig(baseConfig: LogicConfig): LogicConfig {
    const mobileConfig = JSON.parse(JSON.stringify(baseConfig)) // Deep clone
    
    // Reduce animation complexity
    mobileConfig.layers.forEach(layer => {
      // Limit RPM
      if (layer.spinRPM && layer.spinRPM > 20) {
        layer.spinRPM = 20
      }
      if (layer.orbitRPM && layer.orbitRPM > 15) {
        layer.orbitRPM = 15
      }
      
      // Remove advanced effects
      if (layer.effects) {
        layer.effects = layer.effects.filter(effect => 
          ['fade', 'pulse', 'tilt'].includes(effect.type)
        )
      }
    })
    
    return mobileConfig
  }
}

// Usage
const config = mobileOptimizations.isMobile 
  ? mobileOptimizations.getMobileConfig(baseConfig)
  : baseConfig
```

### Low-End Device Support

```typescript
class AdaptivePerformance {
  private performanceLevel: 'low' | 'medium' | 'high'
  
  constructor() {
    this.performanceLevel = this.detectPerformanceLevel()
  }
  
  private detectPerformanceLevel(): 'low' | 'medium' | 'high' {
    const memory = (navigator as any).deviceMemory || 4
    const cores = navigator.hardwareConcurrency || 4
    const hasWebGL = isWebGLAvailable()
    
    if (!hasWebGL || memory < 4 || cores < 4) {
      return 'low'
    } else if (memory < 8 || cores < 8) {
      return 'medium'
    } else {
      return 'high'
    }
  }
  
  adaptConfiguration(config: LogicConfig): LogicConfig {
    switch (this.performanceLevel) {
      case 'low':
        return this.getLowEndConfig(config)
      case 'medium':
        return this.getMediumEndConfig(config)
      case 'high':
        return config // Use full configuration
    }
  }
  
  private getLowEndConfig(config: LogicConfig): LogicConfig {
    return {
      ...config,
      layers: config.layers.map(layer => ({
        ...layer,
        spinRPM: layer.spinRPM ? Math.min(layer.spinRPM, 10) : layer.spinRPM,
        orbitRPM: layer.orbitRPM ? Math.min(layer.orbitRPM, 8) : layer.orbitRPM,
        effects: layer.effects?.filter(e => e.type === 'fade' || e.type === 'pulse') || []
      }))
    }
  }
  
  private getMediumEndConfig(config: LogicConfig): LogicConfig {
    return {
      ...config,
      layers: config.layers.map(layer => ({
        ...layer,
        spinRPM: layer.spinRPM ? Math.min(layer.spinRPM, 30) : layer.spinRPM,
        orbitRPM: layer.orbitRPM ? Math.min(layer.orbitRPM, 20) : layer.orbitRPM,
        effects: layer.effects?.filter(e => 
          !['distort', 'shockwave'].includes(e.type)
        ) || []
      }))
    }
  }
}
```

---

## Profiling and Debugging

### Performance Profiling

```typescript
class AnimationProfiler {
  private metrics = {
    renderTime: 0,
    animationTime: 0,
    effectTime: 0,
    frameCount: 0
  }
  
  startFrame() {
    this.frameStart = performance.now()
  }
  
  markRenderStart() {
    this.renderStart = performance.now()
  }
  
  markRenderEnd() {
    this.metrics.renderTime += performance.now() - this.renderStart
  }
  
  markAnimationStart() {
    this.animationStart = performance.now()
  }
  
  markAnimationEnd() {
    this.metrics.animationTime += performance.now() - this.animationStart
  }
  
  endFrame() {
    this.metrics.frameCount++
    
    if (this.metrics.frameCount % 60 === 0) {
      this.reportMetrics()
      this.resetMetrics()
    }
  }
  
  private reportMetrics() {
    console.log('Performance Metrics (60 frames):')
    console.log(`Render time: ${this.metrics.renderTime.toFixed(2)}ms`)
    console.log(`Animation time: ${this.metrics.animationTime.toFixed(2)}ms`)
    console.log(`Effect time: ${this.metrics.effectTime.toFixed(2)}ms`)
  }
  
  private resetMetrics() {
    this.metrics = {
      renderTime: 0,
      animationTime: 0, 
      effectTime: 0,
      frameCount: 0
    }
  }
}
```

### Debug Mode

```typescript
class DebugAnimationEngine extends LogicEngine {
  private debugMode = false
  private debugInfo = new Map<string, any>()
  
  enableDebug() {
    this.debugMode = true
    console.log('Animation debug mode enabled')
  }
  
  async buildScene(app: Application, config: LogicConfig) {
    if (this.debugMode) {
      console.time('Scene build time')
      this.logConfigurationInfo(config)
    }
    
    const result = await super.buildScene(app, config)
    
    if (this.debugMode) {
      console.timeEnd('Scene build time')
      this.logBuildResults(result)
    }
    
    return result
  }
  
  private logConfigurationInfo(config: LogicConfig) {
    console.group('Configuration Analysis')
    console.log(`Total layers: ${config.layers.length}`)
    console.log(`Images to load: ${Object.keys(config.imageRegistry).length}`)
    
    const animatedLayers = config.layers.filter(l => 
      l.spinRPM || l.orbitRPM || l.effects?.length
    )
    console.log(`Animated layers: ${animatedLayers.length}`)
    
    const effectCounts = config.layers.reduce((acc, layer) => {
      layer.effects?.forEach(effect => {
        acc[effect.type] = (acc[effect.type] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)
    
    console.log('Effect distribution:', effectCounts)
    console.groupEnd()
  }
  
  private logBuildResults(result: BuildResult) {
    console.group('Build Results')
    console.log(`Successfully built ${result.layers.length} layers`)
    
    result.layers.forEach(layer => {
      console.log(`Layer ${layer.id}:`, {
        position: { x: layer.sprite.x, y: layer.sprite.y },
        scale: layer.sprite.scale.x,
        rotation: layer.sprite.rotation
      })
    })
    
    console.groupEnd()
  }
}

// Usage
const debugEngine = new DebugAnimationEngine()
debugEngine.enableDebug()
```

---

## Best Practices Summary

### 1. Configuration Optimization

- **Validate configurations** before building scenes
- **Use performance utils** to check intensity
- **Adapt to device capabilities** automatically
- **Limit concurrent animations** based on hardware

### 2. Runtime Optimization

- **Monitor frame rates** and adjust quality dynamically  
- **Implement viewport culling** for off-screen elements
- **Use distance-based LOD** for large scenes
- **Clean up resources** properly when scenes change

### 3. Effect Management

- **Prefer basic effects** on low-end devices
- **Limit advanced effects** to essential elements
- **Use hardware detection** for automatic fallbacks
- **Consider effect combinations** and their cumulative impact

### 4. Asset Management

- **Optimize image sizes** for target devices
- **Use appropriate formats** (WebP when possible)
- **Preload critical assets** to avoid loading delays
- **Implement asset cleanup** to prevent memory leaks

### 5. Monitoring and Debugging

- **Use built-in performance analysis** tools
- **Implement custom monitoring** for production
- **Enable debug mode** during development
- **Profile regularly** on target devices

```typescript
// Example of comprehensive optimization
class OptimizedAnimationApp {
  private engine: LogicEngine
  private performanceAdapter: AdaptivePerformance
  private monitor: PerformanceMonitor
  
  async init() {
    this.performanceAdapter = new AdaptivePerformance()
    this.engine = new LogicEngine()
    
    // Adapt configuration to device
    const adaptedConfig = this.performanceAdapter.adaptConfiguration(baseConfig)
    
    // Validate before use
    const validation = ConfigUtils.validateConfig(adaptedConfig)
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`)
    }
    
    // Build scene
    const result = await this.engine.buildScene(app, adaptedConfig)
    
    // Start monitoring
    this.monitor = new PerformanceMonitor(this.engine)
    
    return result
  }
  
  dispose() {
    this.engine.dispose()
    this.monitor?.dispose()
  }
}
```

This approach ensures optimal performance across all device types while maintaining visual quality where possible.