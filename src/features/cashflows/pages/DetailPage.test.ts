import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { createMemoryHistory } from "vue-router";
import DetailPage from "./DetailPage.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import { renderWithProviders } from "../../../test-utils";
import { createAppRouter } from "../../../router";
import cashFlowApi from "../api/cashFlowApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

const profile = { id: 1, name: "Tester", email: "tester@delcom.org" };

const inflow = {
  id: 5,
  type: "inflow" as const,
  source: "cash" as const,
  label: "gaji",
  description: "Gaji bulanan",
  nominal: 2500000,
  created_at: "2026-10-05T11:26:45.000000Z",
  updated_at: "2026-10-05T11:26:48.000000Z",
};

const outflow = { ...inflow, id: 6, type: "outflow" as const, source: "loans" as const, label: "cicilan" };

async function mountAt(path: string, state: Record<string, any> = { profile }) {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  const result = renderWithProviders(DetailPage, { router, preloadedState: state });
  await flushPromises();
  return result;
}

describe("DetailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("should show spinner and skip loading when there is no id", async () => {
    const spy = vi.spyOn(cashFlowApi, "getCashFlowById");
    const { wrapper } = await mountAt("/");
    expect(spy).not.toHaveBeenCalled();
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("should render inflow detail", async () => {
    vi.spyOn(cashFlowApi, "getCashFlowById").mockResolvedValue(inflow);
    const { wrapper } = await mountAt("/cash-flows/5");

    expect(wrapper.find('[data-testid="detail-type-badge"]').text()).toContain("Pemasukan");
    expect(wrapper.find('[data-testid="detail-nominal"]').text()).toContain("+");
    expect(wrapper.find('[data-testid="detail-nominal"]').text()).toContain("2.500.000");
    expect(wrapper.find('[data-testid="detail-label"]').text()).toBe("gaji");
    expect(wrapper.find('[data-testid="detail-source"]').text()).toBe("Tunai");
    expect(wrapper.find('[data-testid="detail-description"]').text()).toContain("Gaji bulanan");
    expect(wrapper.text()).toContain("Dibuat");
    expect(wrapper.text()).toContain("Diperbarui");
    expect(wrapper.find(".from-emerald-600").exists()).toBe(true);
  });

  it("should render outflow detail", async () => {
    vi.spyOn(cashFlowApi, "getCashFlowById").mockResolvedValue(outflow);
    const { wrapper } = await mountAt("/cash-flows/6");

    expect(wrapper.find('[data-testid="detail-type-badge"]').text()).toContain("Pengeluaran");
    expect(wrapper.find('[data-testid="detail-nominal"]').text()).toContain("-");
    expect(wrapper.find('[data-testid="detail-source"]').text()).toBe("Pinjaman");
    expect(wrapper.find(".from-red-600").exists()).toBe(true);
  });

  it("should redirect home when the cash flow is not found", async () => {
    vi.spyOn(cashFlowApi, "getCashFlowById").mockRejectedValue(new Error("x"));
    const router = createAppRouter(createMemoryHistory());
    await router.push("/cash-flows/99");
    await router.isReady();
    const pushSpy = vi.spyOn(router, "push");
    renderWithProviders(DetailPage, { router, preloadedState: { profile } });
    await flushPromises();
    expect(pushSpy).toHaveBeenCalledWith("/");
  });

  it("should reload when the route id changes", async () => {
    const spy = vi.spyOn(cashFlowApi, "getCashFlowById").mockResolvedValue(inflow);
    const { router } = await mountAt("/cash-flows/5");
    expect(spy).toHaveBeenCalledTimes(1);

    await router.push("/cash-flows/6");
    await flushPromises();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith("6");

    await router.push("/");
    await flushPromises();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("should open edit modal and reload after saving", async () => {
    const spy = vi.spyOn(cashFlowApi, "getCashFlowById").mockResolvedValue(inflow);
    vi.spyOn(cashFlowApi, "getLabels").mockResolvedValue([]);
    const { wrapper } = await mountAt("/cash-flows/5");

    await wrapper.find('[data-testid="edit-detail-cashflow-btn"]').trigger("click");
    await flushPromises();
    expect(wrapper.find('[data-testid="edit-cashflow-modal"]').exists()).toBe(true);

    const callsBefore = spy.mock.calls.length;
    wrapper.findComponent(ChangeModal).vm.$emit("saved");
    await flushPromises();
    expect(spy.mock.calls.length).toBe(callsBefore + 1);

    wrapper.findComponent(ChangeModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.find('[data-testid="edit-cashflow-modal"]').exists()).toBe(false);
  });

  it("should delete only after confirmation and redirect after deletion", async () => {
    vi.spyOn(cashFlowApi, "getCashFlowById").mockResolvedValue(inflow);
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, cashFlowsStore, router } = await mountAt("/cash-flows/5");
    const deleteSpy = vi.spyOn(cashFlowsStore, "asyncSetIsCashFlowDelete").mockResolvedValue(undefined);
    const pushSpy = vi.spyOn(router, "push");

    confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
    await wrapper.find('[data-testid="delete-detail-cashflow-btn"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
    await wrapper.find('[data-testid="delete-detail-cashflow-btn"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).toHaveBeenCalledWith(5);

    cashFlowsStore.setIsCashFlowDeleted(true);
    await flushPromises();
    expect(pushSpy).toHaveBeenCalledWith("/");
    expect(cashFlowsStore.isCashFlowDeleted).toBe(false);
  });
});
