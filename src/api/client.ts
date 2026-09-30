/** Simulated network latency so loading states behave like the real thing. */
export function mockResponse<T>(data: T, delayMs = 250): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), delayMs);
  });
}

// TODO(API): replace mockResponse with a fetch wrapper, e.g.
//   export async function apiGet<T>(path: string): Promise<T> {
//     const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, { credentials: 'include' });
//     if (!res.ok) throw new Error(`API ${res.status}`);
//     return res.json();
//   }
