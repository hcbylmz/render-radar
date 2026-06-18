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
    const unsub = s.subscribe(() => {
      n += 1;
    });
    s.record('a', 'A', 1);
    expect(n).toBe(1);
    unsub();
    s.record('a', 'A', 2);
    expect(n).toBe(1);
  });
});
