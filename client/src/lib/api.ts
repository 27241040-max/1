const DEFAULT_API_HOST = "localhost";
const DEFAULT_API_PORT = "4000";

function getDefaultApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}`;
  }

  const protocol = window.location.protocol || "http:";
  const hostname = window.location.hostname || DEFAULT_API_HOST;

  return `${protocol}//${hostname}:${DEFAULT_API_PORT}`;
}

export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL?.trim() || getDefaultApiBaseUrl()
).replace(/\/$/, "");

export function createApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}
