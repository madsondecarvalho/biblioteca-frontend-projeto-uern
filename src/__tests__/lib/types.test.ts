import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "@/lib/types";

describe("getApiErrorMessage", () => {
  it("extrai a mensagem de erro da API", () => {
    expect(
      getApiErrorMessage({
        response: { data: { error: "Cópia não está disponível" } },
      })
    ).toBe("Cópia não está disponível");
  });

  it("inclui os problemas de validação (issues)", () => {
    expect(
      getApiErrorMessage({
        response: {
          data: {
            error: "Dados inválidos",
            issues: [
              { field: "email", message: "Email inválido" },
              { field: "password", message: "Senha curta" },
            ],
          },
        },
      })
    ).toBe("Dados inválidos: email: Email inválido; password: Senha curta");
  });

  it("ignora issues quando a lista está vazia", () => {
    expect(
      getApiErrorMessage({
        response: { data: { error: "Erro", issues: [] } },
      })
    ).toBe("Erro");
  });

  it("usa a mensagem do Error quando não há resposta da API", () => {
    expect(getApiErrorMessage(new Error("Falha de rede"))).toBe(
      "Falha de rede"
    );
  });

  it("retorna o fallback para valores desconhecidos", () => {
    expect(getApiErrorMessage(null)).toBe("Ocorreu um erro");
    expect(getApiErrorMessage("texto")).toBe("Ocorreu um erro");
    expect(getApiErrorMessage({})).toBe("Ocorreu um erro");
  });

  it("permite um fallback personalizado", () => {
    expect(getApiErrorMessage(undefined, "Erro ao salvar")).toBe(
      "Erro ao salvar"
    );
  });
});
