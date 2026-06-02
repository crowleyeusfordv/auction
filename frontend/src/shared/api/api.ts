async function request<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown, headers?: HeadersInit): Promise<T> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}`);
  }
  return res.json();
}


export const api = {
  get: <T>(path: string, headers?: HeadersInit) => request<T>("GET", path, null, headers),
  post: <T>(path: string, body: unknown, headers?: HeadersInit) => request<T>("POST", path, body, headers),
  put: <T>(path: string, body: unknown, headers?: HeadersInit) => request<T>("PUT", path, body, headers),
  patch: <T>(path: string, body: unknown, headers?: HeadersInit) => request<T>("PATCH", path, body, headers),
  delete: <T>(path: string, headers?: HeadersInit) => request<T>("DELETE", path, null, headers),
};