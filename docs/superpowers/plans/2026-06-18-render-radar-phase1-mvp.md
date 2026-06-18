# Render Radar — Faz 1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dev-only bir RN paketi yayınlamak: bir component her render olduğunda kenarını flash'layan + render sayısını gösteren `<RenderRadar>` wrapper'ı ve `useRenderRadar` hook'u.

**Architecture:** "Tek beyin, üç ağız." Tüm API'ler ortak bir çekirdeği kullanır: `useRenderTracker` her render'ı sayar ve render dışı bir pub/sub store'a (`renderStore`) yazar. Görsel katman (`RadarOverlay`) store'a `useSyncExternalStore` ile abone olur — böylece aracın kendisi izlenen component'i yeniden render etmez (ölçüm kirlenmez). Production'da tüm public API'ler no-op döner.

**Tech Stack:** TypeScript, React 18.3, React Native, `react-native-builder-bob` (build), Jest + `@testing-library/react-native` (test). Faz 1'de yalnızca dahili `Animated` API (sıfır zorunlu native bağımlılık).

## Global Constraints

- Paket adı: `render-radar` (npm'de scope'suz, şahsi hesapla yayın).
- React peer dep tabanı: `react@^18.3` (`useSyncExternalStore` gerekir).
- Zorunlu native bağımlılık YOK — Faz 1 yalnızca dahili `Animated` kullanır.
- Production'da tam no-op: `__DEV__` false iken hook hiçbir şey kaydetmez, `<RenderRadar>` yalnızca `children` render eder, ek görsel/overlay çizmez.
- Ortam kontrolü her zaman `isDev()` fonksiyonu üzerinden (const değil — test edilebilirlik için).
- Aracın kendi render'ı, izlenen component'in render sayısını ARTIRMAMALI.
- Tüm public export'lar `src/index.ts` üzerinden.
- Dil: TypeScript, strict mode.

---

### Task 1: Proje iskeleti + yeşil smoke test

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `babel.config.js`
- Create: `jest.config.js`
- Create: `jest.setup.js`
- Create: `.gitignore` (zaten var — doğrula)
- Test: `src/__tests__/smoke.test.ts`

**Interfaces:**
- Consumes: (yok)
- Produces: Çalışan `npm test` ve `npm run build` komutları; `src/` kaynak kökü.

- [ ] **Step 1: Bağımlılıkları kur**

Run:
```bash
cd ~/Documents/render-radar
npm init -y
npm i -D typescript@^5.4 react@18.3.1 react-native@0.76.5 react-test-renderer@18.3.1 \
  @types/react@^18.3 @testing-library/react-native@^12.5 jest@^29.7 \
  @react-native/babel-preset@0.76.5 react-native-builder-bob@^0.30 babel-jest@^29.7
```
Expected: kurulum hatasız biter, `node_modules/` oluşur.

- [ ] **Step 2: `package.json` alanlarını ayarla**

`package.json` içindeki ilgili alanları şu şekilde düzenle (mevcut `scripts`/`name` üzerine yaz):
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

- [ ] **Step 3: Config dosyalarını yaz**

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
// react-native preset, varsayılan olarak global.__DEV__ = true tanımlar.
// Production no-op testleri tek tek global.__DEV__ değerini değiştirir.
```

- [ ] **Step 4: Yeşil smoke testi yaz**

`src/__tests__/smoke.test.ts`:
```ts
describe('toolchain', () => {
  it('jest çalışıyor', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Testi çalıştır**

Run: `npm test`
Expected: PASS — 1 passed.

- [ ] **Step 6: Build'i doğrula**

Geçici bir `src/index.ts` oluştur: `export const VERSION = '0.0.0';`
Run: `npm run build`
Expected: `lib/commonjs`, `lib/module`, `lib/typescript` klasörleri oluşur, hata yok.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: proje iskeleti, jest + builder-bob yapılandırması"
```

---

### Task 2: `isDev()` ortam kapısı

**Files:**
- Create: `src/core/isDev.ts`
- Test: `src/core/__tests__/isDev.test.ts`

**Interfaces:**
- Consumes: (yok)
- Produces: `export function isDev(): boolean`

- [ ] **Step 1: Başarısız testi yaz**

`src/core/__tests__/isDev.test.ts`:
```ts
import { isDev } from '../isDev';

describe('isDev', () => {
  afterEach(() => {
    (global as any).__DEV__ = true;
  });

  it('__DEV__ true iken true döner', () => {
    (global as any).__DEV__ = true;
    expect(isDev()).toBe(true);
  });

  it('__DEV__ false iken false döner', () => {
    (global as any).__DEV__ = false;
    expect(isDev()).toBe(false);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npm test -- isDev`
Expected: FAIL — "Cannot find module '../isDev'".

- [ ] **Step 3: Minimal implementasyon**

`src/core/isDev.ts`:
```ts
declare const __DEV__: boolean | undefined;

export function isDev(): boolean {
  if (typeof __DEV__ !== 'undefined') return __DEV__;
  return process.env.NODE_ENV !== 'production';
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npm test -- isDev`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/isDev.ts src/core/__tests__/isDev.test.ts
git commit -m "feat: isDev ortam kapısı"
```

---

### Task 3: `renderStore` — render dışı pub/sub store

**Files:**
- Create: `src/core/store.ts`
- Test: `src/core/__tests__/store.test.ts`

**Interfaces:**
- Consumes: (yok)
- Produces:
  - `export type RenderStat = { id: string; name: string; count: number; lastRenderAt: number }`
  - `export class RenderStore` — metodlar: `record(id: string, name: string, now: number): RenderStat`, `get(id: string): RenderStat | undefined`, `getAll(): RenderStat[]`, `reset(): void`, `subscribe(listener: () => void): () => void`, `subscribeId(id: string, listener: () => void): () => void`
  - `export const renderStore: RenderStore`

- [ ] **Step 1: Başarısız testi yaz**

`src/core/__tests__/store.test.ts`:
```ts
import { RenderStore } from '../store';

describe('RenderStore', () => {
  it('record her çağrıda count artırır', () => {
    const s = new RenderStore();
    expect(s.record('a', 'A', 1).count).toBe(1);
    expect(s.record('a', 'A', 2).count).toBe(2);
  });

  it('farklı idleri bağımsız sayar', () => {
    const s = new RenderStore();
    s.record('a', 'A', 1);
    s.record('b', 'B', 1);
    expect(s.get('a')?.count).toBe(1);
    expect(s.get('b')?.count).toBe(1);
    expect(s.getAll()).toHaveLength(2);
  });

  it('reset tüm statları temizler', () => {
    const s = new RenderStore();
    s.record('a', 'A', 1);
    s.reset();
    expect(s.getAll()).toHaveLength(0);
  });

  it('subscribeId yalnızca ilgili id değişince tetiklenir', () => {
    const s = new RenderStore();
    const calls: string[] = [];
    s.subscribeId('a', () => calls.push('a'));
    s.record('b', 'B', 1);
    expect(calls).toHaveLength(0);
    s.record('a', 'A', 1);
    expect(calls).toEqual(['a']);
  });

  it('subscribe her kayıtta tetiklenir ve unsubscribe çalışır', () => {
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

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npm test -- store`
Expected: FAIL — "Cannot find module '../store'".

- [ ] **Step 3: Minimal implementasyon**

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

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npm test -- store`
Expected: PASS — 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/store.ts src/core/__tests__/store.test.ts
git commit -m "feat: renderStore pub/sub store"
```

---

### Task 4: `useRenderTracker` — sayım hook'u

**Files:**
- Create: `src/core/useRenderTracker.ts`
- Test: `src/core/__tests__/useRenderTracker.test.tsx`

**Interfaces:**
- Consumes: `isDev()` (Task 2), `renderStore` (Task 3)
- Produces: `export function useRenderTracker(name: string): string` — kararlı bir instance id döner; her commit sonrası `renderStore.record` çağırır. Production'da kayıt yapmaz.

- [ ] **Step 1: Başarısız testi yaz**

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

  it('her render için count artırır', () => {
    const { rerender } = render(<Probe value={1} />);
    expect(renderStore.getAll()[0]?.count).toBe(1);
    rerender(<Probe value={2} />);
    expect(renderStore.getAll()[0]?.count).toBe(2);
  });

  it('production modunda hiçbir şey kaydetmez', () => {
    (global as any).__DEV__ = false;
    render(<Probe value={1} />);
    expect(renderStore.getAll()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npm test -- useRenderTracker`
Expected: FAIL — "Cannot find module '../useRenderTracker'".

- [ ] **Step 3: Minimal implementasyon**

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

  // Render'ı commit SONRASI kaydet — render sırasında store'u mutasyona uğratma.
  // Bağımlılık dizisi yok: her commit sonrası çalışır.
  useEffect(() => {
    if (!isDev()) return;
    renderStore.record(id, name, Date.now());
  });

  return id;
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npm test -- useRenderTracker`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/useRenderTracker.ts src/core/__tests__/useRenderTracker.test.tsx
git commit -m "feat: useRenderTracker sayım hooku"
```

---

### Task 5: `useRenderRadar` — public hook

**Files:**
- Create: `src/api/useRenderRadar.ts`
- Test: `src/api/__tests__/useRenderRadar.test.tsx`

**Interfaces:**
- Consumes: `useRenderTracker` (Task 4), `renderStore` (Task 3), `isDev()` (Task 2)
- Produces: `export function useRenderRadar(name: string, options?: { log?: boolean }): number` — güncel render sayısını döner; `options.log` true ise her render'da `console.log` ile loglar.

- [ ] **Step 1: Başarısız testi yaz**

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

  it('render sayısını döner ve store günceller', () => {
    const { getByTestId, rerender } = render(<Counter value={1} />);
    expect(getByTestId('count').props.children).toBe(1);
    rerender(<Counter value={2} />);
    expect(getByTestId('count').props.children).toBe(2);
  });

  it('production modunda store boş kalır', () => {
    (global as any).__DEV__ = false;
    render(<Counter value={1} />);
    expect(renderStore.getAll()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npm test -- useRenderRadar`
Expected: FAIL — "Cannot find module '../useRenderRadar'".

- [ ] **Step 3: Minimal implementasyon**

`src/api/useRenderRadar.ts`:
```ts
import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { useRenderTracker } from '../core/useRenderTracker';
import { renderStore } from '../core/store';

export function useRenderRadar(name: string, options?: { log?: boolean }): number {
  const id = useRenderTracker(name);

  const stat = useSyncExternalStore(
    (cb) => renderStore.subscribeId(id, cb),
    () => renderStore.get(id),
    () => undefined,
  );
  const count = stat?.count ?? 0;

  useEffect(() => {
    if (options?.log && count > 0) {
      // eslint-disable-next-line no-console
      console.log(`[render-radar] ${name} rendered ${count}x`);
    }
  }, [name, count, options?.log]);

  return count;
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npm test -- useRenderRadar`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/api/useRenderRadar.ts src/api/__tests__/useRenderRadar.test.tsx
git commit -m "feat: useRenderRadar public hook"
```

---

### Task 6: `RadarOverlay` — flash kenarı + sayaç rozeti

**Files:**
- Create: `src/overlay/FlashOverlay.tsx`
- Test: `src/overlay/__tests__/FlashOverlay.test.tsx`

**Interfaces:**
- Consumes: `renderStore` (Task 3)
- Produces: `export function RadarOverlay(props: { id: string; color: string }): JSX.Element` — store'a `subscribeId` ile abone olur, count değişince flash animasyonu oynatır, `testID="render-radar-badge"` olan bir sayaç rozeti gösterir. Store'a abone olur ama hiçbir render sayacını ARTIRMAZ (kendisi izlenmez).

- [ ] **Step 1: Başarısız testi yaz**

`src/overlay/__tests__/FlashOverlay.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { RadarOverlay } from '../FlashOverlay';
import { renderStore } from '../../core/store';

describe('RadarOverlay', () => {
  beforeEach(() => { renderStore.reset(); });

  it('store sayacını rozette gösterir', () => {
    renderStore.record('X#1', 'X', 1);
    const { getByTestId } = render(<RadarOverlay id="X#1" color="#ff0000" />);
    expect(getByTestId('render-radar-badge').props.children).toBe(1);
  });

  it('id için stat yoksa 0 gösterir', () => {
    const { getByTestId } = render(<RadarOverlay id="missing" color="#ff0000" />);
    expect(getByTestId('render-radar-badge').props.children).toBe(0);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npm test -- FlashOverlay`
Expected: FAIL — "Cannot find module '../FlashOverlay'".

- [ ] **Step 3: Minimal implementasyon**

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

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `npm test -- FlashOverlay`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/overlay/FlashOverlay.tsx src/overlay/__tests__/FlashOverlay.test.tsx
git commit -m "feat: RadarOverlay flash kenarı + sayaç rozeti"
```

---

### Task 7: `<RenderRadar>` wrapper + public export'lar

**Files:**
- Create: `src/api/RenderRadar.tsx`
- Create: `src/index.ts` (Task 1'deki geçici içeriği değiştir)
- Test: `src/api/__tests__/RenderRadar.test.tsx`

**Interfaces:**
- Consumes: `useRenderTracker` (Task 4), `RadarOverlay` (Task 6), `isDev()` (Task 2)
- Produces:
  - `export type RenderRadarProps = { name: string; color?: string; children: React.ReactNode }`
  - `export function RenderRadar(props: RenderRadarProps): JSX.Element`
  - `src/index.ts` tüm public yüzeyi dışa aktarır: `RenderRadar`, `RenderRadarProps`, `useRenderRadar`, `renderStore`, `RenderStat`.

- [ ] **Step 1: Başarısız testi yaz**

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

  it('dev modunda children + rozet render eder', () => {
    const { getByText, getByTestId } = render(
      <RenderRadar name="Card">
        <Text>içerik</Text>
      </RenderRadar>,
    );
    expect(getByText('içerik')).toBeTruthy();
    expect(getByTestId('render-radar-badge')).toBeTruthy();
  });

  it('production modunda yalnızca children render eder (overlay yok)', () => {
    (global as any).__DEV__ = false;
    const { getByText, queryByTestId } = render(
      <RenderRadar name="Card">
        <Text>içerik</Text>
      </RenderRadar>,
    );
    expect(getByText('içerik')).toBeTruthy();
    expect(queryByTestId('render-radar-badge')).toBeNull();
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `npm test -- RenderRadar`
Expected: FAIL — "Cannot find module '../RenderRadar'".

- [ ] **Step 3: Minimal implementasyon**

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
  // isDev() uygulama ömrü boyunca sabittir; bu dallanma hook sırasını bozmaz.
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

`src/index.ts` (geçici içeriği değiştir):
```ts
export { RenderRadar } from './api/RenderRadar';
export type { RenderRadarProps } from './api/RenderRadar';
export { useRenderRadar } from './api/useRenderRadar';
export { renderStore } from './core/store';
export type { RenderStat } from './core/store';
```

- [ ] **Step 4: Testleri çalıştır, geçtiğini gör**

Run: `npm test`
Expected: PASS — tüm test dosyaları yeşil.

- [ ] **Step 5: Typecheck + build doğrula**

Run: `npm run typecheck && npm run build`
Expected: Hata yok; `lib/typescript/src/index.d.ts` `RenderRadar` ve `useRenderRadar` tiplerini içerir.

- [ ] **Step 6: Commit**

```bash
git add src/api/RenderRadar.tsx src/index.ts src/api/__tests__/RenderRadar.test.tsx
git commit -m "feat: RenderRadar wrapper + public exportlar"
```

---

### Task 8: README + minimal Expo örnek app (manuel/görsel doğrulama)

**Files:**
- Create: `README.md`
- Create: `example/App.tsx`
- Create: `example/package.json`
- Test: (manuel — Argent ile simülatörde görsel doğrulama)

**Interfaces:**
- Consumes: `RenderRadar`, `useRenderRadar` (paket public API)
- Produces: README (kurulum + kullanım + GIF yer tutucusu) ve çalıştırılabilir bir Expo ekranı.

- [ ] **Step 1: README yaz**

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

### Wrapper (görsel: flash + sayaç)

```tsx
import { RenderRadar } from 'render-radar';

<RenderRadar name="ProductCard">
  <ProductCard {...props} />
</RenderRadar>
```

### Hook (sayacı kendin kullan)

```tsx
import { useRenderRadar } from 'render-radar';

function ProductCard(props) {
  const renderCount = useRenderRadar('ProductCard', { log: true });
  // ...
}
```

Production build'de (`__DEV__ === false`) tüm API'ler no-op'tur — ek render,
overlay veya log üretmez.

## API

- `<RenderRadar name color?>` — children'ı sarar, render'da flash + sayaç gösterir.
- `useRenderRadar(name, { log? })` — güncel render sayısını döner.

## License

MIT
```

- [ ] **Step 2: Minimal Expo örnek app oluştur**

Run:
```bash
cd ~/Documents/render-radar
npx create-expo-app@latest example --template blank-typescript
cd example
npm i
```
Expected: `example/` altında çalışan bir Expo projesi.

- [ ] **Step 3: Örnek ekranı yaz**

`example/App.tsx` içeriğini şununla değiştir:
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
      <Text style={{ textAlign: 'center' }}>Sayaç: {n}</Text>
      <Button title="Render tetikle" onPress={() => setN((x) => x + 1)} />
      <RenderRadar name="Box">
        <Box label="Bu kutu her render'da flash'lar" />
      </RenderRadar>
    </SafeAreaView>
  );
}
```

Not: `metro.config.js` ile `example`'ın bir üst klasördeki `src`'yi çözebilmesi
için watchFolders ayarı gerekebilir. En basit yol: örnek için `import { RenderRadar } from '../src'`
yerine paketi yerelden bağlamak (`npm pack` + kur) veya metro `watchFolders: [path.resolve(__dirname, '..')]`.

- [ ] **Step 4: Argent ile görsel doğrula**

Simülatörde örnek uygulamayı çalıştır; "Render tetikle"ye bas ve `Box`'ın
flash'ladığını + rozetin arttığını gözle doğrula. (Argent MCP: list-devices →
boot → launch → discovery → gesture-tap → screenshot.)

- [ ] **Step 5: GIF kaydet ve README'ye ekle**

Ekran kaydından `docs/demo.gif` üret, README'deki yer tutucu yolu eşleşsin.

- [ ] **Step 6: Commit**

```bash
git add README.md example docs/demo.gif
git commit -m "docs: README + Expo örnek app + demo GIF"
```

---

## Self-Review (yazım sonrası kontrol)

**Spec coverage:**
- Çekirdek (useRenderTracker, store, isDev) → Task 2,3,4 ✔
- 3 ağız: hook → Task 5, wrapper → Task 7, HOC → **Faz 2'ye ertelendi** (spec'te HOC Faz 2). ✔
- Flash border + badge → Task 6 ✔
- Dev-only no-op → Task 4,5,7 testleriyle doğrulandı ✔
- Ölçüm kirlenmemesi (araç izlenen component'i re-render etmez) → mimaride çözüldü: RenderRadarDev store'a abone DEĞİL; RadarOverlay abone ama izlenmiyor ✔
- Animated (Reanimated değil) → Task 6 ✔
- TS + builder-bob + Expo örnek + jest → Task 1, 8 ✔
- "Neden" diff'i, panel, Provider → **Faz 2/3, kapsam dışı** ✔

**Placeholder taraması:** Kod adımları tam; tek bilinçli yer tutucu `docs/demo.gif` (Task 8'de üretilir). Spec'te "TBD" yok.

**Type consistency:** `record(id,name,now)`, `get(id)`, `subscribeId(id,cb)`, `useRenderTracker(name): string`, `useRenderRadar(name, {log?}): number`, `RadarOverlay({id,color})`, `RenderRadar({name,color?,children})`, `RenderStat{id,name,count,lastRenderAt}` — tüm task'larda tutarlı ✔
