import axios from "axios";

export const apiBaseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

export const api = axios.create({
  baseURL: apiBaseURL,
  headers: { "Content-Type": "application/json" },
});

// Injeta JWT do localStorage em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      // Se a base da API for o próprio front, o POST cai numa página Next
      // (que responde 405). Avisa no console para facilitar o diagnóstico.
      const base = new URL(config.baseURL ?? apiBaseURL, window.location.origin);
      if (base.origin === window.location.origin) {
        console.warn(
          `[biblioteca] NEXT_PUBLIC_API_URL aponta para o próprio front (${base.origin}). ` +
            `O login vai falhar com 405. Configure a variável na Vercel com a URL da API (…/api) e faça redeploy.`
        );
      }
    } catch {
      // URL relativa ou inválida — ignora
    }
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
