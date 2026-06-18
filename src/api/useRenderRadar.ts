import { useEffect, useRef } from 'react';
import { useRenderTracker } from '../core/useRenderTracker';

export function useRenderRadar(name: string, options?: { log?: boolean }): number {
  // Store'a kaydet (panel/görsel katman bunu okur) — ama AŞAĞIDA store'a
  // abone OLMUYORUZ. Aboneliğin tetiklediği yeniden render, useRenderTracker'ın
  // tekrar kaydetmesine yol açar ve sonsuz döngü oluştururdu.
  useRenderTracker(name);

  // Bu render kaçıncı render? Yerel ref ile sayıyoruz; store'dan bağımsız.
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
