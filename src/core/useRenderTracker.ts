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

  // Record AFTER commit — never mutate the store during render.
  // No dependency array: this runs after every commit.
  useEffect(() => {
    if (!isDev()) return;
    renderStore.record(id, name, Date.now());
  });

  return id;
}
