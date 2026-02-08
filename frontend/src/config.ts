// Prefer runtime env (window.ENV) over build-time env
export const API_BASE_URL =
  (typeof window !== "undefined" ? window.ENV?.API_BASE_URL : undefined) ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8080";
