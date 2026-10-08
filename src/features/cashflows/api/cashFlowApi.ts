import apiHelper from "../../../helpers/apiHelper";
import type { CashFlow, CashFlowQueryParams, CashFlowStats } from "../states/cashFlowsStore";

export type CashFlowType = "inflow" | "outflow";
export type CashFlowSource = "cash" | "savings" | "loans";

export interface CashFlowPayload {
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  description: string;
  nominal: number;
}

export interface CashFlowListResult {
  cash_flows: CashFlow[];
  stats: CashFlowStats;
}

export interface CashFlowSeries {
  [period: string]: number;
}

export interface CashFlowPeriodStats {
  stats_inflow: CashFlowSeries;
  stats_outflow: CashFlowSeries;
  stats_cashflow: CashFlowSeries;
}

export const TYPE_OPTIONS: { value: CashFlowType; label: string }[] = [
  { value: "inflow", label: "Pemasukan (Inflow)" },
  { value: "outflow", label: "Pengeluaran (Outflow)" },
];

export const SOURCE_OPTIONS: { value: CashFlowSource; label: string }[] = [
  { value: "cash", label: "Tunai" },
  { value: "savings", label: "Tabungan" },
  { value: "loans", label: "Pinjaman" },
];

export function getTypeLabel(type: string): string {
  return type === "inflow" ? "Pemasukan" : "Pengeluaran";
}

export function getSourceLabel(source: string): string {
  return SOURCE_OPTIONS.find((item) => item.value === source)?.label ?? source;
}

function toNumber(value: unknown): number {
  return Number(value) || 0;
}

export function emptyStats(): CashFlowStats {
  return {
    cashflow: 0,
    total_inflow: 0,
    total_outflow: 0,
    cash: 0,
    savings: 0,
    loans: 0,
  };
}

export function normalizeStats(raw: Record<string, unknown> | null | undefined): CashFlowStats {
  const data = raw || {};
  return {
    cashflow: toNumber(data.cashflow),
    total_inflow: toNumber(data.total_inflow),
    total_outflow: toNumber(data.total_outflow),
    cash: toNumber(data.total_inflow_cash) - toNumber(data.total_outflow_cash),
    savings: toNumber(data.total_inflow_savings) - toNumber(data.total_outflow_savings),
    loans: toNumber(data.total_inflow_loans) - toNumber(data.total_outflow_loans),
  };
}

const cashFlowApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/cash-flows`;

  function _url(path: string = ""): string {
    return BASE_URL + path;
  }

  function _buildQuery(params: Record<string, string | number | undefined | null>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, String(value));
      }
    });
    const text = query.toString();
    return text ? `?${text}` : "";
  }

  async function _request(url: string, options: RequestInit, fallback: string): Promise<any> {
    const response = await apiHelper.fetchData(url, options);
    const result = await response.json();
    if (result.status !== "success") {
      throw new Error(result.message || fallback);
    }
    return result;
  }

  async function postCashFlow(payload: CashFlowPayload): Promise<{ cash_flow_id?: number }> {
    const result = await _request(
      _url(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      "Gagal menambahkan catatan arus kas"
    );
    return result.data;
  }

  async function putCashFlow(
    cashFlowId: string | number,
    payload: CashFlowPayload
  ): Promise<string> {
    const result = await _request(
      _url(`/${cashFlowId}`),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      "Gagal mengubah catatan arus kas"
    );
    return result.message;
  }

  async function getCashFlows(params: CashFlowQueryParams = {}): Promise<CashFlowListResult> {
    const result = await _request(
      _url(_buildQuery({ ...params })),
      { method: "GET" },
      "Gagal mengambil data arus kas"
    );
    return {
      cash_flows: result.data?.cash_flows || [],
      stats: normalizeStats(result.data?.stats),
    };
  }

  async function getCashFlowById(cashFlowId: string | number): Promise<CashFlow> {
    const result = await _request(
      _url(`/${cashFlowId}`),
      { method: "GET" },
      "Gagal mengambil detail arus kas"
    );
    return result.data?.cash_flow;
  }

  async function deleteCashFlow(cashFlowId: string | number): Promise<string> {
    const result = await _request(
      _url(`/${cashFlowId}`),
      { method: "DELETE" },
      "Gagal menghapus catatan arus kas"
    );
    return result.message;
  }

  async function getLabels(): Promise<string[]> {
    const result = await _request(
      _url("/labels"),
      { method: "GET" },
      "Gagal mengambil label arus kas"
    );
    return result.data?.labels || [];
  }

  async function _getPeriodStats(
    path: string,
    end_date?: string,
    total_data?: number
  ): Promise<CashFlowPeriodStats> {
    const result = await _request(
      _url(`/stats/${path}${_buildQuery({ end_date, total_data })}`),
      { method: "GET" },
      "Gagal mengambil statistik arus kas"
    );
    return {
      stats_inflow: result.data?.stats_inflow || {},
      stats_outflow: result.data?.stats_outflow || {},
      stats_cashflow: result.data?.stats_cashflow || {},
    };
  }

  function getStatsDaily(end_date?: string, total_data?: number): Promise<CashFlowPeriodStats> {
    return _getPeriodStats("daily", end_date, total_data);
  }

  function getStatsMonthly(end_date?: string, total_data?: number): Promise<CashFlowPeriodStats> {
    return _getPeriodStats("monthly", end_date, total_data);
  }

  async function deleteAllCashFlows(): Promise<string> {
    const result = await _request(
      _url(),
      { method: "DELETE" },
      "Gagal mereset catatan arus kas"
    );
    return result.message;
  }

  return {
    postCashFlow,
    putCashFlow,
    getCashFlows,
    getCashFlowById,
    deleteCashFlow,
    getLabels,
    getStatsDaily,
    getStatsMonthly,
    deleteAllCashFlows,
  };
})();

export default cashFlowApi;
