import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAllAuthors,
  useAllCategories,
  useAuthors,
  useBook,
  useBooks,
  useCategories,
  useCopies,
  useReservation,
  useReservations,
  useUsers,
} from "@/lib/hooks";
import {
  getBook,
  getReservation,
  listAuthors,
  listBooks,
  listCategories,
  listCopies,
  listReservations,
  listUsers,
} from "@/lib/services";
import {
  authorsPage,
  bookDomCasmurro,
  booksPage,
  categoriesPage,
  copiesPage,
  reservationsPage,
  usersPage,
} from "@/test/fixtures";
import { createTestQueryClient } from "@/test/render";

vi.mock("@/lib/services", () => ({
  listBooks: vi.fn(),
  getBook: vi.fn(),
  listAuthors: vi.fn(),
  listCategories: vi.fn(),
  listCopies: vi.fn(),
  listReservations: vi.fn(),
  getReservation: vi.fn(),
  listUsers: vi.fn(),
}));

const mockListBooks = vi.mocked(listBooks);
const mockGetBook = vi.mocked(getBook);
const mockListAuthors = vi.mocked(listAuthors);
const mockListCategories = vi.mocked(listCategories);
const mockListCopies = vi.mocked(listCopies);
const mockListReservations = vi.mocked(listReservations);
const mockGetReservation = vi.mocked(getReservation);
const mockListUsers = vi.mocked(listUsers);

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("hooks de consulta", () => {
  beforeEach(() => {
    mockListBooks.mockResolvedValue(booksPage);
    mockGetBook.mockResolvedValue(bookDomCasmurro);
    mockListAuthors.mockResolvedValue(authorsPage);
    mockListCategories.mockResolvedValue(categoriesPage);
    mockListCopies.mockResolvedValue(copiesPage);
    mockListReservations.mockResolvedValue(reservationsPage);
    mockGetReservation.mockResolvedValue(reservationsPage.data[0]);
    mockListUsers.mockResolvedValue(usersPage);
  });

  it("useBooks chama listBooks com os filtros", async () => {
    const { result } = renderHook(() => useBooks({ page: 2, limit: 5 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockListBooks).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(result.current.data).toEqual(booksPage);
  });

  it("useBooks expõe estado de erro", async () => {
    mockListBooks.mockRejectedValue(new Error("falha na API"));

    const { result } = renderHook(() => useBooks({ page: 1, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error("falha na API"));
  });

  it("useBook só busca quando o id está definido", async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: number | string | undefined }) => useBook(id),
      {
        wrapper: createWrapper(),
        initialProps: { id: undefined as number | string | undefined },
      }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetBook).not.toHaveBeenCalled();

    rerender({ id: "7" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetBook).toHaveBeenCalledWith("7");
    expect(result.current.data).toEqual(bookDomCasmurro);
  });

  it("useAuthors e useAllAuthors consultam listAuthors", async () => {
    const pageHook = renderHook(() => useAuthors(2, 5), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(pageHook.result.current.isSuccess).toBe(true));
    expect(mockListAuthors).toHaveBeenCalledWith(2, 5);

    const allHook = renderHook(() => useAllAuthors(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(allHook.result.current.isSuccess).toBe(true));
    expect(mockListAuthors).toHaveBeenCalledWith(1, 100);
  });

  it("useCategories e useAllCategories consultam listCategories", async () => {
    const pageHook = renderHook(() => useCategories(3, 10), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(pageHook.result.current.isSuccess).toBe(true));
    expect(mockListCategories).toHaveBeenCalledWith(3, 10);

    const allHook = renderHook(() => useAllCategories(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(allHook.result.current.isSuccess).toBe(true));
    expect(mockListCategories).toHaveBeenCalledWith(1, 100);
  });

  it("useCopies chama listCopies com os filtros", async () => {
    const filters = { page: 1, limit: 10, bookId: 1, status: "AVAILABLE" as const };
    const { result } = renderHook(() => useCopies(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockListCopies).toHaveBeenCalledWith(filters);
  });

  it("useReservations chama listReservations com os filtros", async () => {
    const filters = { page: 1, limit: 10, status: "PENDING" as const };
    const { result } = renderHook(() => useReservations(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockListReservations).toHaveBeenCalledWith(filters);
  });

  it("useReservation busca apenas com id definido", async () => {
    const { result } = renderHook(() => useReservation("101"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetReservation).toHaveBeenCalledWith("101");

    const disabled = renderHook(() => useReservation(undefined), {
      wrapper: createWrapper(),
    });
    expect(disabled.result.current.fetchStatus).toBe("idle");
  });

  it("useUsers chama listUsers com paginação", async () => {
    const { result } = renderHook(() => useUsers(2, 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockListUsers).toHaveBeenCalledWith(2, 5);
  });
});
