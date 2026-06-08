const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z\d+\-.]*:|\/\/)/i;

function cleanEnvUrl(value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return "";
  }

  return trimmed.replace(/\/+$/, "");
}

function toWebSocketUrl(baseUrl: string): string {
  if (baseUrl) {
    return baseUrl.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
  }

  if (typeof window === "undefined") {
    return "";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

function upgradeMixedContentUrl(value: string): string {
  if (typeof window === "undefined" || window.location.protocol !== "https:") {
    return value;
  }

  if (!value.toLowerCase().startsWith("http://")) {
    return value;
  }

  try {
    const url = new URL(value);
    url.protocol = "https:";
    return url.toString();
  } catch {
    return value;
  }
}

export const API_BASE_URL = cleanEnvUrl(import.meta.env.VITE_API_BASE_URL);
export const WEBSOCKET_BASE_URL =
  cleanEnvUrl(import.meta.env.VITE_WEBSOCKET_API_BASE_URL) || toWebSocketUrl(API_BASE_URL);

export function buildApiUrl(path: string): string {
  if (ABSOLUTE_URL_PATTERN.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

export function resolveMediaUrl(src: string | null | undefined): string | undefined {
  const value = src?.trim();

  if (!value) {
    return undefined;
  }

  if (ABSOLUTE_URL_PATTERN.test(value)) {
    return upgradeMixedContentUrl(value);
  }

  if (value.startsWith("/uploads/") || value.startsWith("uploads/")) {
    return buildApiUrl(value.startsWith("/") ? value : `/${value}`);
  }

  return value;
}
