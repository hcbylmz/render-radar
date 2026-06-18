declare const __DEV__: boolean | undefined;

export function isDev(): boolean {
  if (typeof __DEV__ !== 'undefined') return __DEV__;
  return process.env.NODE_ENV !== 'production';
}
