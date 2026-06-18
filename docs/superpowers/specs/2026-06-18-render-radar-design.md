# Render Radar — Design Document

**Date:** 2026-06-18
**Status:** Approved (design), implementation plan pending
**Package name:** `render-radar` (available on npm — 404 as of 2026-06-18)

---

## 1. Purpose

A development-mode (dev-only) diagnostic tool that lets React Native developers **see unnecessary re-renders with the naked eye**. Whenever a component renders, its border flashes, a counter is shown, and (in later phases) it tells you **why** the render happened.

### The gap it fills
- Flipper is now deprecated.
- React DevTools' "highlight updates" feature is clunky in RN and tedious to set up.
- There is no lightweight, zero-config, in-app alternative.

### Target audience
Intermediate RN developers; those who want to visually understand performance / `memo` / `useCallback` behavior.

### Success criteria
- Works with `npm i -D render-radar` plus a single line of code.
- **Completely no-op** in production (zero runtime cost, tree-shakeable).
- The tool itself does not re-render the component it tracks (does not pollute the counter).
- Works on Expo and bare RN (pure JS, no mandatory native dependency).
- Its value is clear within 5 seconds via a GIF in the README.

---

## 2. Architecture — "One brain, three mouths"

All public APIs use the same core.

### 2.1 Core

**`useRenderTracker(name, props?)`** (internal hook)
- Increments a `useRef` counter on every render.
- Keeps the previous props in a ref; takes a **shallow diff** against the new props → which key changed, whether the reference changed.
- Writes the render event to the central store: `{ id, name, count, timestamp, changedKeys }`.

**Central store (`store.ts`)** — lightweight pub/sub
- Keeps stats outside the render loop.
- Consumers subscribe via `useSyncExternalStore`.
- **Critical design rule:** a store update MUST NOT cause the tracked component to re-render — otherwise the tool corrupts its own measurement. The overlay and the panel subscribe to the store separately.

**`isDev.ts`** — environment gate
- When `__DEV__` is false, all public APIs return early / render only `children`.

### 2.2 Usage layers (three mouths + provider)

1. **Hook** — `useRenderRadar(name, props?)`: called from inside a component. A thin wrapper around the core.
2. **Wrapper** — `<RenderRadar name="Card"><Card/></RenderRadar>`: wraps the children, automatically draws the flash + badge.
3. **HOC** — `withRenderRadar(Card, name?)`: convenience wrapper (Phase 2).
4. **Provider (Phase 3)** — `<RadarProvider>`: **automatically** tracks the subtree using React's `<Profiler>` API; feeds the same store.

### 2.3 Visual layer

- **Flash border** — an absolutely positioned overlay View around the frame of the tracked element measured via `onLayout`; opacity/border animation on render.
- **Badge** — a small counter pill (render count).
- **"Why" hint (Phase 2)** — shows the changed prop keys (e.g., "`props.user` changed — new reference").
- **Hotspot panel (Phase 3)** — a draggable floating panel; ranks the most-rendered components; reset button.
- **Animation adapter (`FlashDriver`)** — the default is the built-in `Animated`; if `react-native-reanimated` is installed it automatically uses that instead. Both drivers implement a small common interface.

---

## 3. Data flow

```
a render happens
  → useRenderTracker: counter++ , prev/next prop diff
  → an event is written to the store { id, name, count, changedKeys }
  → (a) the FlashOverlay subscribed to that id flashes + updates the badge
  → (b) the HotspotPanel subscribed to all events refreshes the ranking
```

A store update does not affect the tracked component, only the overlay/panel (thanks to the external store).

---

## 4. Phasing — each phase can be released independently

### Phase 1 — MVP (first npm release)
- Core: `useRenderTracker`, `store`, `isDev`.
- `useRenderRadar` hook + `<RenderRadar>` wrapper.
- Flash border + count badge, using the **built-in Animated API**.
- Dev-only no-op behavior.
- TypeScript types.
- Expo example app + README + GIF.

### Phase 2 — "Why"
- Prop/state shallow diff → display of changed keys.
- `withRenderRadar` HOC.

### Phase 3 — Automatic + panel
- `<RadarProvider>` + automatic tracking via React `<Profiler>`.
- Draggable hotspot panel (sorted + reset).
- Optional Reanimated `FlashDriver` adapter.

---

## 5. File structure (each file has a single responsibility)

```
src/
  core/
    useRenderTracker.ts   # counting + diff + reporting
    store.ts              # pub/sub external store
    isDev.ts              # environment gate
  api/
    useRenderRadar.ts     # hook mouth
    RenderRadar.tsx       # wrapper mouth
    withRenderRadar.tsx   # HOC mouth (Phase 2)
  overlay/
    FlashOverlay.tsx      # measurement + flash + badge
    flashDriver/
      animated.ts         # built-in Animated driver
      reanimated.ts       # optional Reanimated driver (Phase 3)
  panel/
    RadarProvider.tsx     # Profiler automatic tracking (Phase 3)
    HotspotPanel.tsx      # sorted panel (Phase 3)
  index.ts
example/                  # Expo application (manual testing + README GIF)
```

---

## 6. Tooling & testing

- **Language:** TypeScript.
- **Build:** `react-native-builder-bob` (the RN library standard).
- **Example app:** Expo (works on both Expo and bare; pure JS).
- **Tests (jest + @testing-library/react-native):**
  - Does the core render count increment correctly?
  - Diff logic: does it correctly detect the changed keys and the reference change?
  - Full no-op when `__DEV__ = false`: the hook does nothing, the wrapper renders the children unchanged.
  - The wrapper does not break the output of the wrapped tree.

---

## 7. Out of scope (YAGNI)

- Timeline recording and export.
- Network/Redux/navigation integration.
- Web (react-native-web) support — not targeted in the first release.
- Deep diff of the render *cause* — shallow diff only.

---

## 8. Open risks / things to watch

- **Measurement pollution:** the tool's own render must not bleed into the tracked component (solved via the external store).
- **Layout measurement:** `onLayout` is async; the first flash may be delayed by one frame — acceptable.
- **Reanimated optionality:** keeping both drivers maintained is extra overhead; that's why Reanimated is deferred to Phase 3.
