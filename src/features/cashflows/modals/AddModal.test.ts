import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

async function fillForm(wrapper: any, overrides: Record<string, string> = {}) {
  const values = {
    label: "gaji",
    nominal: "2500000",
    description: "Gaji bulanan",
    ...overrides,
  };
  await wrapper.find('[data-testid="add-cashflow-label-input"]').setValue(values.label);
  await wrapper.find('[data-testid="add-cashflow-nominal-input"]').setValue(values.nominal);
  await wrapper.find('[data-testid="add-cashflow-description-input"]').setValue(values.description);
}

describe("AddModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="add-cashflow-modal"]').exists()).toBe(false);
  });

  it("should validate label, nominal and description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("Label tidak boleh kosong");

    await wrapper.find('[data-testid="add-cashflow-label-input"]').setValue("gaji");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("Nominal harus lebih dari 0");

    await wrapper.find('[data-testid="add-cashflow-nominal-input"]').setValue("1000");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("Keterangan tidak boleh kosong");
  });

  it("should dispatch add action, emit saved and close on success", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(AddModal, { props: { show: true } });
    const addSpy = vi.spyOn(cashFlowsStore, "asyncSetIsCashFlowAdd").mockResolvedValue(undefined);

    await wrapper.find('[data-testid="add-cashflow-type-select"]').setValue("outflow");
    await wrapper.find('[data-testid="add-cashflow-source-select"]').setValue("savings");
    await fillForm(wrapper);
    expect(wrapper.find('[data-testid="add-nominal-preview"]').text()).toContain("2.500.000");

    await wrapper.find("form").trigger("submit");
    expect(addSpy).toHaveBeenCalledWith({
      type: "outflow",
      source: "savings",
      label: "gaji",
      description: "Gaji bulanan",
      nominal: 2500000,
    });
    expect(wrapper.find('[data-testid="submit-add-modal-btn"]').text()).toContain("Menyimpan");

    cashFlowsStore.setIsCashFlowAdd(true);
    cashFlowsStore.setIsCashFlowAdded(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("saved")).toBeTruthy();
    expect(wrapper.emitted("close")).toBeTruthy();
    expect((wrapper.find('[data-testid="add-cashflow-label-input"]').element as HTMLInputElement).value).toBe("");
  });

  it("should stay open when add fails", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(AddModal, { props: { show: true } });

    cashFlowsStore.setIsCashFlowAdd(true);
    cashFlowsStore.setIsCashFlowAdded(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("close")).toBeFalsy();
    expect(cashFlowsStore.isCashFlowAdd).toBe(false);
  });

  it("should close with close and cancel buttons", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    await wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });

  it("should toggle body scroll and load labels when shown", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(AddModal, { props: { show: false } });
    const labelsSpy = vi.spyOn(cashFlowsStore, "asyncSetLabels").mockResolvedValue(undefined);

    await wrapper.setProps({ show: true });
    expect(document.body.style.overflow).toBe("hidden");
    expect(labelsSpy).toHaveBeenCalled();

    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should render label suggestions from store", () => {
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true },
      preloadedState: { labels: ["gaji", "makan"] },
    });
    expect(wrapper.findAll("datalist option").length).toBe(2);
  });
});
