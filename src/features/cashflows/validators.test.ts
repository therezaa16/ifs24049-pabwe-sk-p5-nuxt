import { describe, it, expect } from "vitest";
import { emptyCashFlowForm, toPayload, validateCashFlowForm } from "./validators";

describe("validators", () => {
  it("should create an empty form with defaults", () => {
    expect(emptyCashFlowForm()).toEqual({
      type: "inflow",
      source: "cash",
      label: "",
      description: "",
      nominal: "",
    });
  });

  it("should validate label, nominal and description in order", () => {
    const form = emptyCashFlowForm();
    expect(validateCashFlowForm(form)).toBe("Label tidak boleh kosong");

    form.label = "gaji";
    expect(validateCashFlowForm(form)).toBe("Nominal harus lebih dari 0");

    form.nominal = 0;
    expect(validateCashFlowForm(form)).toBe("Nominal harus lebih dari 0");

    form.nominal = "5000";
    expect(validateCashFlowForm(form)).toBe("Keterangan tidak boleh kosong");

    form.description = "Gaji bulanan";
    expect(validateCashFlowForm(form)).toBeNull();
  });

  it("should convert the form into an API payload", () => {
    expect(
      toPayload({
        type: "outflow",
        source: "savings",
        label: "  makan ",
        description: " siang  ",
        nominal: "25000",
      })
    ).toEqual({
      type: "outflow",
      source: "savings",
      label: "makan",
      description: "siang",
      nominal: 25000,
    });
  });
});
