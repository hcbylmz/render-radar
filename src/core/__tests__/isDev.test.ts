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
