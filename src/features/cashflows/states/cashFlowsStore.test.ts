import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCashFlowsStore } from "./cashFlowsStore";
import cashFlowApi, { emptyStats } from "../api/cashFlowApi";
import type { CashFlow } from "./cashFlowsStore";
import * as toolsHelper from "../../../helpers/toolsHelper";

const dummy: CashFlow = {
  id: 1,
  type: "inflow",
  source: "cash",
  label: "gaji",
  description: "Gaji",
  nominal: 1000,
};

const payload = {
  type: "inflow" as const,
  source: "cash" as const,
  label: "gaji",
  description: "Gaji",
  nominal: 1000,
};

const period = { stats_inflow: { a: 1 }, stats_outflow: { a: 0 }, stats_cashflow: { a: 1 } };

describe("cashFlowsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it("should have correct default state", () => {
    const store = useCashFlowsStore();
    expect(store.cashFlows).toEqual([]);
    expect(store.cashFlow).toBeNull();
    expect(store.stats).toEqual(emptyStats());
    expect(store.labels).toEqual([]);
    expect(store.statsDaily).toBeNull();
    expect(store.statsMonthly).toBeNull();
    expect(store.isCashFlow).toBe(false);
    expect(store.isCashFlowAdd).toBe(false);
    expect(store.isCashFlowAdded).toBe(false);
    expect(store.isCashFlowChange).toBe(false);
    expect(store.isCashFlowChanged).toBe(false);
    expect(store.isCashFlowDelete).toBe(false);
    expect(store.isCashFlowDeleted).toBe(false);
    expect(store.isCashFlowDeleteAll).toBe(false);
    expect(store.isCashFlowDeletedAll).toBe(false);
  });

  it("should update state with setters", () => {
    const store = useCashFlowsStore();
    store.setCashFlows([dummy]);
    store.setCashFlow(dummy);
    store.setStats({ ...emptyStats(), cashflow: 5 });
    store.setLabels(["a"]);
    store.setStatsDaily(period);
    store.setStatsMonthly(period);
    store.setIsCashFlow(true);
    store.setIsCashFlowAdd(true);
    store.setIsCashFlowAdded(true);
    store.setIsCashFlowChange(true);
    store.setIsCashFlowChanged(true);
    store.setIsCashFlowDelete(true);
    store.setIsCashFlowDeleted(true);
    store.setIsCashFlowDeleteAll(true);
    store.setIsCashFlowDeletedAll(true);

    expect(store.cashFlows).toEqual([dummy]);
    expect(store.cashFlow).toEqual(dummy);
    expect(store.stats.cashflow).toBe(5);
    expect(store.labels).toEqual(["a"]);
    expect(store.statsDaily).toEqual(period);
    expect(store.statsMonthly).toEqual(period);
    expect(store.isCashFlow).toBe(true);
    expect(store.isCashFlowAdd).toBe(true);
    expect(store.isCashFlowAdded).toBe(true);
    expect(store.isCashFlowChange).toBe(true);
    expect(store.isCashFlowChanged).toBe(true);
    expect(store.isCashFlowDelete).toBe(true);
    expect(store.isCashFlowDeleted).toBe(true);
    expect(store.isCashFlowDeleteAll).toBe(true);
    expect(store.isCashFlowDeletedAll).toBe(true);
  });

  describe("fetch actions", () => {
    it("asyncSetCashFlows should set list and stats, or reset on error", async () => {
      const store = useCashFlowsStore();
      const spy = vi.spyOn(cashFlowApi, "getCashFlows").mockResolvedValue({
        cash_flows: [dummy],
        stats: { ...emptyStats(), cashflow: 9 },
      });
      await store.asyncSetCashFlows({ type: "inflow" });
      expect(spy).toHaveBeenCalledWith({ type: "inflow" });
      expect(store.cashFlows).toEqual([dummy]);
      expect(store.stats.cashflow).toBe(9);

      spy.mockRejectedValue(new Error("err"));
      await store.asyncSetCashFlows();
      expect(store.cashFlows).toEqual([]);
      expect(store.stats).toEqual(emptyStats());
    });

    it("asyncSetCashFlow should set detail and always flag loaded", async () => {
      const store = useCashFlowsStore();
      const spy = vi.spyOn(cashFlowApi, "getCashFlowById").mockResolvedValue(dummy);
      await store.asyncSetCashFlow(1);
      expect(store.cashFlow).toEqual(dummy);
      expect(store.isCashFlow).toBe(true);

      store.setIsCashFlow(false);
      spy.mockRejectedValue(new Error("err"));
      await store.asyncSetCashFlow(2);
      expect(store.cashFlow).toBeNull();
      expect(store.isCashFlow).toBe(true);
    });

    it("asyncSetLabels should set labels or empty on error", async () => {
      const store = useCashFlowsStore();
      const spy = vi.spyOn(cashFlowApi, "getLabels").mockResolvedValue(["gaji"]);
      await store.asyncSetLabels();
      expect(store.labels).toEqual(["gaji"]);

      spy.mockRejectedValue(new Error("err"));
      await store.asyncSetLabels();
      expect(store.labels).toEqual([]);
    });

    it("asyncSetStatsDaily should set stats or null on error", async () => {
      const store = useCashFlowsStore();
      const spy = vi.spyOn(cashFlowApi, "getStatsDaily").mockResolvedValue(period);
      await store.asyncSetStatsDaily("2026-10-08 23:59:59", 7);
      expect(spy).toHaveBeenCalledWith("2026-10-08 23:59:59", 7);
      expect(store.statsDaily).toEqual(period);

      spy.mockRejectedValue(new Error("err"));
      await store.asyncSetStatsDaily();
      expect(store.statsDaily).toBeNull();
    });

    it("asyncSetStatsMonthly should set stats or null on error", async () => {
      const store = useCashFlowsStore();
      const spy = vi.spyOn(cashFlowApi, "getStatsMonthly").mockResolvedValue(period);
      await store.asyncSetStatsMonthly();
      expect(store.statsMonthly).toEqual(period);

      spy.mockRejectedValue(new Error("err"));
      await store.asyncSetStatsMonthly();
      expect(store.statsMonthly).toBeNull();
    });
  });

  describe("mutation actions", () => {
    it("asyncSetIsCashFlowAdd should handle success and failure", async () => {
      const store = useCashFlowsStore();
      const ok = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => ({}) as any);
      const fail = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
      const spy = vi.spyOn(cashFlowApi, "postCashFlow").mockResolvedValue({ cash_flow_id: 1 });

      await store.asyncSetIsCashFlowAdd(payload);
      expect(ok).toHaveBeenCalledWith("Catatan arus kas berhasil ditambahkan!");
      expect(store.isCashFlowAdded).toBe(true);
      expect(store.isCashFlowAdd).toBe(true);

      spy.mockRejectedValue(new Error("Gagal"));
      await store.asyncSetIsCashFlowAdd(payload);
      expect(fail).toHaveBeenCalledWith("Gagal");
      expect(store.isCashFlowAdded).toBe(false);
    });

    it("asyncSetIsCashFlowChange should handle success, fallback message and failure", async () => {
      const store = useCashFlowsStore();
      const ok = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => ({}) as any);
      const fail = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
      const spy = vi.spyOn(cashFlowApi, "putCashFlow").mockResolvedValue("Berhasil mengubah");

      await store.asyncSetIsCashFlowChange(1, payload);
      expect(ok).toHaveBeenCalledWith("Berhasil mengubah");
      expect(store.isCashFlowChanged).toBe(true);
      expect(store.isCashFlowChange).toBe(true);

      spy.mockResolvedValue("");
      await store.asyncSetIsCashFlowChange(1, payload);
      expect(ok).toHaveBeenCalledWith("Catatan arus kas berhasil diperbarui!");

      spy.mockRejectedValue(new Error("Gagal"));
      await store.asyncSetIsCashFlowChange(1, payload);
      expect(fail).toHaveBeenCalledWith("Gagal");
      expect(store.isCashFlowChanged).toBe(false);
    });

    it("asyncSetIsCashFlowDelete should handle success, fallback message and failure", async () => {
      const store = useCashFlowsStore();
      const ok = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => ({}) as any);
      const fail = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
      const spy = vi.spyOn(cashFlowApi, "deleteCashFlow").mockResolvedValue("Terhapus");

      await store.asyncSetIsCashFlowDelete(1);
      expect(ok).toHaveBeenCalledWith("Terhapus");
      expect(store.isCashFlowDeleted).toBe(true);
      expect(store.isCashFlowDelete).toBe(true);

      spy.mockResolvedValue("");
      await store.asyncSetIsCashFlowDelete(1);
      expect(ok).toHaveBeenCalledWith("Catatan arus kas berhasil dihapus!");

      spy.mockRejectedValue(new Error("Gagal"));
      await store.asyncSetIsCashFlowDelete(1);
      expect(fail).toHaveBeenCalledWith("Gagal");
      expect(store.isCashFlowDeleted).toBe(false);
    });

    it("asyncSetIsCashFlowDeleteAll should handle success, fallback message and failure", async () => {
      const store = useCashFlowsStore();
      const ok = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => ({}) as any);
      const fail = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
      const spy = vi.spyOn(cashFlowApi, "deleteAllCashFlows").mockResolvedValue("Semua terhapus");

      await store.asyncSetIsCashFlowDeleteAll();
      expect(ok).toHaveBeenCalledWith("Semua terhapus");
      expect(store.isCashFlowDeletedAll).toBe(true);
      expect(store.isCashFlowDeleteAll).toBe(true);

      spy.mockResolvedValue("");
      await store.asyncSetIsCashFlowDeleteAll();
      expect(ok).toHaveBeenCalledWith("Semua catatan arus kas berhasil direset!");

      spy.mockRejectedValue(new Error("Gagal"));
      await store.asyncSetIsCashFlowDeleteAll();
      expect(fail).toHaveBeenCalledWith("Gagal");
      expect(store.isCashFlowDeletedAll).toBe(false);
    });
  });
});
