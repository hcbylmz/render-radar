// React Native global'i __DEV__'i ve (RN dışı ortamlar için) process'i
// ambient olarak bildiriyoruz; böylece @types/node bağımlılığı gerekmez.
declare const __DEV__: boolean | undefined;
declare const process: { env?: { NODE_ENV?: string } } | undefined;

export function isDev(): boolean {
  if (typeof __DEV__ !== 'undefined') return __DEV__;
  if (typeof process !== 'undefined' && process?.env) {
    return process.env.NODE_ENV !== 'production';
  }
  return true;
}
