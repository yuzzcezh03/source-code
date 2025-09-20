# Advanced Usage Guide

Advanced patterns, techniques, and extensibility options for the Animation Logic Library.

## Table of Contents

- [Custom Processors](#custom-processors)
- [Advanced Animation Patterns](#advanced-animation-patterns)
- [Integration Patterns](#integration-patterns)
- [Extensibility](#extensibility)
- [Performance Optimization](#performance-optimization)
- [Debugging and Development](#debugging-and-development)

---

## Custom Processors

### Creating Custom Processors

The library's processor architecture allows for custom animation logic:

```typescript
import { LogicProcessor, BuildContext, LayerConfig } from './library'

class ParticleEffectProcessor implements LogicProcessor {
  private particles: ParticleSystem[] = []
  private elapsedTime = 0
  
  init(ctx: BuildContext): void {
    // Initialize particle systems for layers with particle configs
    for (const layer of ctx.layers) {
      const particleConfig = (layer.cfg as any).particles
      if (particleConfig) {
        const system = new ParticleSystem(layer.sprite, particleConfig)
        this.particles.push(system)
      }
    }
  }
  
  tick(deltaTime: number, ctx: BuildContext): void {
    this.elapsedTime += deltaTime
    
    for (const system of this.particles) {
      system.update(deltaTime, this.elapsedTime)
    }
  }
  
  onResize?(ctx: BuildContext): void {
    // Handle resize if needed
    for (const system of this.particles) {
      system.onResize(ctx.app.screen.width, ctx.app.screen.height)
    }
  }
  
  dispose(): void {
    for (const system of this.particles) {
      system.dispose()
    }
    this.particles.length = 0
  }
}

class ParticleSystem {
  private particles: Particle[] = []
  
  constructor(
    private sprite: Sprite,
    private config: ParticleConfig
  ) {
    this.createParticles()
  }
  
  private createParticles() {
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push(new Particle(this.sprite, this.config))
    }
  }
  
  update(deltaTime: number, elapsed: number) {
    for (const particle of this.particles) {
      particle.update(deltaTime, elapsed)
    }
  }
  
  onResize(width: number, height: number) {
    // Update particle bounds
  }
  
  dispose() {
    for (const particle of this.particles) {
      particle.dispose()
    }
    this.particles.length = 0
  }
}
```

### Extended LogicEngine

```typescript
class ExtendedLogicEngine extends LogicEngine {
  private customProcessors: LogicProcessor[] = []
  
  addCustomProcessor(processor: LogicProcessor): void {
    this.customProcessors.push(processor)
  }
  
  async buildScene(app: Application, config: LogicConfig): Promise<BuildResult> {
    // Call parent build
    const result = await super.buildScene(app, config)
    
    // Initialize custom processors
    const context = {
      app,
      container: result.container,
      cfg: config,
      layers: result.layers
    }
    
    for (const processor of this.customProcessors) {
      processor.init(context)
    }
    
    // Override the tick function to include custom processors
    this.overrideTicker(context)
    
    return result
  }
  
  private overrideTicker(context: BuildContext) {
    const ticker = this.getTicker() // Assume we have access to the ticker
    
    ticker.add((deltaTime) => {
      // Custom processors tick
      for (const processor of this.customProcessors) {
        processor.tick?.(deltaTime, context)
      }
    })
  }
  
  dispose(): void {
    // Dispose custom processors
    for (const processor of this.customProcessors) {
      processor.dispose?.()
    }
    this.customProcessors.length = 0
    
    // Call parent dispose
    super.dispose()
  }
}

// Usage
const extendedEngine = new ExtendedLogicEngine()
extendedEngine.addCustomProcessor(new ParticleEffectProcessor())

const result = await extendedEngine.buildScene(app, config)
```

---

## Advanced Animation Patterns

### State-Based Animation System

```typescript
class StateMachine {
  private currentState: string = 'idle'
  private states: Map<string, AnimationState> = new Map()
  private transitions: Map<string, string[]> = new Map()
  
  constructor(private engine: LogicEngine) {}
  
  addState(name: string, config: LogicConfig, transitions: string[] = []) {
    this.states.set(name, {
      name,
      config,
      isActive: false
    })
    this.transitions.set(name, transitions)
  }
  
  async transitionTo(stateName: string): Promise<void> {
    const validTransitions = this.transitions.get(this.currentState) || []
    
    if (!validTransitions.includes(stateName) && stateName !== this.currentState) {
      throw new Error(`Invalid transition from ${this.currentState} to ${stateName}`)
    }
    
    const state = this.states.get(stateName)
    if (!state) {
      throw new Error(`State ${stateName} not found`)
    }
    
    // Cleanup current state
    this.engine.dispose()
    
    // Apply new state
    await this.engine.buildScene(app, state.config)
    this.currentState = stateName
    
    console.log(`Transitioned to state: ${stateName}`)
  }
  
  getCurrentState(): string {
    return this.currentState
  }
}

// Usage
const stateMachine = new StateMachine(engine)

stateMachine.addState('loading', loadingConfig, ['dashboard', 'error'])
stateMachine.addState('dashboard', dashboardConfig, ['loading', 'settings'])
stateMachine.addState('settings', settingsConfig, ['dashboard'])
stateMachine.addState('error', errorConfig, ['loading'])

// Transition between states
await stateMachine.transitionTo('loading')
// ... later
await stateMachine.transitionTo('dashboard')
```

### Timeline-Based Animation

```typescript
class AnimationTimeline {
  private keyframes: Keyframe[] = []
  private duration: number = 0
  private currentTime: number = 0
  
  constructor(private engine: LogicEngine) {}
  
  addKeyframe(time: number, config: Partial<LayerConfig>, layerId: string) {
    this.keyframes.push({
      time,
      config,
      layerId
    })
    
    this.duration = Math.max(this.duration, time)
    this.keyframes.sort((a, b) => a.time - b.time)
  }
  
  update(deltaTime: number) {
    this.currentTime += deltaTime
    
    // Find active keyframes
    const activeKeyframes = this.keyframes.filter(kf => 
      kf.time <= this.currentTime && !kf.applied
    )
    
    for (const keyframe of activeKeyframes) {
      this.applyKeyframe(keyframe)
      keyframe.applied = true
    }
    
    // Loop if necessary
    if (this.currentTime >= this.duration) {
      this.reset()
    }
  }
  
  private applyKeyframe(keyframe: Keyframe) {
    const processor = this.engine.getProcessor(BasicProcessor)
    if (processor && keyframe.config.position) {
      // Apply position changes
      const transform = processor.getTransform(keyframe.layerId)
      if (transform) {
        processor.updateTransform(keyframe.layerId, {
          x: keyframe.config.position.xPct,
          y: keyframe.config.position.yPct
        })
      }
    }
    
    // Apply other property changes...
  }
  
  reset() {
    this.currentTime = 0
    this.keyframes.forEach(kf => kf.applied = false)
  }
  
  seek(time: number) {
    this.currentTime = time
    
    // Reset and apply all keyframes up to this time
    this.keyframes.forEach(kf => kf.applied = false)
    const applicableKeyframes = this.keyframes.filter(kf => kf.time <= time)
    
    for (const keyframe of applicableKeyframes) {
      this.applyKeyframe(keyframe)
      keyframe.applied = true
    }
  }
}

interface Keyframe {
  time: number
  config: Partial<LayerConfig>
  layerId: string
  applied?: boolean
}
```

### Physics-Based Animation

```typescript
class PhysicsProcessor implements LogicProcessor {
  private bodies: PhysicsBody[] = []
  private gravity = { x: 0, y: 9.8 }
  private damping = 0.99
  
  init(ctx: BuildContext): void {
    for (const layer of ctx.layers) {
      const physicsConfig = (layer.cfg as any).physics
      if (physicsConfig) {
        const body = new PhysicsBody(layer.sprite, physicsConfig)
        this.bodies.push(body)
      }
    }
  }
  
  tick(deltaTime: number, ctx: BuildContext): void {
    for (const body of this.bodies) {
      this.updatePhysics(body, deltaTime)
    }
    
    this.handleCollisions()
  }
  
  private updatePhysics(body: PhysicsBody, deltaTime: number) {
    // Apply gravity
    body.velocity.x += this.gravity.x * deltaTime
    body.velocity.y += this.gravity.y * deltaTime
    
    // Apply damping
    body.velocity.x *= this.damping
    body.velocity.y *= this.damping
    
    // Update position
    body.sprite.x += body.velocity.x * deltaTime
    body.sprite.y += body.velocity.y * deltaTime
    
    // Bounce off screen edges
    const bounds = body.sprite.getBounds()
    if (bounds.left < 0 || bounds.right > app.screen.width) {
      body.velocity.x *= -0.8 // Bounce with energy loss
    }
    if (bounds.top < 0 || bounds.bottom > app.screen.height) {
      body.velocity.y *= -0.8
    }
  }
  
  private handleCollisions() {
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const bodyA = this.bodies[i]
        const bodyB = this.bodies[j]
        
        if (this.checkCollision(bodyA, bodyB)) {
          this.resolveCollision(bodyA, bodyB)
        }
      }
    }
  }
  
  private checkCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): boolean {
    const boundsA = bodyA.sprite.getBounds()
    const boundsB = bodyB.sprite.getBounds()
    
    return boundsA.intersects(boundsB)
  }
  
  private resolveCollision(bodyA: PhysicsBody, bodyB: PhysicsBody) {
    // Simple elastic collision
    const tempVelX = bodyA.velocity.x
    const tempVelY = bodyA.velocity.y
    
    bodyA.velocity.x = bodyB.velocity.x * 0.8
    bodyA.velocity.y = bodyB.velocity.y * 0.8
    bodyB.velocity.x = tempVelX * 0.8
    bodyB.velocity.y = tempVelY * 0.8
  }
  
  dispose(): void {
    this.bodies.length = 0
  }
}

class PhysicsBody {
  velocity = { x: 0, y: 0 }
  mass = 1
  
  constructor(
    public sprite: Sprite,
    public config: PhysicsConfig
  ) {
    this.mass = config.mass || 1
    this.velocity = { ...config.initialVelocity } || { x: 0, y: 0 }
  }
}

interface PhysicsConfig {
  mass?: number
  initialVelocity?: { x: number; y: number }
  bounciness?: number
}
```

---

## Integration Patterns

### React Integration

```typescript
import React, { useEffect, useRef, useState } from 'react'
import { Application } from 'pixi.js'
import { LogicEngine } from './animation-library'

interface AnimatedCanvasProps {
  config: LogicConfig
  width?: number
  height?: number
  onSceneReady?: (result: BuildResult) => void
}

export const AnimatedCanvas: React.FC<AnimatedCanvasProps> = ({
  config,
  width = 1024,
  height = 1024,
  onSceneReady
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const engineRef = useRef<LogicEngine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let mounted = true
    
    const initializeAnimation = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Cleanup existing app
        if (appRef.current) {
          appRef.current.destroy(true)
          appRef.current = null
        }
        
        if (engineRef.current) {
          engineRef.current.dispose()
          engineRef.current = null
        }
        
        // Create new app and engine
        const app = new Application({
          width,
          height,
          backgroundColor: 0x000000,
          antialias: true
        })
        
        const engine = new LogicEngine()
        
        // Build scene
        const result = await engine.buildScene(app, config)
        
        if (!mounted) return // Component unmounted during async operation
        
        // Attach to DOM
        if (canvasRef.current) {
          canvasRef.current.innerHTML = ''
          canvasRef.current.appendChild(app.view as any)
        }
        
        app.stage.addChild(result.container)
        
        appRef.current = app
        engineRef.current = engine
        
        onSceneReady?.(result)
        setLoading(false)
        
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setLoading(false)
        }
      }
    }
    
    initializeAnimation()
    
    return () => {
      mounted = false
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
      if (engineRef.current) {
        engineRef.current.dispose()
        engineRef.current = null
      }
    }
  }, [config, width, height])
  
  // Provide control methods
  const controls = {
    getEngine: () => engineRef.current,
    getApp: () => appRef.current,
    pause: () => {
      const spinProcessor = engineRef.current?.getProcessor(SpinLProcessor)
      spinProcessor?.getActiveItems().forEach(item => {
        spinProcessor.toggleSpin(item.layerId)
      })
    },
    resume: () => {
      // Similar to pause but resume
    }
  }
  
  return (
    <div>
      <div ref={canvasRef} style={{ width, height }} />
      {loading && <div>Loading animation...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  )
}

// Usage in React component
const MyComponent = () => {
  const [animationConfig, setAnimationConfig] = useState(defaultConfig)
  
  const handleSceneReady = (result: BuildResult) => {
    console.log('Animation ready with', result.layers.length, 'layers')
  }
  
  return (
    <div>
      <h1>My Animated App</h1>
      <AnimatedCanvas 
        config={animationConfig}
        width={800}
        height={600}
        onSceneReady={handleSceneReady}
      />
      <button onClick={() => setAnimationConfig(newConfig)}>
        Change Animation
      </button>
    </div>
  )
}
```

### Vue Integration

```typescript
import { defineComponent, ref, onMounted, onUnmounted, watch } from 'vue'
import { Application } from 'pixi.js'
import { LogicEngine } from './animation-library'

export default defineComponent({
  name: 'AnimatedCanvas',
  props: {
    config: {
      type: Object as PropType<LogicConfig>,
      required: true
    },
    width: {
      type: Number,
      default: 1024
    },
    height: {
      type: Number,
      default: 1024
    }
  },
  emits: ['scene-ready', 'error'],
  setup(props, { emit }) {
    const canvasContainer = ref<HTMLDivElement>()
    const app = ref<Application | null>(null)
    const engine = ref<LogicEngine | null>(null)
    const loading = ref(true)
    
    const initializeAnimation = async () => {
      try {
        loading.value = true
        
        // Cleanup
        if (app.value) {
          app.value.destroy(true)
          app.value = null
        }
        
        if (engine.value) {
          engine.value.dispose()
          engine.value = null
        }
        
        // Initialize
        app.value = new Application({
          width: props.width,
          height: props.height,
          backgroundColor: 0x000000
        })
        
        engine.value = new LogicEngine()
        
        const result = await engine.value.buildScene(app.value, props.config)
        
        if (canvasContainer.value) {
          canvasContainer.value.innerHTML = ''
          canvasContainer.value.appendChild(app.value.view as any)
        }
        
        app.value.stage.addChild(result.container)
        
        emit('scene-ready', result)
        loading.value = false
        
      } catch (error) {
        emit('error', error)
        loading.value = false
      }
    }
    
    onMounted(() => {
      initializeAnimation()
    })
    
    onUnmounted(() => {
      if (app.value) {
        app.value.destroy(true)
      }
      if (engine.value) {
        engine.value.dispose()
      }
    })
    
    // Watch for config changes
    watch(() => props.config, () => {
      initializeAnimation()
    }, { deep: true })
    
    return {
      canvasContainer,
      loading,
      engine,
      app
    }
  },
  
  template: `
    <div>
      <div ref="canvasContainer" :style="{ width: width + 'px', height: height + 'px' }"></div>
      <div v-if="loading">Loading animation...</div>
    </div>
  `
})
```

### Node.js/Electron Integration

```typescript
// For server-side rendering or Electron apps
import { Application } from 'pixi.js'
import { LogicEngine } from './animation-library'

class ServerSideAnimation {
  private app: Application
  private engine: LogicEngine
  private canvas: any
  
  constructor(width: number = 1024, height: number = 1024) {
    // Setup for headless rendering
    const { createCanvas } = require('canvas')
    this.canvas = createCanvas(width, height)
    
    this.app = new Application({
      width,
      height,
      view: this.canvas,
      resolution: 1
    })
    
    this.engine = new LogicEngine()
  }
  
  async buildScene(config: LogicConfig) {
    const result = await this.engine.buildScene(this.app, config)
    this.app.stage.addChild(result.container)
    return result
  }
  
  async exportFrame(): Promise<Buffer> {
    // Render current frame
    this.app.render()
    
    // Export as image buffer
    return this.canvas.toBuffer('image/png')
  }
  
  async exportAnimation(duration: number, fps: number = 30): Promise<Buffer[]> {
    const frames: Buffer[] = []
    const frameTime = 1000 / fps
    const totalFrames = Math.ceil(duration * fps / 1000)
    
    for (let i = 0; i < totalFrames; i++) {
      // Update animation
      this.app.ticker.update(frameTime)
      
      // Render and capture frame
      const frameBuffer = await this.exportFrame()
      frames.push(frameBuffer)
    }
    
    return frames
  }
  
  dispose() {
    this.engine.dispose()
    this.app.destroy(true)
  }
}

// Usage in Electron main process
const animation = new ServerSideAnimation(800, 600)
await animation.buildScene(myConfig)

// Export single frame
const frameBuffer = await animation.exportFrame()
fs.writeFileSync('frame.png', frameBuffer)

// Export animation frames
const frames = await animation.exportAnimation(5000) // 5 seconds
frames.forEach((frame, index) => {
  fs.writeFileSync(`frame_${index.toString().padStart(4, '0')}.png`, frame)
})
```

---

## Extensibility

### Plugin System

```typescript
interface AnimationPlugin {
  name: string
  version: string
  install(engine: LogicEngine): void
  uninstall(engine: LogicEngine): void
}

class PluginManager {
  private plugins: Map<string, AnimationPlugin> = new Map()
  
  register(plugin: AnimationPlugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`)
    }
    
    this.plugins.set(plugin.name, plugin)
  }
  
  install(pluginName: string, engine: LogicEngine) {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`)
    }
    
    plugin.install(engine)
    console.log(`Plugin ${pluginName} v${plugin.version} installed`)
  }
  
  uninstall(pluginName: string, engine: LogicEngine) {
    const plugin = this.plugins.get(pluginName)
    if (plugin) {
      plugin.uninstall(engine)
      console.log(`Plugin ${pluginName} uninstalled`)
    }
  }
  
  listPlugins(): string[] {
    return Array.from(this.plugins.keys())
  }
}

// Example plugin
class AudioVisualizerPlugin implements AnimationPlugin {
  name = 'audio-visualizer'
  version = '1.0.0'
  
  private audioProcessor?: AudioVisualizerProcessor
  
  install(engine: LogicEngine) {
    this.audioProcessor = new AudioVisualizerProcessor()
    // Add to engine's custom processors
    ;(engine as any).addCustomProcessor(this.audioProcessor)
  }
  
  uninstall(engine: LogicEngine) {
    if (this.audioProcessor) {
      this.audioProcessor.dispose()
      // Remove from engine
    }
  }
}

class AudioVisualizerProcessor implements LogicProcessor {
  private audioContext?: AudioContext
  private analyser?: AnalyserNode
  private dataArray?: Uint8Array
  
  init(ctx: BuildContext): void {
    // Setup Web Audio API
    this.setupAudioContext()
  }
  
  tick(deltaTime: number, ctx: BuildContext): void {
    if (!this.analyser || !this.dataArray) return
    
    // Get audio data
    this.analyser.getByteFrequencyData(this.dataArray)
    
    // Update visualizations based on audio data
    this.updateVisualizations(ctx, this.dataArray)
  }
  
  private setupAudioContext() {
    this.audioContext = new AudioContext()
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 256
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
  }
  
  private updateVisualizations(ctx: BuildContext, audioData: Uint8Array) {
    // Update layer properties based on audio frequency data
    ctx.layers.forEach((layer, index) => {
      if (index < audioData.length) {
        const intensity = audioData[index] / 255
        layer.sprite.scale.set(1 + intensity * 0.5)
      }
    })
  }
  
  dispose(): void {
    this.audioContext?.close()
  }
}

// Usage
const pluginManager = new PluginManager()
pluginManager.register(new AudioVisualizerPlugin())

const engine = new LogicEngine()
pluginManager.install('audio-visualizer', engine)
```

### Custom Configuration Extensions

```typescript
// Extend the base configuration types
interface ExtendedLayerConfig extends LayerConfig {
  // Add custom properties
  particles?: ParticleConfig
  physics?: PhysicsConfig
  audio?: AudioConfig
  customData?: Record<string, any>
}

interface ExtendedLogicConfig extends LogicConfig {
  layers: ExtendedLayerConfig[]
  // Add global extensions
  globalEffects?: GlobalEffectConfig[]
  environmentSettings?: EnvironmentConfig
}

// Configuration validation extensions
class ExtendedConfigUtils extends ConfigUtils {
  static validateExtendedConfig(config: ExtendedLogicConfig): ValidationResult {
    // First run base validation
    const baseResult = super.validateConfig(config)
    if (!baseResult.valid) {
      return baseResult
    }
    
    // Add extended validations
    const errors: string[] = []
    
    for (const layer of config.layers) {
      if (layer.particles) {
        if (!layer.particles.count || layer.particles.count <= 0) {
          errors.push(`Layer ${layer.id}: particle count must be positive`)
        }
      }
      
      if (layer.physics) {
        if (layer.physics.mass !== undefined && layer.physics.mass <= 0) {
          errors.push(`Layer ${layer.id}: physics mass must be positive`)
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: [...baseResult.errors, ...errors]
    }
  }
}
```

---

## Performance Optimization

### Advanced Culling System

```typescript
class AdvancedCullingSystem {
  private visibilityMap = new Map<string, boolean>()
  private frustum: Frustum
  private lodLevels = new Map<string, number>()
  
  constructor(private camera: Camera) {
    this.frustum = new Frustum(camera)
  }
  
  updateCulling(layers: BuiltLayer[]) {
    for (const layer of layers) {
      const wasVisible = this.visibilityMap.get(layer.id) || false
      const isVisible = this.isVisible(layer)
      const lodLevel = this.calculateLOD(layer)
      
      if (isVisible !== wasVisible) {
        this.toggleLayerVisibility(layer, isVisible)
        this.visibilityMap.set(layer.id, isVisible)
      }
      
      if (isVisible) {
        this.updateLOD(layer, lodLevel)
      }
    }
  }
  
  private isVisible(layer: BuiltLayer): boolean {
    const bounds = layer.sprite.getBounds()
    return this.frustum.intersectsBounds(bounds)
  }
  
  private calculateLOD(layer: BuiltLayer): number {
    const distance = this.camera.distanceToSprite(layer.sprite)
    
    if (distance < 100) return 0      // High detail
    else if (distance < 300) return 1  // Medium detail
    else if (distance < 600) return 2  // Low detail
    else return 3                      // Minimal detail
  }
  
  private toggleLayerVisibility(layer: BuiltLayer, visible: boolean) {
    layer.sprite.visible = visible
    
    // Toggle animations based on visibility
    if (visible) {
      this.enableAnimations(layer.id)
    } else {
      this.disableAnimations(layer.id)
    }
  }
  
  private updateLOD(layer: BuiltLayer, level: number) {
    const currentLevel = this.lodLevels.get(layer.id) || 0
    if (currentLevel === level) return
    
    this.lodLevels.set(layer.id, level)
    
    switch (level) {
      case 0: // High detail
        this.setHighDetailMode(layer)
        break
      case 1: // Medium detail
        this.setMediumDetailMode(layer)
        break
      case 2: // Low detail
        this.setLowDetailMode(layer)
        break
      case 3: // Minimal detail
        this.setMinimalDetailMode(layer)
        break
    }
  }
  
  private setHighDetailMode(layer: BuiltLayer) {
    // Enable all effects and smooth animations
    layer.sprite.alpha = 1
    // Enable advanced effects if available
  }
  
  private setMediumDetailMode(layer: BuiltLayer) {
    // Reduce effect quality
    layer.sprite.alpha = 1
    // Disable some advanced effects
  }
  
  private setLowDetailMode(layer: BuiltLayer) {
    // Basic animations only
    layer.sprite.alpha = 0.8
    // Disable most effects
  }
  
  private setMinimalDetailMode(layer: BuiltLayer) {
    // Static sprite only
    layer.sprite.alpha = 0.6
    // Disable all animations
  }
}

class Frustum {
  constructor(private camera: Camera) {}
  
  intersectsBounds(bounds: Rectangle): boolean {
    // Implement frustum culling logic
    return this.camera.viewport.intersects(bounds)
  }
}

class Camera {
  position = { x: 0, y: 0 }
  viewport = new Rectangle(0, 0, 1024, 1024)
  
  distanceToSprite(sprite: Sprite): number {
    const dx = sprite.x - this.position.x
    const dy = sprite.y - this.position.y
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  updateViewport(x: number, y: number, width: number, height: number) {
    this.viewport.x = x
    this.viewport.y = y
    this.viewport.width = width
    this.viewport.height = height
  }
}
```

### Memory Pool System

```typescript
class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  
  constructor(
    createFunction: () => T,
    resetFunction: (obj: T) => void,
    initialSize: number = 10
  ) {
    this.createFn = createFunction
    this.resetFn = resetFunction
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    } else {
      return this.createFn()
    }
  }
  
  release(obj: T) {
    this.resetFn(obj)
    this.pool.push(obj)
  }
  
  size(): number {
    return this.pool.length
  }
}

// Usage for particle systems
class PooledParticleSystem {
  private particlePool = new ObjectPool(
    () => new Particle(),
    (particle) => particle.reset(),
    100
  )
  
  private activeParticles: Particle[] = []
  
  createParticle(): Particle {
    const particle = this.particlePool.acquire()
    this.activeParticles.push(particle)
    return particle
  }
  
  destroyParticle(particle: Particle) {
    const index = this.activeParticles.indexOf(particle)
    if (index !== -1) {
      this.activeParticles.splice(index, 1)
      this.particlePool.release(particle)
    }
  }
  
  update(deltaTime: number) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i]
      particle.update(deltaTime)
      
      if (particle.isDead()) {
        this.destroyParticle(particle)
      }
    }
  }
}

class Particle {
  position = { x: 0, y: 0 }
  velocity = { x: 0, y: 0 }
  life = 1
  maxLife = 1
  
  update(deltaTime: number) {
    this.position.x += this.velocity.x * deltaTime
    this.position.y += this.velocity.y * deltaTime
    this.life -= deltaTime
  }
  
  isDead(): boolean {
    return this.life <= 0
  }
  
  reset() {
    this.position = { x: 0, y: 0 }
    this.velocity = { x: 0, y: 0 }
    this.life = this.maxLife
  }
}
```

---

## Debugging and Development

### Advanced Debug Console

```typescript
class DebugConsole {
  private element: HTMLElement
  private logs: string[] = []
  private isVisible = false
  
  constructor() {
    this.createElement()
    this.attachKeyboardListener()
  }
  
  private createElement() {
    this.element = document.createElement('div')
    this.element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 400px;
      height: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      overflow-y: auto;
      z-index: 10000;
      display: none;
    `
    document.body.appendChild(this.element)
  }
  
  private attachKeyboardListener() {
    document.addEventListener('keydown', (e) => {
      if (e.key === '`' && e.ctrlKey) {
        this.toggle()
      }
    })
  }
  
  log(message: string, type: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    const coloredMessage = `<span style="color: ${this.getColor(type)}">[${timestamp}] ${message}</span>`
    
    this.logs.push(coloredMessage)
    if (this.logs.length > 100) {
      this.logs.shift()
    }
    
    this.updateDisplay()
  }
  
  private getColor(type: string): string {
    switch (type) {
      case 'error': return '#ff4444'
      case 'warn': return '#ffaa00'
      default: return '#00ff00'
    }
  }
  
  private updateDisplay() {
    if (this.isVisible) {
      this.element.innerHTML = this.logs.join('<br>')
      this.element.scrollTop = this.element.scrollHeight
    }
  }
  
  toggle() {
    this.isVisible = !this.isVisible
    this.element.style.display = this.isVisible ? 'block' : 'none'
    if (this.isVisible) {
      this.updateDisplay()
    }
  }
  
  clear() {
    this.logs = []
    this.updateDisplay()
  }
}

// Enhanced debug engine
class DebugLogicEngine extends LogicEngine {
  private debugConsole = new DebugConsole()
  private performanceMetrics = new Map<string, number>()
  
  async buildScene(app: Application, config: LogicConfig): Promise<BuildResult> {
    this.debugConsole.log('Starting scene build...')
    
    const startTime = performance.now()
    
    try {
      const result = await super.buildScene(app, config)
      
      const buildTime = performance.now() - startTime
      this.debugConsole.log(`Scene built in ${buildTime.toFixed(2)}ms`)
      this.debugConsole.log(`Created ${result.layers.length} layers`)
      
      // Log processor states
      this.logProcessorStates()
      
      return result
      
    } catch (error) {
      this.debugConsole.log(`Build failed: ${error}`, 'error')
      throw error
    }
  }
  
  private logProcessorStates() {
    const spin = this.getProcessor(SpinLProcessor)
    if (spin) {
      const activeSpins = spin.getActiveItems()
      this.debugConsole.log(`SpinL: ${activeSpins.length} active items`)
    }
    
    const orbit = this.getProcessor(OrbitProcessor)
    if (orbit) {
      const activeOrbits = orbit.getActiveItems()
      this.debugConsole.log(`Orbit: ${activeOrbits.length} active items`)
    }
  }
  
  logPerformanceMetric(name: string, value: number) {
    this.performanceMetrics.set(name, value)
    this.debugConsole.log(`${name}: ${value.toFixed(2)}`)
  }
  
  getPerformanceMetrics() {
    return new Map(this.performanceMetrics)
  }
}
```

### Inspector Tool

```typescript
class AnimationInspector {
  private selectedLayer: BuiltLayer | null = null
  private panel: HTMLElement
  
  constructor(private engine: LogicEngine) {
    this.createInspectorPanel()
  }
  
  private createInspectorPanel() {
    this.panel = document.createElement('div')
    this.panel.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      width: 300px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #ccc;
      padding: 15px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 9999;
      max-height: 500px;
      overflow-y: auto;
    `
    document.body.appendChild(this.panel)
    
    this.updatePanel()
  }
  
  selectLayer(layerId: string) {
    // Find layer by ID
    const context = (this.engine as any).context
    if (context) {
      this.selectedLayer = context.layers.find((l: BuiltLayer) => l.id === layerId) || null
      this.updatePanel()
    }
  }
  
  private updatePanel() {
    if (!this.selectedLayer) {
      this.panel.innerHTML = `
        <h3>Animation Inspector</h3>
        <p>No layer selected</p>
        <div id="layer-list"></div>
      `
      this.updateLayerList()
      return
    }
    
    const layer = this.selectedLayer
    const sprite = layer.sprite
    
    this.panel.innerHTML = `
      <h3>Layer: ${layer.id}</h3>
      
      <h4>Transform</h4>
      <div>Position: (${sprite.x.toFixed(1)}, ${sprite.y.toFixed(1)})</div>
      <div>Scale: (${sprite.scale.x.toFixed(2)}, ${sprite.scale.y.toFixed(2)})</div>
      <div>Rotation: ${(sprite.rotation * 180 / Math.PI).toFixed(1)}°</div>
      <div>Alpha: ${sprite.alpha.toFixed(2)}</div>
      
      <h4>Configuration</h4>
      <pre>${JSON.stringify(layer.cfg, null, 2)}</pre>
      
      <h4>Controls</h4>
      <div id="controls"></div>
    `
    
    this.addControls()
  }
  
  private addControls() {
    const controlsDiv = this.panel.querySelector('#controls')
    if (!controlsDiv || !this.selectedLayer) return
    
    const cfg = this.selectedLayer.cfg
    
    // Spin controls
    if (cfg.spinRPM !== undefined) {
      const spinControl = this.createSlider('Spin RPM', cfg.spinRPM || 0, 0, 60, (value) => {
        const spinProcessor = this.engine.getProcessor(SpinLProcessor)
        spinProcessor?.updateRPM(this.selectedLayer!.id, value)
      })
      controlsDiv.appendChild(spinControl)
    }
    
    // Orbit controls
    if (cfg.orbitRPM !== undefined) {
      const orbitControl = this.createSlider('Orbit RPM', cfg.orbitRPM || 0, 0, 60, (value) => {
        const orbitProcessor = this.engine.getProcessor(OrbitProcessor)
        orbitProcessor?.updateRPM(this.selectedLayer!.id, value)
      })
      controlsDiv.appendChild(orbitControl)
    }
    
    // Alpha control
    const alphaControl = this.createSlider('Alpha', this.selectedLayer.sprite.alpha, 0, 1, (value) => {
      if (this.selectedLayer) {
        this.selectedLayer.sprite.alpha = value
      }
    })
    controlsDiv.appendChild(alphaControl)
  }
  
  private createSlider(label: string, value: number, min: number, max: number, onChange: (value: number) => void): HTMLElement {
    const container = document.createElement('div')
    container.style.marginBottom = '10px'
    
    const labelEl = document.createElement('label')
    labelEl.textContent = label
    labelEl.style.display = 'block'
    
    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = min.toString()
    slider.max = max.toString()
    slider.step = '0.1'
    slider.value = value.toString()
    slider.style.width = '100%'
    
    const valueDisplay = document.createElement('span')
    valueDisplay.textContent = value.toFixed(1)
    
    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value)
      valueDisplay.textContent = newValue.toFixed(1)
      onChange(newValue)
    })
    
    container.appendChild(labelEl)
    container.appendChild(slider)
    container.appendChild(valueDisplay)
    
    return container
  }
  
  private updateLayerList() {
    const listDiv = this.panel.querySelector('#layer-list')
    if (!listDiv) return
    
    const context = (this.engine as any).context
    if (!context) return
    
    listDiv.innerHTML = '<h4>Layers</h4>'
    
    context.layers.forEach((layer: BuiltLayer) => {
      const button = document.createElement('button')
      button.textContent = layer.id
      button.style.display = 'block'
      button.style.width = '100%'
      button.style.marginBottom = '5px'
      button.onclick = () => this.selectLayer(layer.id)
      listDiv.appendChild(button)
    })
  }
}

// Usage
const debugEngine = new DebugLogicEngine()
const inspector = new AnimationInspector(debugEngine)

// Select layer programmatically
inspector.selectLayer('my-spinning-gear')
```

This comprehensive advanced usage guide provides developers with the tools and patterns needed to extend the Animation Logic Library for complex use cases, integrate it with modern frameworks, and optimize performance for production applications.