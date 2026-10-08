import type { CashFlowPayload, CashFlowSource, CashFlowType } from "./api/cashFlowApi";

export interface CashFlowFormValue {
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  description: string;
  nominal: number | string;
}

export function emptyCashFlowForm(): CashFlowFormValue {
  return {
    type: "inflow",
    source: "cash",
    label: "",
    description: "",
    nominal: "",
  };
}

export function validateCashFlowForm(form: CashFlowFormValue): string | null {
  if (!form.label.trim()) {
    return "Label tidak boleh kosong";
  }
  if (!(Number(form.nominal) > 0)) {
    return "Nominal harus lebih dari 0";
  }
  if (!form.description.trim()) {
    return "Keterangan tidak boleh kosong";
  }
  return null;
}

export function toPayload(form: CashFlowFormValue): CashFlowPayload {
  return {
    type: form.type,
    source: form.source,
    label: form.label.trim(),
    description: form.description.trim(),
    nominal: Number(form.nominal),
  };
}
