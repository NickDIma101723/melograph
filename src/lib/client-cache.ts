interface CacheItem<T> {
  value: T;
  expiry: number;
}

export const getCache = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = new Date().getTime();

    if (now > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch (err) {
      console.warn('Cache parsing failed', err);
      return null;
  }
};

export const setCache = <T>(key: string, value: T, ttlInMinutes: number) => {
  if (typeof window === 'undefined') return;
  const now = new Date().getTime();
  const item: CacheItem<T> = {
    value,
    expiry: now + ttlInMinutes * 60 * 1000,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

/**
 * Safely parse a fetch Response as JSON.
 * If the response body is not valid JSON (e.g. an HTML error page from a proxy),
 * returns the fallback value instead of throwing.
 */
export async function safeJson<T = any>(res: Response, fallback: T | null = null): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error(`Expected JSON but got: ${text.slice(0, 120)}...`);
    return fallback as T;
  }
}
