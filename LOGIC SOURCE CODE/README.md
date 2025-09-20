# Logic Source Code

This directory contains the extracted and reorganized logic modules from the apps/Launcher/ folder. The code has been completely analyzed and restructured into clean, modular components.

## Structure

### CORE/
Contains the foundational utilities and types used by all logic modules:
- **types.ts** - Core TypeScript definitions and interfaces
- **math.ts** - Mathematical utility functions (angles, clamping, interpolation)
- **capabilities.ts** - Device capability detection (WebGL, hardware)
- **ticker.ts** - RAF-based animation ticker
- **utils.ts** - General utility functions

### Basic/
Handles fundamental sprite transformations:
- Position (percentage-based)
- Scale (percentage-based)  
- Rotation (degrees to radians)
- Z-index management
- Resize handling

### SpinL/
Manages rotation animations:
- RPM-based spinning (0-60 RPM)
- Clockwise/Counter-clockwise direction
- Smooth rotation timing

### Orbit/
Controls orbital motion around center points:
- RPM-based orbital speed
- Dynamic center positioning
- Radius calculation with screen bounds
- Orientation policies (none/auto/override)
- Complex geometry projections

### Effect/
Visual effects system (merged basic + advanced):
- **Basic Effects**: fade, pulse, tilt
- **Advanced Effects**: glow, bloom, distort, shockwave
- Hardware capability detection
- Pointer tracking for interactive effects
- Blend modes and GPU optimizations

## Key Features

### Modular Architecture
Each module is self-contained with clear interfaces and can be used independently or in combination.

### Performance Optimized
- Hardware capability detection
- Efficient RAF-based ticker
- Minimal garbage collection
- GPU-accelerated effects when available

### Type Safe
Full TypeScript coverage with comprehensive type definitions and interfaces.

### Extensible
Clean processor pattern allows easy addition of new logic modules.

## Usage

```typescript
import { LogicEngine } from './LOGIC SOURCE CODE'

// Create engine
const engine = new LogicEngine()

// Build scene
const result = await engine.buildScene(pixiApp, configuration)

// Access individual processors
const basicProcessor = engine.getProcessor(BasicProcessor)
const spinProcessor = engine.getProcessor(SpinLProcessor)
```

## Migration Notes

This reorganized code maintains 100% compatibility with the original launcher logic while providing:
- Better separation of concerns
- Improved maintainability  
- Enhanced performance
- Clearer documentation
- Easier testing and debugging

All original functionality has been preserved and enhanced with additional utilities and controls.