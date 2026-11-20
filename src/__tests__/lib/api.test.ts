import { describe, expect, it } from "vitest";
import { buildQuery } from "@/lib/api";

describe("buildQuery", () => {
  it("retorna string vazia sem parâmetros", () => {
    expect(buildQuery({})).toBe("");
  });

  it("monta a query string na ordem dos parâmetros", () => {
    expect(buildQuery({ page: 1, limit: 10 })).toBe("?page=1&limit=10");
  });

  it("ignora valores undefined, null e string vazia", () => {
    expect(
      buildQuery({
        page: 1,
        categoryId: undefined,
        authorId: null,
        status: "",
      })
    ).toBe("?page=1");
  });

  it("mantém números zero e booleanos", () => {
    expect(buildQuery({ page: 0, active: false })).toBe("?page=0&active=false");
  });

  it("codifica caracteres especiais", () => {
    expect(buildQuery({ q: "Dom Casmurro & cia" })).toBe(
      "?q=Dom+Casmurro+%26+cia"
    );
  });
});
