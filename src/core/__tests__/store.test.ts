import { RenderStore } from '../store';

describe('RenderStore', () => {
  it('increments count on every record', () => {
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

  it('subscribeId fires only when the matching id changes', () => {
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
