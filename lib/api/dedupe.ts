const inFlight = new Map<string, Promise<unknown>>();

export function dedupeInFlight<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = factory().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}