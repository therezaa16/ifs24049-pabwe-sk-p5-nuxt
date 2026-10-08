import { describe, it, expect, vi, beforeEach } from "vitest";
import cashFlowApi, {
  emptyStats,
  getSourceLabel,
  getTypeLabel,
  normalizeStats,
} from "./cashFlowApi";
import apiHelper from "../../../helpers/apiHelper";

const payload = {
  type: "inflow" as const,
  source: "cash" as const,
  label: "gaji",
  description: "Gaji bulanan",
  nominal: 1000,
};

function mockResponse(body: any) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
    json: async () => body,
  } as any);
}

describe("cashFlowApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("helpers", () => {
    it("should map labels", () => {
      expect(getTypeLabel("inflow")).toBe("Pemasukan");
      expect(getTypeLabel("outflow")).toBe("Pengeluaran");
      expect(getSourceLabel("cash")).toBe("Tunai");
      expect(getSourceLabel("savings")).toBe("Tabungan");
      expect(getSourceLabel("loans")).toBe("Pinjaman");
      expect(getSourceLabel("other")).toBe("other");
    });

    it("should build empty and normalized stats", () => {
      expect(emptyStats().cashflow).toBe(0);
      expect(normalizeStats(null)).toEqual(emptyStats());
      expect(normalizeStats(undefined)).toEqual(emptyStats());
      expect(
        normalizeStats({
          cashflow: 2000000,
          total_inflow: 2500000,
          total_outflow: 500000,
          total_inflow_cash: 2500000,
          total_outflow_cash: 100000,
          total_inflow_savings: 100,
          total_outflow_savings: 400000,
          total_inflow_loans: 50,
          total_outflow_loans: 20,
        })
      ).toEqual({
        cashflow: 2000000,
        total_inflow: 2500000,
        total_outflow: 500000,
        cash: 2400000,
        savings: -399900,
        loans: 30,
      });
    });
  });

  describe("postCashFlow", () => {
    it("should create and return data", async () => {
      const spy = mockResponse({ status: "success", data: { cash_flow_id: 7 } });
      const res = await cashFlowApi.postCashFlow(payload);
      expect(res).toEqual({ cash_flow_id: 7 });
      expect(spy).toHaveBeenCalledWith(
        expect.stringMatching(/\/cash-flows$/),
        expect.objectContaining({ method: "POST", body: JSON.stringify(payload) })
      );
    });

    it("should throw server message or fallback", async () => {
      mockResponse({ status: "fail", message: "Data tidak valid" });
      await expect(cashFlowApi.postCashFlow(payload)).rejects.toThrow("Data tidak valid");

      mockResponse({ status: "fail" });
      await expect(cashFlowApi.postCashFlow(payload)).rejects.toThrow(
        "Gagal menambahkan catatan arus kas"
      );
    });
  });

  describe("putCashFlow", () => {
    it("should update and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil mengubah data" });
      const msg = await cashFlowApi.putCashFlow(3, payload);
      expect(msg).toBe("Berhasil mengubah data");
      expect(spy).toHaveBeenCalledWith(
        expect.stringMatching(/\/cash-flows\/3$/),
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail", message: "Gagal" });
      await expect(cashFlowApi.putCashFlow(3, payload)).rejects.toThrow("Gagal");

      mockResponse({ status: "fail" });
      await expect(cashFlowApi.putCashFlow(3, payload)).rejects.toThrow(
        "Gagal mengubah catatan arus kas"
      );
    });
  });

  describe("getCashFlows", () => {
    it("should fetch list with default params", async () => {
      const spy = mockResponse({
        status: "success",
        data: {
          cash_flows: [{ id: 1 }],
          stats: { cashflow: 10, total_inflow: 10 },
        },
      });
      const res = await cashFlowApi.getCashFlows();
      expect(res.cash_flows).toEqual([{ id: 1 }]);
      expect(res.stats.cashflow).toBe(10);
      expect(spy).toHaveBeenCalledWith(
        expect.stringMatching(/\/cash-flows$/),
        { method: "GET" }
      );
    });

    it("should send only filled query parameters", async () => {
      const spy = mockResponse({ status: "success", data: { cash_flows: [], stats: {} } });
      await cashFlowApi.getCashFlows({
        type: "outflow",
        source: "savings",
        label: "makan",
        start_date: "2026-10-01 00:00:00",
        end_date: "",
      });
      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain("type=outflow");
      expect(url).toContain("source=savings");
      expect(url).toContain("label=makan");
      expect(url).toContain("start_date=2026-10-01+00%3A00%3A00");
      expect(url).not.toContain("end_date");
    });

    it("should fall back to empty values when data is missing", async () => {
      mockResponse({ status: "success" });
      const res = await cashFlowApi.getCashFlows();
      expect(res.cash_flows).toEqual([]);
      expect(res.stats).toEqual(emptyStats());

      mockResponse({ status: "success", data: {} });
      const res2 = await cashFlowApi.getCashFlows();
      expect(res2.cash_flows).toEqual([]);
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail", message: "Unauthenticated." });
      await expect(cashFlowApi.getCashFlows()).rejects.toThrow("Unauthenticated.");

      mockResponse({ status: "fail" });
      await expect(cashFlowApi.getCashFlows()).rejects.toThrow("Gagal mengambil data arus kas");
    });
  });

  describe("getCashFlowById", () => {
    it("should return detail", async () => {
      mockResponse({ status: "success", data: { cash_flow: { id: 4 } } });
      expect(await cashFlowApi.getCashFlowById(4)).toEqual({ id: 4 });
    });

    it("should handle missing data and failure", async () => {
      mockResponse({ status: "success" });
      expect(await cashFlowApi.getCashFlowById(4)).toBeUndefined();

      mockResponse({ status: "fail" });
      await expect(cashFlowApi.getCashFlowById(4)).rejects.toThrow("Gagal mengambil detail arus kas");
    });
  });

  describe("deleteCashFlow", () => {
    it("should delete and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus data" });
      expect(await cashFlowApi.deleteCashFlow(2)).toBe("Berhasil menghapus data");
      expect(spy).toHaveBeenCalledWith(
        expect.stringMatching(/\/cash-flows\/2$/),
        { method: "DELETE" }
      );
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(cashFlowApi.deleteCashFlow(2)).rejects.toThrow("Gagal menghapus catatan arus kas");
    });
  });

  describe("getLabels", () => {
    it("should return labels", async () => {
      const spy = mockResponse({ status: "success", data: { labels: ["gaji"] } });
      expect(await cashFlowApi.getLabels()).toEqual(["gaji"]);
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/labels$/);
    });

    it("should default to empty and throw on failure", async () => {
      mockResponse({ status: "success" });
      expect(await cashFlowApi.getLabels()).toEqual([]);

      mockResponse({ status: "fail" });
      await expect(cashFlowApi.getLabels()).rejects.toThrow("Gagal mengambil label arus kas");
    });
  });

  describe("period stats", () => {
    const body = {
      status: "success",
      data: {
        stats_inflow: { "05-10-2026": 10 },
        stats_outflow: { "05-10-2026": 5 },
        stats_cashflow: { "05-10-2026": 5 },
      },
    };

    it("should fetch daily stats with params", async () => {
      const spy = mockResponse(body);
      const res = await cashFlowApi.getStatsDaily("2026-10-05 23:59:59", 7);
      expect(res.stats_inflow).toEqual({ "05-10-2026": 10 });
      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain("/cash-flows/stats/daily?");
      expect(url).toContain("total_data=7");
    });

    it("should fetch monthly stats without params", async () => {
      const spy = mockResponse(body);
      await cashFlowApi.getStatsMonthly();
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/stats\/monthly$/);
    });

    it("should default to empty series and throw on failure", async () => {
      mockResponse({ status: "success" });
      expect(await cashFlowApi.getStatsDaily()).toEqual({
        stats_inflow: {},
        stats_outflow: {},
        stats_cashflow: {},
      });

      mockResponse({ status: "fail" });
      await expect(cashFlowApi.getStatsMonthly()).rejects.toThrow(
        "Gagal mengambil statistik arus kas"
      );
    });
  });

  describe("deleteAllCashFlows", () => {
    it("should delete all and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus semua" });
      expect(await cashFlowApi.deleteAllCashFlows()).toBe("Berhasil menghapus semua");
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows$/);
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(cashFlowApi.deleteAllCashFlows()).rejects.toThrow(
        "Gagal mereset catatan arus kas"
      );
    });
  });
});
