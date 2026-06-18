# Render Radar — Phase 1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a dev-only RN package: a `<RenderRadar>` wrapper and a `useRenderRadar` hook that flash a component's border and show the render count every time the component renders.

**Architecture:** "One brain, three mouths." All APIs use a shared core: `useRenderTracker` counts every render and writes to an off-render pub/sub store (`renderStore`). The visual layer (`RadarOverlay`) subscribes to the store via `useSyncExternalStore` — so the tool itself does not re-render the tracked component (no measurement pollution). In production all public APIs return no-op.

**Tech Stack:** TypeScript, React 18.3, React Native, `react-native-builder-bob` (build), Jest + `@testing-library/react-native` (test). In Phase 1, only the built-in `Animated` API (zero mandatory native dependency).

## Global Constraints

- Package name: `render-radar` (unscoped on npm, published from a personal account).
- React peer dep baseline: `react@^18.3` (`useSyncExternalStore` is required).
- NO mandatory native dependency — Phase 1 uses only the built-in `Animated`.
- Full no-op in production: when `__DEV__` is false the hook records nothing, `<RenderRadar>` renders only `children` and draws no extra visuals/overlay.
- Environment check always goes through the `isDev()` function (not a const — for testability).
- The tool's own render MUST NOT INCREMENT the render count of the tracked component.
- All public exports go through `src/index.ts`.
- Language: TypeScript, strict mode.

---

### Task 1: Project skeleton + green smoke test

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `babel.config.js`
- Create: `jest.config.js`
- Create: `jest.setup.js`
- Create: `.gitignore` (already exists — verify)
- Test: `src/__tests__/smoke.test.ts`

**Interfaces:**
- Consumes: (none)
- Produces: working `npm test` and `npm run build` commands; `src/` source root.

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd ~/Documents/render-radar
npm init -y
npm i -D typescript@^5.4 react@18.3.1 react-native@0.76.5 react-test-renderer@18.3.1 \
  @types/react@^18.3 @testing-library/react-native@^12.5 jest@^29.7 \
  @react-native/babel-preset@0.76.5 react-native-builder-bob@^0.30 babel-jest@^29.7
```
Expected: installation finishes without errors, `node_modules/` is created.

- [ ] **Step 2: Set up `package.json` fields**

Edit the relevant fields in `package.json` as follows (overwrite the existing `scripts`/`name`):
```json
{
  "name": "render-radar",
  "version": "0.0.0",
  "description": "Dev-only re-render visualizer for React Native — flash + count every render.",
  "main": "lib/commonjs/index.js",
  "module": "lib/module/index.js",
  "types": "lib/typescript/src/index.d.ts",
  "react-native": "src/index.ts",
  "source": "src/index.ts",
  "files": ["src", "lib", "!**/__tests__"],
  "scripts": {
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "build": "bob build"
  },
  "keywords": ["react-native", "performance", "render", "devtools", "debug", "rerender"],
  "license": "MIT",
  "peerDependencies": {
    "react": "^18.3",
    "react-native": ">=0.74"
  },
  "react-native-builder-bob": {
    "source": "src",
    "output": "lib",
    "targets": ["commonjs", "module", "typescript"]
  }
}
```

- [ ] **Step 3: Write the config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "esnext",
    "lib": ["esnext", "dom"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "declaration": true
  },
  "include": ["src"],
  "exclude": ["lib", "node_modules", "example"]
}
```

`babel.config.js`:
```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
```

`jest.config.js`:
```js
module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  modulePathIgnorePatterns: ['<rootDir>/lib/'],
};
```

`jest.setup.js`:
```js
// The react-native preset defines global.__DEV__ = true by default.
// Production no-op tests individually change the value of global.__DEV__.
```

- [ ] **Step 4: Write a green smoke test**

`src/__tests__/smoke.test.ts`:
```ts
describe('toolchain', () => {
  it('jest is running', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the test**

Run: `npm test`
Expected: PASS — 1 passed.

- [ ] **Step 6: Verify the build**

Create a temporary `src/index.ts`: `export const VERSION = '0.0.0';`
Run: `npm run build`
Expected: `lib/commonjs`, `lib/module`, `lib/typescript` folders are created, no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: project skeleton, jest + builder-bob configuration"
```

---

### Task 2: `isDev()` environment gate

**Files:**
- Create: `src/core/isDev.ts`
- Test: `src/core/__tests__/isDev.test.ts`

**Interfaces:**
- Consumes: (none)
- Produces: `export function isDev(): boolean`

- [ ] **Step 1: Write the failing test**

`src/core/__tests__/isDev.test.ts`:
```ts
import { isDev } from '../isDev';

describe('isDev', () => {
  afterEach(() => {
    (global as any).__DEV__ = true;
  });

  it('returns true when __DEV__ is true', () => {
    (global as any).__DEV__ = true;
    expect(isDev()).toBe(true);
  });

  it('returns false when __DEV__ is false', () => {
    (global as any).__DEV__ = false;
    expect(isDev()).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test, watch it fail**

Run: `npm test -- isDev`
Expected: FAIL — "Cannot find module '../isDev'".

- [ ] **Step 3: Minimal implementation**

`src/core/isDev.ts`:
```ts
declare const __DEV__: boolean | undefined;

export function isDev(): boolean {
  if (typeof __DEV__ !== 'undefined') return __DEV__;
  return process.env.NODE_ENV !== 'production';
}
```

- [ ] **Step 4: Run the test, watch it pass**

Run: `npm test -- isDev`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/isDev.ts src/core/__tests__/isDev.test.ts
git commit -m "feat: isDev environment gate"
```

---

### Task 3: `renderStore` — off-render pub/sub store

**Files:**
- Create: `src/core/store.ts`
- Test: `src/core/__tests__/store.test.ts`

**Interfaces:**
- Consumes: (none)
- Produces:
  - `export type RenderStat = { id: string; name: string; count: number; lastRenderAt: number }`
  - `export class RenderStore` — methods: `record(id: string, name: string, now: number): RenderStat`, `get(id: string): RenderStat | undefined`, `getAll(): RenderStat[]`, `reset(): void`, `subscribe(listener: () => void): () => void`, `subscribeId(id: string, listener: () => void): () => void`
  - `export const renderStore: RenderStore`

- [ ] **Step 1: Write the failing test**

`src/core/__tests__/store.test.ts`:
```ts
import { RenderStore } from '../store';

describe('RenderStore', () => {
  it('record increments count on each call', () => {
    const s = new RenderStore();
    expect(s.record('a', 'A', 1).count).toBe(1);
    expect(s.record('a', 'A', 2).count).toBe(2);
  });

  it('counts different ids independently', () => {
    const s = new RenderStore();
    s.record('a', 'A', 1);
    s.record('b', 'B', 1);
    expect(s.get('a')?.count).toBe(1);
    expect(s.get('b')?.count).toBe(1);
    expect(s.getAll()).toHaveLength(2);
  });

  it('reset clears all stats', () => {
    const s = new RenderStore();
    s.record('a', 'A', 1);
    s.reset();
    expect(s.getAll()).toHaveLength(0);
  });

  it('subscribeId fires only when the relevant id changes', () => {
    const s = new RenderStore();
    const calls: string[] = [];
    s.subscribeId('a', () => calls.push('a'));
    s.record('b', 'B', 1);
    expect(calls).toHaveLength(0);
    s.record('a', 'A', 1);
    expect(calls).toEqual(['a']);
  });

  it('subscribe fires on every record and unsubscribe works', () => {
    const s = new RenderStore();
    let n = 0;
    const unsub = s.subscribe(() => { n += 1; });
    s.record('a', 'A', 1);
    expect(n).toBe(1);
    unsub();
    s.record('a', 'A', 2);
    expect(n).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test, watch it fail**

Run: `npm test -- store`
Expected: FAIL — "Cannot find module '../store'".

- [ ] **Step 3: Minimal implementation**

`src/core/store.ts`:
```ts
export type RenderStat = {
  id: string;
  name: string;
  count: number;
  lastRenderAt: number;
};

type Listener = () => void;

export class RenderStore {
  private stats = new Map<string, RenderStat>();
  private listeners = new Set<Listener>();
  private idListeners = new Map<string, Set<Listener>>();

  record(id: string, name: string, now: number): RenderStat {
    const prev = this.stats.get(id);
    const next: RenderStat = {
      id,
      name,
      count: (prev?.count ?? 0) + 1,
      lastRenderAt: now,
    };
    this.stats.set(id, next);
    this.emit(id);
    return next;
  }

  get(id: string): RenderStat | undefined {
    return this.stats.get(id);
  }

  getAll(): RenderStat[] {
    return Array.from(this.stats.values());
  }

  reset(): void {
    this.stats.clear();
    this.emitAll();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  subscribeId(id: string, listener: Listener): () => void {
    let set = this.idListeners.get(id);
    if (!set) {
      set = new Set();
      this.idListeners.set(id, set);
    }
    set.add(listener);
    return () => { set!.delete(listener); };
  }

  private emit(id: string): void {
    this.idListeners.get(id)?.forEach((l) => l());
    this.listeners.forEach((l) => l());
  }

  private emitAll(): void {
    this.idListeners.forEach((set) => set.forEach((l) => l()));
    this.listeners.forEach((l) => l());
  }
}

export const renderStore = new RenderStore();
```

- [ ] **Step 4: Run the test, watch it pass**

Run: `npm test -- store`
Expected: PASS — 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/store.ts src/core/__tests__/store.test.ts
git commit -m "feat: renderStore pub/sub store"
```

---

### Task 4: `useRenderTracker` — counting hook

**Files:**
- Create: `src/core/useRenderTracker.ts`
- Test: `src/core/__tests__/useRenderTracker.test.tsx`

**Interfaces:**
- Consumes: `isDev()` (Task 2), `renderStore` (Task 3)
- Produces: `export function useRenderTracker(name: string): string` — returns a stable instance id; calls `renderStore.record` after every commit. Records nothing in production.

- [ ] **Step 1: Write the failing test**

`src/core/__tests__/useRenderTracker.test.tsx`:
```tsx
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useRenderTracker } from '../useRenderTracker';
import { renderStore } from '../store';

function Probe({ value }: { value: number }) {
  useRenderTracker('Probe');
  return <Text>{value}</Text>;
}

describe('useRenderTracker', () => {
  beforeEach(() => {
    renderStore.reset();
    (global as any).__DEV__ = true;
  });

  it('increments count for each render', () => {
    const { rerender } = render(<Probe value={1} />);
    expect(renderStore.getAll()[0]?.count).toBe(1);
    rerender(<Probe value={2} />);
    expect(renderStore.getAll()[0]?.count).toBe(2);
  });

  it('records nothing in production mode', () => {
    (global as any).__DEV__ = false;
    render(<Probe value={1} />);
    expect(renderStore.getAll()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test, watch it fail**

Run: `npm test -- useRenderTracker`
Expected: FAIL — "Cannot find module '../useRenderTracker'".

- [ ] **Step 3: Minimal implementation**

`src/core/useRenderTracker.ts`:
```ts
import { useEffect, useRef } from 'react';
import { isDev } from './isDev';
import { renderStore } from './store';

let autoId = 0;

export function useRenderTracker(name: string): string {
  const idRef = useRef<string | null>(null);
  if (idRef.current === null) {
    autoId += 1;
    idRef.current = `${name}#${autoId}`;
  }
  const id = idRef.current;

  // Record the render AFTER commit — do not mutate the store during render.
  // No dependency array: runs after every commit.
  useEffect(() => {
    if (!isDev()) return;
    renderStore.record(id, name, Date.now());
  });

  return id;
}
```

- [ ] **Step 4: Run the test, watch it pass**

Run: `npm test -- useRenderTracker`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/useRenderTracker.ts src/core/__tests__/useRenderTracker.test.tsx
git commit -m "feat: useRenderTracker counting hook"
```

---

### Task 5: `useRenderRadar` — public hook

**Files:**
- Create: `src/api/useRenderRadar.ts`
- Test: `src/api/__tests__/useRenderRadar.test.tsx`

**Interfaces:**
- Consumes: `useRenderTracker` (Task 4), `renderStore` (Task 3), `isDev()` (Task 2)
- Produces: `export function useRenderRadar(name: string, options?: { log?: boolean }): number` — returns the current render count; if `options.log` is true, logs via `console.log` on every render.

- [ ] **Step 1: Write the failing test**

`src/api/__tests__/useRenderRadar.test.tsx`:
```tsx
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useRenderRadar } from '../useRenderRadar';
import { renderStore } from '../../core/store';

function Counter({ value }: { value: number }) {
  const count = useRenderRadar('Counter');
  return <Text testID="count">{count}</Text>;
}

describe('useRenderRadar', () => {
  beforeEach(() => {
    renderStore.reset();
    (global as any).__DEV__ = true;
  });

  it('returns the render count and updates the store', () => {
    const { getByTestId, rerender } = render(<Counter value={1} />);
    expect(getByTestId('count').props.children).toBe(1);
    rerender(<Counter value={2} />);
    expect(getByTestId('count').props.children).toBe(2);
  });

  it('the store stays empty in production mode', () => {
    (global as any).__DEV__ = false;
    render(<Counter value={1} />);
    expect(renderStore.getAll()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test, watch it fail**

Run: `npm test -- useRenderRadar`
Expected: FAIL — "Cannot find module '../useRenderRadar'".

- [ ] **Step 3: Minimal implementation**

`src/api/useRenderRadar.ts`:

> ⚠️ **Fix (found during implementation):** The hook MUST NOT subscribe to its
> OWN count via `useSyncExternalStore`. The subscription listens for a new store
> record on every render, which produces a re-render, which in turn pushes
> `useRenderTracker` to record again → **infinite render loop and OOM**. We count
> the count with a local `useRef`; we still record to the store (so the
> panel/visual layer can read it) but we do not listen to our own count.

```ts
import { useEffect, useRef } from 'react';
import { useRenderTracker } from '../core/useRenderTracker';

export function useRenderRadar(name: string, options?: { log?: boolean }): number {
  // Record to the store (the panel/visual layer reads it) — but do NOT subscribe to the store.
  useRenderTracker(name);

  // Which render number is this? With a local ref; independent of the store.
  const countRef = useRef(0);
  countRef.current += 1;
  const count = countRef.current;

  useEffect(() => {
    if (options?.log) {
      // eslint-disable-next-line no-console
      console.log(`[render-radar] ${name} rendered ${count}x`);
    }
  }, [name, count, options?.log]);

  return count;
}
```

- [ ] **Step 4: Run the test, watch it pass**

Run: `npm test -- useRenderRadar`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/api/useRenderRadar.ts src/api/__tests__/useRenderRadar.test.tsx
git commit -m "feat: useRenderRadar public hook"
```

---

### Task 6: `RadarOverlay` — flash border + counter badge

**Files:**
- Create: `src/overlay/FlashOverlay.tsx`
- Test: `src/overlay/__tests__/FlashOverlay.test.tsx`

**Interfaces:**
- Consumes: `renderStore` (Task 3)
- Produces: `export function RadarOverlay(props: { id: string; color: string }): JSX.Element` — subscribes to the store via `subscribeId`, plays a flash animation when count changes, and shows a counter badge with `testID="render-radar-badge"`. It subscribes to the store but does NOT INCREMENT any render counter (it is not itself tracked).

- [ ] **Step 1: Write the failing test**

`src/overlay/__tests__/FlashOverlay.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { RadarOverlay } from '../FlashOverlay';
import { renderStore } from '../../core/store';

describe('RadarOverlay', () => {
  beforeEach(() => { renderStore.reset(); });

  it('shows the store counter in the badge', () => {
    renderStore.record('X#1', 'X', 1);
    const { getByTestId } = render(<RadarOverlay id="X#1" color="#ff0000" />);
    expect(getByTestId('render-radar-badge').props.children).toBe(1);
  });

  it('shows 0 when there is no stat for the id', () => {
    const { getByTestId } = render(<RadarOverlay id="missing" color="#ff0000" />);
    expect(getByTestId('render-radar-badge').props.children).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test, watch it fail**

Run: `npm test -- FlashOverlay`
Expected: FAIL — "Cannot find module '../FlashOverlay'".

- [ ] **Step 3: Minimal implementation**

`src/overlay/FlashOverlay.tsx`:
```tsx
import React, { useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { renderStore } from '../core/store';

type Props = { id: string; color: string };

export function RadarOverlay({ id, color }: Props): JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;

  const stat = useSyncExternalStore(
    (cb) => renderStore.subscribeId(id, cb),
    () => renderStore.get(id),
    () => undefined,
  );
  const count = stat?.count ?? 0;

  useEffect(() => {
    if (count === 0) return;
    opacity.setValue(1);
    const anim = Animated.timing(opacity, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [count, opacity]);

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.border, { borderColor: color, opacity }]}
      />
      <View pointerEvents="none" style={[styles.badge, { backgroundColor: color }]}>
        <Text testID="render-radar-badge" style={styles.badgeText}>
          {count}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  border: {
    borderWidth: 2,
    borderRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
```

- [ ] **Step 4: Run the test, watch it pass**

Run: `npm test -- FlashOverlay`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/overlay/FlashOverlay.tsx src/overlay/__tests__/FlashOverlay.test.tsx
git commit -m "feat: RadarOverlay flash border + counter badge"
```

---

### Task 7: `<RenderRadar>` wrapper + public exports

**Files:**
- Create: `src/api/RenderRadar.tsx`
- Create: `src/index.ts` (replace the temporary content from Task 1)
- Test: `src/api/__tests__/RenderRadar.test.tsx`

**Interfaces:**
- Consumes: `useRenderTracker` (Task 4), `RadarOverlay` (Task 6), `isDev()` (Task 2)
- Produces:
  - `export type RenderRadarProps = { name: string; color?: string; children: React.ReactNode }`
  - `export function RenderRadar(props: RenderRadarProps): JSX.Element`
  - `src/index.ts` exports the entire public surface: `RenderRadar`, `RenderRadarProps`, `useRenderRadar`, `renderStore`, `RenderStat`.

- [ ] **Step 1: Write the failing test**

`src/api/__tests__/RenderRadar.test.tsx`:
```tsx
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { RenderRadar } from '../RenderRadar';
import { renderStore } from '../../core/store';

describe('RenderRadar', () => {
  beforeEach(() => {
    renderStore.reset();
    (global as any).__DEV__ = true;
  });
  afterEach(() => {
    (global as any).__DEV__ = true;
  });

  it('renders children + badge in dev mode', () => {
    const { getByText, getByTestId } = render(
      <RenderRadar name="Card">
        <Text>content</Text>
      </RenderRadar>,
    );
    expect(getByText('content')).toBeTruthy();
    expect(getByTestId('render-radar-badge')).toBeTruthy();
  });

  it('renders only children in production mode (no overlay)', () => {
    (global as any).__DEV__ = false;
    const { getByText, queryByTestId } = render(
      <RenderRadar name="Card">
        <Text>content</Text>
      </RenderRadar>,
    );
    expect(getByText('content')).toBeTruthy();
    expect(queryByTestId('render-radar-badge')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test, watch it fail**

Run: `npm test -- RenderRadar`
Expected: FAIL — "Cannot find module '../RenderRadar'".

- [ ] **Step 3: Minimal implementation**

`src/api/RenderRadar.tsx`:
```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { isDev } from '../core/isDev';
import { useRenderTracker } from '../core/useRenderTracker';
import { RadarOverlay } from '../overlay/FlashOverlay';

export type RenderRadarProps = {
  name: string;
  color?: string;
  children: React.ReactNode;
};

export function RenderRadar({ name, color = '#ff3b30', children }: RenderRadarProps): JSX.Element {
  // isDev() is constant for the lifetime of the app; this branch does not break hook order.
  if (!isDev()) {
    return <>{children}</>;
  }
  return (
    <RenderRadarDev name={name} color={color}>
      {children}
    </RenderRadarDev>
  );
}

function RenderRadarDev({
  name,
  color,
  children,
}: {
  name: string;
  color: string;
  children: React.ReactNode;
}): JSX.Element {
  const id = useRenderTracker(name);
  return (
    <View style={styles.container}>
      {children}
      <RadarOverlay id={id} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
```

`src/index.ts` (replace the temporary content):
```ts
export { RenderRadar } from './api/RenderRadar';
export type { RenderRadarProps } from './api/RenderRadar';
export { useRenderRadar } from './api/useRenderRadar';
export { renderStore } from './core/store';
export type { RenderStat } from './core/store';
```

- [ ] **Step 4: Run the tests, watch them pass**

Run: `npm test`
Expected: PASS — all test files green.

- [ ] **Step 5: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: No errors; `lib/typescript/src/index.d.ts` contains the `RenderRadar` and `useRenderRadar` types.

- [ ] **Step 6: Commit**

```bash
git add src/api/RenderRadar.tsx src/index.ts src/api/__tests__/RenderRadar.test.tsx
git commit -m "feat: RenderRadar wrapper + public exports"
```

---

### Task 8: README + minimal Expo example app (manual/visual verification)

**Files:**
- Create: `README.md`
- Create: `example/App.tsx`
- Create: `example/package.json`
- Test: (manual — visual verification in the simulator via Argent)

**Interfaces:**
- Consumes: `RenderRadar`, `useRenderRadar` (package public API)
- Produces: README (install + usage + GIF placeholder) and a runnable Expo screen.

- [ ] **Step 1: Write the README**

`README.md`:
```markdown
# render-radar

> Dev-only re-render visualizer for React Native. Wrap a component and see it
> flash + count every time it re-renders. No Flipper, no native setup.

![demo](./docs/demo.gif)

## Install

```bash
npm i -D render-radar
```

## Usage

### Wrapper (visual: flash + counter)

```tsx
import { RenderRadar } from 'render-radar';

<RenderRadar name="ProductCard">
  <ProductCard {...props} />
</RenderRadar>
```

### Hook (use the counter yourself)

```tsx
import { useRenderRadar } from 'render-radar';

function ProductCard(props) {
  const renderCount = useRenderRadar('ProductCard', { log: true });
  // ...
}
```

In a production build (`__DEV__ === false`) all APIs are no-ops — they produce no
extra render, overlay, or log.

## API

- `<RenderRadar name color?>` — wraps the children, shows flash + counter on render.
- `useRenderRadar(name, { log? })` — returns the current render count.

## License

MIT
```

- [ ] **Step 2: Create a minimal Expo example app**

Run:
```bash
cd ~/Documents/render-radar
npx create-expo-app@latest example --template blank-typescript
cd example
npm i
```
Expected: a working Expo project under `example/`.

- [ ] **Step 3: Write the example screen**

Replace the content of `example/App.tsx` with the following:
```tsx
import React, { useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { RenderRadar } from '../src';

function Box({ label }: { label: string }) {
  return (
    <View style={{ padding: 24, backgroundColor: '#eee', margin: 16, borderRadius: 8 }}>
      <Text>{label}</Text>
    </View>
  );
}

export default function App() {
  const [n, setN] = useState(0);
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <Text style={{ textAlign: 'center' }}>Counter: {n}</Text>
      <Button title="Trigger render" onPress={() => setN((x) => x + 1)} />
      <RenderRadar name="Box">
        <Box label="This box flashes on every render" />
      </RenderRadar>
    </SafeAreaView>
  );
}
```

Note: a watchFolders setting in `metro.config.js` may be needed so that `example`
can resolve the `src` in the parent folder. The simplest path: instead of
`import { RenderRadar } from '../src'` for the example, link the package locally
(`npm pack` + install) or set metro `watchFolders: [path.resolve(__dirname, '..')]`.

- [ ] **Step 4: Verify visually with Argent**

Run the example app in the simulator; press "Trigger render" and visually confirm
that `Box` flashes + the badge increments. (Argent MCP: list-devices →
boot → launch → discovery → gesture-tap → screenshot.)

- [ ] **Step 5: Record a GIF and add it to the README**

Produce `docs/demo.gif` from the screen recording, matching the placeholder path in the README.

- [ ] **Step 6: Commit**

```bash
git add README.md example docs/demo.gif
git commit -m "docs: README + Expo example app + demo GIF"
```

---

## Self-Review (post-writing check)

**Spec coverage:**
- Core (useRenderTracker, store, isDev) → Task 2,3,4 ✔
- 3 mouths: hook → Task 5, wrapper → Task 7, HOC → **deferred to Phase 2** (HOC is Phase 2 in the spec). ✔
- Flash border + badge → Task 6 ✔
- Dev-only no-op → verified by Task 4,5,7 tests ✔
- No measurement pollution (the tool does not re-render the tracked component) → solved in the architecture: RenderRadarDev does NOT subscribe to the store; RadarOverlay subscribes but is not tracked ✔
- Animated (not Reanimated) → Task 6 ✔
- TS + builder-bob + Expo example + jest → Task 1, 8 ✔
- "Why" diff, panel, Provider → **Phase 2/3, out of scope** ✔

**Placeholder scan:** The code steps are complete; the only deliberate placeholder is `docs/demo.gif` (produced in Task 8). No "TBD" in the spec.

**Type consistency:** `record(id,name,now)`, `get(id)`, `subscribeId(id,cb)`, `useRenderTracker(name): string`, `useRenderRadar(name, {log?}): number`, `RadarOverlay({id,color})`, `RenderRadar({name,color?,children})`, `RenderStat{id,name,count,lastRenderAt}` — consistent across all tasks ✔
