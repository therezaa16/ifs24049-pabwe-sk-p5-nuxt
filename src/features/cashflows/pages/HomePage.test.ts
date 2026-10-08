import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import HomePage from "./HomePage.vue";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import { renderWithProviders } from "../../../test-utils";
import cashFlowApi from "../api/cashFlowApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

const profile = { id: 1, name: "Tester", email: "tester@delcom.org" };

const items = [
  {
    id: 1,
    type: "inflow" as const,
    source: "cash" as const,
    label: "gaji",
    description: "Gaji bulanan",
    nominal: 2500000,
    created_at: "2026-10-05T11:26:45.000000Z",
    updated_at: "2026-10-05T11:26:48.000000Z",
  },
  {
    id: 2,
    type: "outflow" as const,
    source: "savings" as const,
    label: "alat-elektronik",
    description: "Keyboard",
    nominal: 400000,
    created_at: "2026-10-05T12:09:16.000000Z",
    updated_at: "2026-10-05T12:09:16.000000Z",
  },
];

const stats = {
  cashflow: 2100000,
  total_inflow: 2500000,
  total_outflow: 400000,
  cash: 2500000,
  savings: -400000,
  loans: 0,
};

const daily = {
  stats_inflow: { "05-10-2026": 2500000, "06-10-2026": 0 },
  stats_outflow: { "05-10-2026": 400000 },
  stats_cashflow: {},
};

const monthly = {
  stats_inflow: { "10-2026": 100 },
  stats_outflow: { "10-2026": 50 },
  stats_cashflow: {},
};

function mockApis(overrides: { cash_flows?: any[] } = {}) {
  const list = vi.spyOn(cashFlowApi, "getCashFlows").mockResolvedValue({
    cash_flows: overrides.cash_flows ?? items,
    stats,
  });
  vi.spyOn(cashFlowApi, "getLabels").mockResolvedValue(["gaji", "alat-elektronik"]);
  const dailySpy = vi.spyOn(cashFlowApi, "getStatsDaily").mockResolvedValue(daily);
  const monthlySpy = vi.spyOn(cashFlowApi, "getStatsMonthly").mockResolvedValue(monthly);
  return { list, dailySpy, monthlySpy };
}

async function mountPage(state: Record<string, any> = { profile }) {
  const result = renderWithProviders(HomePage, { preloadedState: state });
  await flushPromises();
  return result;
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("should render nothing without profile", async () => {
    mockApis();
    const { wrapper } = await mountPage({ profile: null });
    expect(wrapper.find('[data-testid="add-cashflow-btn"]').exists()).toBe(false);
  });

  it("should render metric cards with rupiah values", async () => {
    mockApis();
    const { wrapper } = await mountPage();

    expect(wrapper.find('[data-testid="stat-cashflow"]').text()).toContain("2.100.000");
    expect(wrapper.find('[data-testid="stat-inflow"]').text()).toContain("2.500.000");
    expect(wrapper.find('[data-testid="stat-outflow"]').text()).toContain("400.000");
    expect(wrapper.find('[data-testid="stat-cash"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="stat-savings"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="stat-loans"]').exists()).toBe(true);
  });

  it("should render table rows and mobile cards with badges", async () => {
    mockApis();
    const { wrapper } = await mountPage();

    const inflowRow = wrapper.find('[data-testid="cashflow-row-1"]');
    expect(inflowRow.text()).toContain("gaji");
    expect(inflowRow.text()).toContain("Pemasukan");
    expect(inflowRow.text()).toContain("+");
    expect(inflowRow.find("span.bg-emerald-50").exists()).toBe(true);

    const outflowRow = wrapper.find('[data-testid="cashflow-row-2"]');
    expect(outflowRow.text()).toContain("Tabungan");
    expect(outflowRow.find("span.bg-red-50").exists()).toBe(true);

    expect(wrapper.find('[data-testid="cashflow-card-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="cashflow-card-2"]').text()).toContain("Pengeluaran");
  });

  it("should show loading state while fetching", async () => {
    mockApis();
    vi.spyOn(cashFlowApi, "getCashFlows").mockReturnValue(new Promise(() => {}));
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile } });
    await flushPromises();
    expect(wrapper.text()).toContain("Memuat catatan arus kas...");
  });

  it("should show empty state when there are no cash flows", async () => {
    mockApis({ cash_flows: [] });
    const { wrapper } = await mountPage();
    expect(wrapper.find('[data-testid="cashflow-empty"]').exists()).toBe(true);
  });

  it("should fall back to empty list when request fails", async () => {
    mockApis();
    vi.spyOn(cashFlowApi, "getCashFlows").mockRejectedValue(new Error("x"));
    const { wrapper } = await mountPage();
    expect(wrapper.find('[data-testid="cashflow-empty"]').exists()).toBe(true);
  });

  it("should not update loading state after unmount", async () => {
    mockApis();
    let resolve: (value: any) => void = () => {};
    vi.spyOn(cashFlowApi, "getCashFlows").mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile } });
    wrapper.unmount();
    resolve({ cash_flows: [], stats });
    await flushPromises();
    expect(wrapper.exists()).toBeDefined();
  });

  it("should send filters to the API and reset them", async () => {
    const { list } = mockApis();
    const { wrapper } = await mountPage();

    await wrapper.find('[data-testid="filter-type-select"]').setValue("inflow");
    await flushPromises();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ type: "inflow" }));

    await wrapper.find('[data-testid="filter-source-select"]').setValue("cash");
    await wrapper.find('[data-testid="filter-label-select"]').setValue("gaji");
    await wrapper.find('[data-testid="filter-start-date"]').setValue("2026-10-01");
    await wrapper.find('[data-testid="filter-end-date"]').setValue("2026-10-08");
    await flushPromises();
    expect(list).toHaveBeenLastCalledWith({
      type: "inflow",
      source: "cash",
      label: "gaji",
      start_date: "2026-10-01 00:00:00",
      end_date: "2026-10-08 23:59:59",
    });

    await wrapper.find('[data-testid="reset-filter-btn"]').trigger("click");
    await flushPromises();
    expect(list).toHaveBeenLastCalledWith({
      type: "",
      source: "",
      label: "",
      start_date: "",
      end_date: "",
    });
  });

  it("should render daily chart and switch to monthly", async () => {
    const { monthlySpy } = mockApis();
    const { wrapper } = await mountPage();

    expect(wrapper.find('[data-testid="chart-bar-05-10-2026"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="chart-bar-06-10-2026"]').exists()).toBe(true);

    await wrapper.find('[data-testid="chart-monthly-btn"]').trigger("click");
    await flushPromises();
    expect(monthlySpy).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="chart-bar-10-2026"]').exists()).toBe(true);

    await wrapper.find('[data-testid="chart-daily-btn"]').trigger("click");
    await flushPromises();
    expect(wrapper.find('[data-testid="chart-bar-05-10-2026"]').exists()).toBe(true);
  });

  it("should show empty chart message when stats are unavailable", async () => {
    mockApis();
    vi.spyOn(cashFlowApi, "getStatsDaily").mockRejectedValue(new Error("x"));
    const { wrapper } = await mountPage();
    expect(wrapper.find('[data-testid="chart-empty"]').exists()).toBe(true);
  });

  it("should open add modal and refresh after saving", async () => {
    const { list } = mockApis();
    const { wrapper } = await mountPage();

    await wrapper.find('[data-testid="add-cashflow-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-cashflow-modal"]').exists()).toBe(true);

    const callsBefore = list.mock.calls.length;
    wrapper.findComponent(AddModal).vm.$emit("saved");
    await flushPromises();
    expect(list.mock.calls.length).toBe(callsBefore + 1);

    wrapper.findComponent(AddModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.find('[data-testid="add-cashflow-modal"]').exists()).toBe(false);
  });

  it("should open change modal for table and card edit buttons", async () => {
    const { list } = mockApis();
    vi.spyOn(cashFlowApi, "getCashFlowById").mockResolvedValue(items[0]);
    const { wrapper } = await mountPage();

    await wrapper.find('[data-testid="edit-cashflow-1"]').trigger("click");
    await flushPromises();
    expect(wrapper.find('[data-testid="edit-cashflow-modal"]').exists()).toBe(true);
    expect(wrapper.findComponent(ChangeModal).props("cashFlowId")).toBe(1);

    const callsBefore = list.mock.calls.length;
    wrapper.findComponent(ChangeModal).vm.$emit("saved");
    await flushPromises();
    expect(list.mock.calls.length).toBe(callsBefore + 1);

    wrapper.findComponent(ChangeModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.find('[data-testid="edit-cashflow-modal"]').exists()).toBe(false);

    await wrapper.find('[data-testid="edit-card-cashflow-2"]').trigger("click");
    expect(wrapper.findComponent(ChangeModal).props("cashFlowId")).toBe(2);
  });

  it("should navigate to detail page", async () => {
    mockApis();
    const { wrapper, router } = await mountPage();
    const pushSpy = vi.spyOn(router, "push").mockResolvedValue(undefined);

    await wrapper.find('[data-testid="view-cashflow-1"]').trigger("click");
    expect(pushSpy).toHaveBeenCalledWith("/cash-flows/1");

    await wrapper.find('[data-testid="view-card-cashflow-2"]').trigger("click");
    expect(pushSpy).toHaveBeenCalledWith("/cash-flows/2");
  });

  it("should delete one cash flow only after confirmation", async () => {
    const { list } = mockApis();
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, cashFlowsStore } = await mountPage();
    const deleteSpy = vi.spyOn(cashFlowsStore, "asyncSetIsCashFlowDelete").mockResolvedValue(undefined);

    confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
    await wrapper.find('[data-testid="delete-cashflow-1"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
    await wrapper.find('[data-testid="delete-cashflow-1"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).toHaveBeenCalledWith(1);

    await wrapper.find('[data-testid="delete-card-cashflow-2"]').trigger("click");
    await flushPromises();
    expect(deleteSpy).toHaveBeenCalledWith(2);

    const callsBefore = list.mock.calls.length;
    cashFlowsStore.setIsCashFlowDeleted(true);
    await flushPromises();
    expect(list.mock.calls.length).toBe(callsBefore + 1);
    expect(cashFlowsStore.isCashFlowDeleted).toBe(false);
  });

  it("should reset all cash flows only after confirmation", async () => {
    const { list } = mockApis();
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, cashFlowsStore } = await mountPage();
    const deleteAllSpy = vi
      .spyOn(cashFlowsStore, "asyncSetIsCashFlowDeleteAll")
      .mockResolvedValue(undefined);

    confirmSpy.mockResolvedValue({ isConfirmed: false } as any);
    await wrapper.find('[data-testid="reset-cashflows-btn"]').trigger("click");
    await flushPromises();
    expect(deleteAllSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValue({ isConfirmed: true } as any);
    await wrapper.find('[data-testid="reset-cashflows-btn"]').trigger("click");
    await flushPromises();
    expect(deleteAllSpy).toHaveBeenCalled();

    const callsBefore = list.mock.calls.length;
    cashFlowsStore.setIsCashFlowDeletedAll(true);
    await flushPromises();
    expect(list.mock.calls.length).toBe(callsBefore + 1);
    expect(cashFlowsStore.isCashFlowDeletedAll).toBe(false);
  });
});
