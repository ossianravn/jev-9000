export function createLookup(fetcher) {
  const entries = new Map();
  return {
    get(key) {
      if (entries.has(key)) return Promise.resolve(entries.get(key));
      const pending = Promise.resolve().then(() => fetcher(key));
      entries.set(key, pending);
      pending.then(value => entries.set(key, value), () => {});
      return pending;
    },
    invalidate(key) { entries.delete(key); },
  };
}
