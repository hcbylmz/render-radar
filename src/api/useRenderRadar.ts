import { useEffect, useRef } from 'react';
import { useRenderTracker } from '../core/useRenderTracker';

export function useRenderRadar(name: string, options?: { log?: boolean }): number {
  // Record to the store (the panel / visual layer reads this) — but we do NOT
  // subscribe to the store below. A subscription-triggered re-render would make
  // useRenderTracker record again, creating an infinite render loop.
  useRenderTracker(name);

  // Which render number is this? Counted locally via a ref, independent of the store.
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
