/**
 * Safe fetch JSON helper that avoids "SyntaxError: Unexpected token '<'"
 * when an API route returns HTML (such as 404/500/SPA fallback) or network fails.
 */
export async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    // Network error or aborted request
    return null;
  }
}
