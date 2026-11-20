import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import NotFound from "@/app/not-found";
import { renderWithProviders } from "@/test/render";

describe("Página 404 (not-found)", () => {
  it("exibe a mensagem de página não encontrada", () => {
    renderWithProviders(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "404" })
    ).toBeInTheDocument();
    expect(screen.getByText("Página não encontrada.")).toBeInTheDocument();
  });

  it("oferece um link para voltar ao início", () => {
    renderWithProviders(<NotFound />);

    const link = screen.getByRole("link", { name: "Voltar ao início" });
    expect(link).toHaveAttribute("href", "/");
  });
});
