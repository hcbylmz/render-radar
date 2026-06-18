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
