import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Injeta JWT do localStorage em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("biblioteca:token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 401 -> limpa sessão e redireciona para /login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      const url: string = error?.config?.url ?? "";
      // Não deslogar na própria tentativa de login
      if (!url.includes("/login")) {
        window.localStorage.removeItem("biblioteca:token");
        window.localStorage.removeItem("biblioteca:user");
        if (window.location.pathname !== "/login") {
          // Interceptor axios (fora do React): redirect nativo é intencional aqui
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}
