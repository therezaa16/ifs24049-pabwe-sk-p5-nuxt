import { defineStore } from "pinia";
import cashFlowApi, {
  emptyStats,
  type CashFlowPayload,
  type CashFlowSource,
  type CashFlowType,
  type CashFlowPeriodStats,
} from "../api/cashFlowApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface CashFlow {
  id: number;
  user_id?: number;
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  description: string;
  nominal: number;
  created_at?: string;
  updated_at?: string;
}

export interface CashFlowStats {
  cashflow: number;
  total_inflow: number;
  total_outflow: number;
  cash: number;
  savings: number;
  loans: number;
}

export interface CashFlowQueryParams {
  type?: CashFlowType | "";
  source?: CashFlowSource | "";
  label?: string;
  start_date?: string;
  end_date?: string;
}

export interface CashFlowsState {
  cashFlows: CashFlow[];
  cashFlow: CashFlow | null;
  stats: CashFlowStats;
  labels: string[];
  statsDaily: CashFlowPeriodStats | null;
  statsMonthly: CashFlowPeriodStats | null;
  isCashFlow: boolean;
  isCashFlowAdd: boolean;
  isCashFlowAdded: boolean;
  isCashFlowChange: boolean;
  isCashFlowChanged: boolean;
  isCashFlowDelete: boolean;
  isCashFlowDeleted: boolean;
  isCashFlowDeleteAll: boolean;
  isCashFlowDeletedAll: boolean;
}

export const useCashFlowsStore = defineStore("cashFlows", {
  state: (): CashFlowsState => ({
    cashFlows: [],
    cashFlow: null,
    stats: emptyStats(),
    labels: [],
    statsDaily: null,
    statsMonthly: null,
    isCashFlow: false,
    isCashFlowAdd: false,
    isCashFlowAdded: false,
    isCashFlowChange: false,
    isCashFlowChanged: false,
    isCashFlowDelete: false,
    isCashFlowDeleted: false,
    isCashFlowDeleteAll: false,
    isCashFlowDeletedAll: false,
  }),
  actions: {
    setCashFlows(cashFlows: CashFlow[]) {
      this.cashFlows = cashFlows;
    },
    setCashFlow(cashFlow: CashFlow | null) {
      this.cashFlow = cashFlow;
    },
    setStats(stats: CashFlowStats) {
      this.stats = stats;
    },
    setLabels(labels: string[]) {
      this.labels = labels;
    },
    setStatsDaily(stats: CashFlowPeriodStats | null) {
      this.statsDaily = stats;
    },
    setStatsMonthly(stats: CashFlowPeriodStats | null) {
      this.statsMonthly = stats;
    },
    setIsCashFlow(status: boolean) {
      this.isCashFlow = status;
    },
    setIsCashFlowAdd(status: boolean) {
      this.isCashFlowAdd = status;
    },
    setIsCashFlowAdded(status: boolean) {
      this.isCashFlowAdded = status;
    },
    setIsCashFlowChange(status: boolean) {
      this.isCashFlowChange = status;
    },
    setIsCashFlowChanged(status: boolean) {
      this.isCashFlowChanged = status;
    },
    setIsCashFlowDelete(status: boolean) {
      this.isCashFlowDelete = status;
    },
    setIsCashFlowDeleted(status: boolean) {
      this.isCashFlowDeleted = status;
    },
    setIsCashFlowDeleteAll(status: boolean) {
      this.isCashFlowDeleteAll = status;
    },
    setIsCashFlowDeletedAll(status: boolean) {
      this.isCashFlowDeletedAll = status;
    },
    async asyncSetCashFlows(params: CashFlowQueryParams = {}) {
      try {
        const result = await cashFlowApi.getCashFlows(params);
        this.setCashFlows(result.cash_flows);
        this.setStats(result.stats);
      } catch (error) {
        this.setCashFlows([]);
        this.setStats(emptyStats());
      }
    },
    async asyncSetCashFlow(cashFlowId: string | number) {
      try {
        const cashFlow = await cashFlowApi.getCashFlowById(cashFlowId);
        this.setCashFlow(cashFlow);
      } catch (error) {
        this.setCashFlow(null);
      } finally {
        this.setIsCashFlow(true);
      }
    },
    async asyncSetLabels() {
      try {
        this.setLabels(await cashFlowApi.getLabels());
      } catch (error) {
        this.setLabels([]);
      }
    },
    async asyncSetStatsDaily(end_date?: string, total_data?: number) {
      try {
        this.setStatsDaily(await cashFlowApi.getStatsDaily(end_date, total_data));
      } catch (error) {
        this.setStatsDaily(null);
      }
    },
    async asyncSetStatsMonthly(end_date?: string, total_data?: number) {
      try {
        this.setStatsMonthly(await cashFlowApi.getStatsMonthly(end_date, total_data));
      } catch (error) {
        this.setStatsMonthly(null);
      }
    },
    async asyncSetIsCashFlowAdd(payload: CashFlowPayload) {
      try {
        await cashFlowApi.postCashFlow(payload);
        showSuccessDialog("Catatan arus kas berhasil ditambahkan!");
        this.setIsCashFlowAdded(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowAdded(false);
      } finally {
        this.setIsCashFlowAdd(true);
      }
    },
    async asyncSetIsCashFlowChange(cashFlowId: string | number, payload: CashFlowPayload) {
      try {
        const message = await cashFlowApi.putCashFlow(cashFlowId, payload);
        showSuccessDialog(message || "Catatan arus kas berhasil diperbarui!");
        this.setIsCashFlowChanged(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowChanged(false);
      } finally {
        this.setIsCashFlowChange(true);
      }
    },
    async asyncSetIsCashFlowDelete(cashFlowId: string | number) {
      try {
        const message = await cashFlowApi.deleteCashFlow(cashFlowId);
        showSuccessDialog(message || "Catatan arus kas berhasil dihapus!");
        this.setIsCashFlowDeleted(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowDeleted(false);
      } finally {
        this.setIsCashFlowDelete(true);
      }
    },
    async asyncSetIsCashFlowDeleteAll() {
      try {
        const message = await cashFlowApi.deleteAllCashFlows();
        showSuccessDialog(message || "Semua catatan arus kas berhasil direset!");
        this.setIsCashFlowDeletedAll(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowDeletedAll(false);
      } finally {
        this.setIsCashFlowDeleteAll(true);
      }
    },
  },
});
