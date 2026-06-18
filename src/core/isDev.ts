// Ambient-declare React Native's __DEV__ global and (for non-RN environments)
// process, so we don't need an @types/node dependency.
declare const __DEV__: boolean | undefined;
declare const process: { env?: { NODE_ENV?: string } } | undefined;

export function isDev(): boolean {
  if (typeof __DEV__ !== 'undefined') return __DEV__;
  if (typeof process !== 'undefined' && process?.env) {
    return process.env.NODE_ENV !== 'production';
  }
  return true;
}
