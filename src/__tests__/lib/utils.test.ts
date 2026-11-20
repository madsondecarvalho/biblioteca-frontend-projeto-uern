import { describe, expect, it } from "vitest";
import { cn, formatDateBR } from "@/lib/utils";

describe("cn", () => {
  it("combina classes CSS", () => {
    expect(cn("px-2", "text-sm")).toBe("px-2 text-sm");
  });

  it("resolve conflitos do Tailwind mantendo a última classe", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignora valores falsy", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("formatDateBR", () => {
  it("retorna travessão para valores vazios", () => {
    expect(formatDateBR(undefined)).toBe("—");
    expect(formatDateBR(null)).toBe("—");
    expect(formatDateBR("")).toBe("—");
  });

  it("formata uma data ISO em pt-BR com data e hora", () => {
    const iso = new Date(2025, 0, 15, 10, 30).toISOString();
    const formatted = formatDateBR(iso);

    expect(formatted).toMatch(/15\/01\/2025/);
    expect(formatted).toContain("10:30");
  });

  it("retorna o valor original quando a data é inválida", () => {
    expect(formatDateBR("data-invalida")).toBe("data-invalida");
  });
});
