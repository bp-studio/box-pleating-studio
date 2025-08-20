# Core Routes System

This directory implements a sophisticated type-safe communication system between the Client and Core worker threads.

## Architecture Overview

The routes system provides a proxy-based API that allows the Client to call Core methods with full type safety and IntelliSense support, despite the asynchronous nature of Web Worker communication.

## Key Components

### RouteMap (`routes.ts`)
Defines the mapping of available controllers to their implementations:

```typescript
const Routes = {
    design: DesignController,
    tree: TreeController,
    layout: LayoutController,
};

export type RouteMap = typeof Routes;
```

This creates a compile-time contract that ensures all referenced controllers exist and have the correct method signatures.

### Type Transformations (`index.ts`)

#### ToPromise<T>
Automatically wraps synchronous Core methods as Promises for async Client consumption:

```typescript
type ToPromise<T> = T extends (...args: infer U) => infer R 
    ? (...args: U) => Promise<R> 
    : never;
```

#### Route Type
Generates the complete typed interface available to Client code:

```typescript
export type Route = {
    readonly [C in keyof RouteMap]: Controller<RouteMap[C]>;
};
```

### Request/Response Protocol

#### CoreRequest
Structured requests sent from Client to Core:
- `controller`: Which controller to target (type-checked against RouteMap)
- `action`: Which method to call (validated at runtime)
- `value`: Method parameters (properly typed through proxy system)

#### CoreResponse
Union type supporting three response types:
- `ValueResponse`: Direct return values
- `UpdateResponse`: State updates that trigger UI re-rendering
- `ErrorResponse`: Error information with stack trace preservation

## Client-Side Usage

The Client creates a dynamic proxy that provides the typed API:

```typescript
// In Project class
this.$core = this.$createCoreProxy();

// Usage with full type safety
await this.$core.design.init(prototype);
await this.$core.tree.addVertex(x, y);
await this.$core.layout.updatePattern(id, config);
```

## Proxy Implementation

### Controller Proxy
Creates on-demand proxies for each controller:

```typescript
private _createControllerProxy(controller: string): Record<string, Action> {
    return new Proxy({}, {
        get: (actions, action) =>
            actions[action] ||= (...args) => this._callCore(controller, action, args),
    });
}
```

### Action Proxy
Dynamically generates method calls that route through the worker communication system while preserving type information and stack traces.

## Benefits

### For Developers
- **Full IntelliSense**: IDE provides autocompletion for all Core APIs
- **Compile-time safety**: TypeScript catches invalid controller/action references
- **Consistent API**: All Core operations follow the same async pattern
- **Easy debugging**: Stack traces are preserved across worker boundaries

### For Maintainability
- **Single source of truth**: RouteMap defines all available operations
- **Type-driven development**: Adding new controllers/actions requires type updates
- **Runtime validation**: Invalid operations are caught with descriptive errors
- **Automatic serialization**: Complex objects are properly marshaled across worker boundary

## Error Handling

The system includes comprehensive error handling:
- **Fatal error recovery**: Projects can be gracefully terminated on unrecoverable errors
- **Stack trace preservation**: Client-side stack traces are maintained for debugging
- **User-friendly messages**: Core errors are translated to meaningful UI feedback
- **Timeout protection**: Long-running operations are automatically timed out

## Adding New Controllers

To add a new controller:

1. Create the controller class in `src/core/controller/`
2. Add it to the `Routes` object in `routes.ts`
3. TypeScript will automatically include it in the `Route` type
4. Client code can immediately use `project.$core.newController.method()`

The type system ensures that all references remain valid and properly typed throughout the development process.