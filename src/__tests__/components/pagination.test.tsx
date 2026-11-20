import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Pagination } from "@/components/pagination";
import { makePagination } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";

describe("Componente Pagination", () => {
  it("não renderiza nada sem dados de paginação", () => {
    const { container } = renderWithProviders(
      <Pagination onChange={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("exibe o resumo da página atual", () => {
    renderWithProviders(
      <Pagination
        pagination={makePagination({
          page: 2,
          totalPages: 3,
          total: 25,
          limit: 10,
        })}
        onChange={vi.fn()}
      />
    );

    expect(
      screen.getByText("Página 2 de 3 — 25 registro(s) (10 por página)")
    ).toBeInTheDocument();
  });

  it("desabilita Anterior na primeira página e Próxima na última", () => {
    const { rerender } = renderWithProviders(
      <Pagination
        pagination={makePagination({ page: 1, totalPages: 1 })}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();

    rerender(
      <Pagination
        pagination={makePagination({ page: 2, totalPages: 2 })}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("chama onChange com a página anterior e a próxima", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <Pagination
        pagination={makePagination({ page: 2, totalPages: 3 })}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(onChange).toHaveBeenNthCalledWith(1, 1);

    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(onChange).toHaveBeenNthCalledWith(2, 3);
  });
});
