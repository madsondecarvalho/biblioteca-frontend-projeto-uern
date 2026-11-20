import { describe, expect, it } from "vitest";
import {
  authorSchema,
  bookSchema,
  categorySchema,
  copySchema,
  loginSchema,
  reservationSchema,
  userCreateSchema,
  userUpdateSchema,
} from "@/lib/schemas";

describe("loginSchema", () => {
  it("aceita email e senha válidos", () => {
    expect(
      loginSchema.safeParse({ email: "maria@uern.br", password: "senha123" })
        .success
    ).toBe(true);
  });

  it("rejeita email inválido", () => {
    const result = loginSchema.safeParse({
      email: "email-invalido",
      password: "senha123",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita senha vazia", () => {
    const result = loginSchema.safeParse({
      email: "maria@uern.br",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("bookSchema", () => {
  const valid = {
    title: "Dom Casmurro",
    authorId: 1,
    year: 1899,
    categoryId: 1,
  };

  it("aceita um livro válido", () => {
    expect(bookSchema.safeParse(valid).success).toBe(true);
  });

  it("converte strings numéricas", () => {
    const result = bookSchema.safeParse({
      title: "Dom Casmurro",
      authorId: "1",
      year: "1899",
      categoryId: "2",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.authorId).toBe(1);
      expect(result.data.year).toBe(1899);
      expect(result.data.categoryId).toBe(2);
    }
  });

  it("aceita categoria nula ou ausente", () => {
    expect(
      bookSchema.safeParse({ ...valid, categoryId: null }).success
    ).toBe(true);
    expect(
      bookSchema.safeParse({ title: "X", authorId: 1, year: 2000 }).success
    ).toBe(true);
  });

  it("rejeita título vazio", () => {
    expect(bookSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });

  it("rejeita autor inválido", () => {
    expect(bookSchema.safeParse({ ...valid, authorId: 0 }).success).toBe(false);
  });

  it("rejeita ano negativo ou muito no futuro", () => {
    expect(bookSchema.safeParse({ ...valid, year: -1 }).success).toBe(false);
    expect(
      bookSchema.safeParse({
        ...valid,
        year: new Date().getFullYear() + 2,
      }).success
    ).toBe(false);
  });
});

describe("authorSchema e categorySchema", () => {
  it("exigem nome preenchido", () => {
    expect(authorSchema.safeParse({ name: "" }).success).toBe(false);
    expect(categorySchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("aceitam nomes válidos", () => {
    expect(authorSchema.safeParse({ name: "Machado de Assis" }).success).toBe(
      true
    );
    expect(categorySchema.safeParse({ name: "Romance" }).success).toBe(true);
  });
});

describe("copySchema", () => {
  it("define AVAILABLE como status padrão", () => {
    const result = copySchema.safeParse({ code: "BC-001", bookId: "1" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("AVAILABLE");
      expect(result.data.bookId).toBe(1);
    }
  });

  it("aceita status válidos", () => {
    expect(
      copySchema.safeParse({
        code: "BC-001",
        bookId: 1,
        status: "MAINTENANCE",
      }).success
    ).toBe(true);
  });

  it("rejeita status inválido, código vazio e livro ausente", () => {
    expect(
      copySchema.safeParse({ code: "BC-001", bookId: 1, status: "INVALIDO" })
        .success
    ).toBe(false);
    expect(copySchema.safeParse({ code: "", bookId: 1 }).success).toBe(false);
    expect(copySchema.safeParse({ code: "BC-001" }).success).toBe(false);
  });
});

describe("userCreateSchema", () => {
  const valid = {
    name: "Maria",
    email: "maria@uern.br",
    password: "senha123",
  };

  it("aceita usuário válido com role padrão user", () => {
    const result = userCreateSchema.safeParse(valid);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("user");
    }
  });

  it("aceita role admin", () => {
    expect(
      userCreateSchema.safeParse({ ...valid, role: "admin" }).success
    ).toBe(true);
  });

  it("rejeita email inválido, senha curta e role inválida", () => {
    expect(
      userCreateSchema.safeParse({ ...valid, email: "invalido" }).success
    ).toBe(false);
    expect(
      userCreateSchema.safeParse({ ...valid, password: "123" }).success
    ).toBe(false);
    expect(
      userCreateSchema.safeParse({ ...valid, role: "super" }).success
    ).toBe(false);
  });
});

describe("userUpdateSchema", () => {
  it("aceita objeto vazio para edição parcial", () => {
    expect(userUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("aceita strings vazias (campos não alterados)", () => {
    const result = userUpdateSchema.safeParse({
      name: "",
      email: "",
      password: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita email inválido quando informado", () => {
    expect(userUpdateSchema.safeParse({ email: "invalido" }).success).toBe(
      false
    );
  });

  it("rejeita senha curta quando informada", () => {
    expect(userUpdateSchema.safeParse({ password: "123" }).success).toBe(false);
  });
});

describe("reservationSchema", () => {
  it("converte copyId para número", () => {
    const result = reservationSchema.safeParse({ copyId: "11" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.copyId).toBe(11);
    }
  });

  it("rejeita copyId inválido", () => {
    expect(reservationSchema.safeParse({ copyId: 0 }).success).toBe(false);
  });
});
