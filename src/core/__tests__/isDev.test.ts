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
