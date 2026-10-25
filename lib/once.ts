const store = globalThis as unknown as { __onceTasks?: Map<string, Promise<unknown>> };

/**
 * Egy aszinkron feladatot (pl. adatbázis-indexek létrehozása) folyamatonként csak egyszer futtat le,
 * a további hívások azonnal a már kész eredményt kapják. Hiba esetén a következő hívás újrapróbálja.
 */
export function once<T>(key: string, task: () => Promise<T>): Promise<T> {
  const tasks = (store.__onceTasks ||= new Map());
  const existing = tasks.get(key);
  if (existing) return existing as Promise<T>;
  const promise = task().catch((err) => {
    tasks.delete(key);
    throw err;
  });
  tasks.set(key, promise);
  return promise;
}
