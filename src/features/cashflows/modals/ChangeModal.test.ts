import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const existing = {
  id: 5,
  type: "outflow" as const,
  source: "savings" as const,
  label: "alat-elektronik",
  description: "Keyboard dan mouse",
  nominal: 400000,
};

describe("ChangeModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="edit-cashflow-modal"]').exists()).toBe(false);
  });

  it("should keep the form empty when no cash flow is loaded", () => {
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, cashFlowId: 5 } });
    expect((wrapper.find('[data-testid="edit-cashflow-label-input"]').element as HTMLInputElement).value).toBe("");
  });

  it("should fill the form from the store", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 5 },
      preloadedState: { cashFlow: existing },
    });
    expect((wrapper.find('[data-testid="edit-cashflow-label-input"]').element as HTMLInputElement).value).toBe(
      "alat-elektronik"
    );
    expect((wrapper.find('[data-testid="edit-cashflow-type-select"]').element as HTMLSelectElement).value).toBe(
      "outflow"
    );
  });

  it("should fetch detail and labels when opened with an id", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(ChangeModal, {
      props: { show: false, cashFlowId: 5 },
    });
    const detailSpy = vi.spyOn(cashFlowsStore, "asyncSetCashFlow").mockResolvedValue(undefined);
    const labelsSpy = vi.spyOn(cashFlowsStore, "asyncSetLabels").mockResolvedValue(undefined);

    await wrapper.setProps({ show: true });
    expect(detailSpy).toHaveBeenCalledWith(5);
    expect(labelsSpy).toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");

    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should not fetch when there is no id", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(ChangeModal, { props: { show: false } });
    const detailSpy = vi.spyOn(cashFlowsStore, "asyncSetCashFlow").mockResolvedValue(undefined);
    await wrapper.setProps({ show: true });
    expect(detailSpy).not.toHaveBeenCalled();
  });

  it("should show validation error", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 5 },
      preloadedState: { cashFlow: existing },
    });

    await wrapper.find('[data-testid="edit-cashflow-label-input"]').setValue("  ");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Label tidak boleh kosong");
  });

  it("should submit changes, emit saved and close on success", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 5 },
      preloadedState: { cashFlow: existing },
    });
    const changeSpy = vi.spyOn(cashFlowsStore, "asyncSetIsCashFlowChange").mockResolvedValue(undefined);

    await wrapper.find('[data-testid="edit-cashflow-nominal-input"]').setValue("500000");
    await wrapper.find("form").trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(5, {
      type: "outflow",
      source: "savings",
      label: "alat-elektronik",
      description: "Keyboard dan mouse",
      nominal: 500000,
    });

    cashFlowsStore.setIsCashFlowChange(true);
    cashFlowsStore.setIsCashFlowChanged(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("saved")).toBeTruthy();
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("should stay open when update fails", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 5 },
    });
    cashFlowsStore.setIsCashFlowChange(true);
    cashFlowsStore.setIsCashFlowChanged(false);
    await new Promise((r) => setTimeout(r, 10));
    expect(wrapper.emitted("close")).toBeFalsy();
  });

  it("should close with close and cancel buttons", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true } });
    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-edit-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });
});
