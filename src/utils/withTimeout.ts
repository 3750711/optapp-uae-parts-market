export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}