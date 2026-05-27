import { describe, expect, it } from "vitest";

import { iniciaisAvatar, maskTelefoneBR, unmaskTelefone } from "./format";

describe("maskTelefoneBR", () => {
  it("formata telefone celular BR com 11 dígitos", () => {
    expect(maskTelefoneBR("11999998888")).toBe("(11) 99999-8888");
  });

  it("formata telefone fixo BR com 10 dígitos", () => {
    expect(maskTelefoneBR("1133334444")).toBe("(11) 3333-4444");
  });
});

describe("unmaskTelefone", () => {
  it("remove máscara e mantém apenas dígitos", () => {
    expect(unmaskTelefone("(11) 99999-8888")).toBe("11999998888");
  });
});

describe("iniciaisAvatar", () => {
  it("retorna até duas iniciais em maiúsculas", () => {
    expect(iniciaisAvatar("Maria Silva")).toBe("MS");
    expect(iniciaisAvatar("joão")).toBe("J");
  });
});
