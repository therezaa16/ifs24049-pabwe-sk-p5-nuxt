<template>
  <div v-if="profile" class="space-y-8 animate-in fade-in duration-300">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Ringkasan Arus Kas
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Pantau pemasukan, pengeluaran, dan saldo dari seluruh sumber dana Anda.
        </p>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          data-testid="reset-cashflows-btn"
          @click="handleDeleteAll"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/70 transition-all"
        >
          <RotateCcw :size="18" />
          <span>Reset Transaksi</span>
        </button>
        <button
          type="button"
          data-testid="add-cashflow-btn"
          @click="showAddModal = true"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all"
        >
          <Plus :size="18" :stroke-width="2.5" />
          <span>Tambah Transaksi</span>
        </button>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="card in metricCards"
        :key="card.key"
        :data-testid="`stat-${card.key}`"
        class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {{ card.label }}
          </p>
          <h3 class="text-2xl font-black mt-1" :class="card.valueClass">
            {{ formatRupiah(card.value) }}
          </h3>
        </div>
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center" :class="card.iconClass">
          <component :is="card.icon" :size="26" :stroke-width="2" />
        </div>
      </div>
    </div>

    <!-- Statistik -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <BarChart3 :size="20" class="text-indigo-600" />
          <h2 class="text-base font-bold text-slate-800">Statistik Arus Kas</h2>
        </div>
        <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            data-testid="chart-daily-btn"
            @click="chartMode = 'daily'"
            class="px-3 py-1.5 rounded-lg transition-all"
            :class="chartMode === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'"
          >
            Harian
          </button>
          <button
            type="button"
            data-testid="chart-monthly-btn"
            @click="chartMode = 'monthly'"
            class="px-3 py-1.5 rounded-lg transition-all"
            :class="chartMode === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'"
          >
            Bulanan
          </button>
        </div>
      </div>

      <p v-if="chartRows.length === 0" data-testid="chart-empty" class="text-sm text-slate-400 py-6 text-center">
        Belum ada data statistik.
      </p>
      <div v-else class="overflow-x-auto">
        <div class="flex items-end gap-3 h-44 min-w-max px-1">
          <div
            v-for="row in chartRows"
            :key="row.period"
            :data-testid="`chart-bar-${row.period}`"
            class="flex flex-col items-center gap-1 w-14"
          >
            <div class="flex items-end gap-1 h-32">
              <div
                class="w-4 rounded-t-md bg-emerald-500"
                :style="{ height: `${row.inflowPercent}%` }"
                :title="`Pemasukan ${formatRupiah(row.inflow)}`"
              />
              <div
                class="w-4 rounded-t-md bg-red-500"
                :style="{ height: `${row.outflowPercent}%` }"
                :title="`Pengeluaran ${formatRupiah(row.outflow)}`"
              />
            </div>
            <span class="text-[10px] font-medium text-slate-500">{{ row.period }}</span>
          </div>
        </div>
        <div class="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Pemasukan</span>
          <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-red-500" />Pengeluaran</span>
        </div>
      </div>
    </div>

    <!-- Filters & List -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="p-4 sm:p-5 border-b border-slate-100 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Filter :size="16" /> Filter Transaksi
          </span>
          <button
            type="button"
            data-testid="reset-filter-btn"
            @click="resetFilters"
            class="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Atur Ulang
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            data-testid="filter-type-select"
            v-model="filters.type"
            class="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="">Semua Jenis</option>
            <option v-for="item in TYPE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <select
            data-testid="filter-source-select"
            v-model="filters.source"
            class="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="">Semua Sumber</option>
            <option v-for="item in SOURCE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <select
            data-testid="filter-label-select"
            v-model="filters.label"
            class="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="">Semua Label</option>
            <option v-for="item in cashFlowsStore.labels" :key="item" :value="item">{{ item }}</option>
          </select>
          <input
            type="date"
            data-testid="filter-start-date"
            v-model="filters.start_date"
            aria-label="Tanggal awal"
            class="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
          <input
            type="date"
            data-testid="filter-end-date"
            v-model="filters.end_date"
            aria-label="Tanggal akhir"
            class="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
      </div>

      <!-- Loading / Empty -->
      <div v-if="loadingCashFlows && cashFlows.length === 0" class="px-6 py-12 text-center text-slate-400">
        <Loader2 :size="36" class="mx-auto text-indigo-600 animate-spin mb-2" />
        <p class="font-medium text-slate-600">Memuat catatan arus kas...</p>
      </div>
      <div v-else-if="cashFlows.length === 0" data-testid="cashflow-empty" class="px-6 py-12 text-center text-slate-400">
        <Wallet :size="40" class="mx-auto text-slate-300 mb-2" />
        <p class="font-medium">Belum ada catatan arus kas yang cocok.</p>
      </div>

      <template v-else>
        <!-- Table (desktop) -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th class="px-5 py-3.5 text-center w-16">ID</th>
                <th class="px-5 py-3.5">Label</th>
                <th class="px-5 py-3.5">Jenis</th>
                <th class="px-5 py-3.5">Sumber</th>
                <th class="px-5 py-3.5 text-right">Nominal</th>
                <th class="px-5 py-3.5 hidden lg:table-cell">Tanggal</th>
                <th class="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in cashFlows"
                :key="`cashflow-${item.id}`"
                :data-testid="`cashflow-row-${item.id}`"
                class="hover:bg-slate-50/70 transition-colors"
              >
                <td class="px-5 py-4 text-center font-mono text-xs font-bold text-slate-400">#{{ item.id }}</td>
                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-800 leading-snug">{{ item.label }}</p>
                  <p class="text-xs text-slate-400 line-clamp-1 mt-0.5">{{ item.description }}</p>
                </td>
                <td class="px-5 py-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                    :class="badgeClass(item.type)"
                  >
                    {{ getTypeLabel(item.type) }}
                  </span>
                </td>
                <td class="px-5 py-4 text-xs font-medium text-slate-600">{{ getSourceLabel(item.source) }}</td>
                <td class="px-5 py-4 text-right font-bold" :class="item.type === 'inflow' ? 'text-emerald-600' : 'text-red-600'">
                  {{ item.type === "inflow" ? "+" : "-" }}{{ formatRupiah(item.nominal) }}
                </td>
                <td class="px-5 py-4 hidden lg:table-cell text-xs text-slate-500">{{ formatDate(item.created_at) }}</td>
                <td class="px-5 py-4 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      :data-testid="`view-cashflow-${item.id}`"
                      @click="router.push(`/cash-flows/${item.id}`)"
                      class="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye :size="18" />
                    </button>
                    <button
                      type="button"
                      :data-testid="`edit-cashflow-${item.id}`"
                      @click="handleEdit(item.id)"
                      class="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Ubah Transaksi"
                    >
                      <Pencil :size="18" />
                    </button>
                    <button
                      type="button"
                      :data-testid="`delete-cashflow-${item.id}`"
                      @click="handleDelete(item.id)"
                      class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Transaksi"
                    >
                      <Trash2 :size="18" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards (mobile) -->
        <div class="md:hidden divide-y divide-slate-100">
          <div
            v-for="item in cashFlows"
            :key="`card-${item.id}`"
            :data-testid="`cashflow-card-${item.id}`"
            class="p-4 space-y-2"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-slate-800">{{ item.label }}</p>
                <p class="text-xs text-slate-400">{{ getSourceLabel(item.source) }} · {{ formatDate(item.created_at) }}</p>
              </div>
              <span
                class="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border"
                :class="badgeClass(item.type)"
              >
                {{ getTypeLabel(item.type) }}
              </span>
            </div>
            <p class="text-lg font-bold" :class="item.type === 'inflow' ? 'text-emerald-600' : 'text-red-600'">
              {{ item.type === "inflow" ? "+" : "-" }}{{ formatRupiah(item.nominal) }}
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                :data-testid="`view-card-cashflow-${item.id}`"
                @click="router.push(`/cash-flows/${item.id}`)"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50"
              >
                Detail
              </button>
              <button
                type="button"
                :data-testid="`edit-card-cashflow-${item.id}`"
                @click="handleEdit(item.id)"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50"
              >
                Ubah
              </button>
              <button
                type="button"
                :data-testid="`delete-card-cashflow-${item.id}`"
                @click="handleDelete(item.id)"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg text-red-700 bg-red-50"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Modals -->
    <AddModal :show="showAddModal" @close="showAddModal = false" @saved="refreshAll" />
    <ChangeModal
      :show="showChangeModal"
      :cash-flow-id="selectedCashFlowId"
      @close="showChangeModal = false"
      @saved="refreshAll"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { useUsersStore } from "../../users/states/usersStore";
import {
  SOURCE_OPTIONS,
  TYPE_OPTIONS,
  getSourceLabel,
  getTypeLabel,
  type CashFlowQueryParams,
} from "../api/cashFlowApi";
import { formatDate, formatRupiah, showConfirmDialog } from "../../../helpers/toolsHelper";
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Banknote,
  PiggyBank,
  HandCoins,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Loader2,
  RotateCcw,
  BarChart3,
} from "lucide-vue-next";

const router = useRouter();
const cashFlowsStore = useCashFlowsStore();
const usersStore = useUsersStore();

const profile = computed(() => usersStore.profile);
const cashFlows = computed(() => cashFlowsStore.cashFlows);
const stats = computed(() => cashFlowsStore.stats);

const loadingCashFlows = ref(false);
const showAddModal = ref(false);
const showChangeModal = ref(false);
const selectedCashFlowId = ref<number | string | null>(null);
const chartMode = ref<"daily" | "monthly">("daily");

const filters = reactive({
  type: "",
  source: "",
  label: "",
  start_date: "",
  end_date: "",
});

let isMounted = true;

const metricCards = computed(() => [
  {
    key: "cashflow",
    label: "Total Saldo Kas Bersih",
    value: stats.value.cashflow,
    icon: Wallet,
    valueClass: "text-slate-800",
    iconClass: "bg-indigo-50 text-indigo-600",
  },
  {
    key: "inflow",
    label: "Total Pemasukan (Inflow)",
    value: stats.value.total_inflow,
    icon: TrendingUp,
    valueClass: "text-emerald-600",
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "outflow",
    label: "Total Pengeluaran (Outflow)",
    value: stats.value.total_outflow,
    icon: TrendingDown,
    valueClass: "text-red-600",
    iconClass: "bg-red-50 text-red-600",
  },
  {
    key: "cash",
    label: "Saldo Kas Tunai",
    value: stats.value.cash,
    icon: Banknote,
    valueClass: "text-slate-800",
    iconClass: "bg-amber-50 text-amber-600",
  },
  {
    key: "savings",
    label: "Saldo Rekening Tabungan",
    value: stats.value.savings,
    icon: PiggyBank,
    valueClass: "text-slate-800",
    iconClass: "bg-sky-50 text-sky-600",
  },
  {
    key: "loans",
    label: "Saldo Pinjaman",
    value: stats.value.loans,
    icon: HandCoins,
    valueClass: "text-slate-800",
    iconClass: "bg-purple-50 text-purple-600",
  },
]);

const chartRows = computed(() => {
  const source = chartMode.value === "daily" ? cashFlowsStore.statsDaily : cashFlowsStore.statsMonthly;
  if (!source) return [];
  const periods = Object.keys(source.stats_inflow);
  const maxValue = Math.max(
    1,
    ...periods.map((p) => Math.max(source.stats_inflow[p] || 0, source.stats_outflow[p] || 0))
  );
  return periods.map((period) => {
    const inflow = source.stats_inflow[period] || 0;
    const outflow = source.stats_outflow[period] || 0;
    return {
      period,
      inflow,
      outflow,
      inflowPercent: (inflow / maxValue) * 100,
      outflowPercent: (outflow / maxValue) * 100,
    };
  });
});

function buildQuery(): CashFlowQueryParams {
  return {
    type: filters.type as CashFlowQueryParams["type"],
    source: filters.source as CashFlowQueryParams["source"],
    label: filters.label,
    start_date: filters.start_date ? `${filters.start_date} 00:00:00` : "",
    end_date: filters.end_date ? `${filters.end_date} 23:59:59` : "",
  };
}

function badgeClass(type: string) {
  return type === "inflow"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
    : "bg-red-50 text-red-700 border-red-200/60";
}

function loadCashFlows() {
  loadingCashFlows.value = true;
  Promise.resolve(cashFlowsStore.asyncSetCashFlows(buildQuery())).finally(() => {
    if (isMounted) loadingCashFlows.value = false;
  });
}

function loadChart() {
  if (chartMode.value === "daily") {
    cashFlowsStore.asyncSetStatsDaily();
  } else {
    cashFlowsStore.asyncSetStatsMonthly();
  }
}

function refreshAll() {
  loadCashFlows();
  loadChart();
  cashFlowsStore.asyncSetLabels();
}

onMounted(() => {
  isMounted = true;
  refreshAll();
});

onBeforeUnmount(() => {
  isMounted = false;
});

watch(filters, loadCashFlows);
watch(chartMode, loadChart);

watch(
  () => cashFlowsStore.isCashFlowDeleted,
  (deleted) => {
    if (deleted) {
      cashFlowsStore.setIsCashFlowDeleted(false);
      refreshAll();
    }
  }
);

watch(
  () => cashFlowsStore.isCashFlowDeletedAll,
  (deleted) => {
    if (deleted) {
      cashFlowsStore.setIsCashFlowDeletedAll(false);
      refreshAll();
    }
  }
);

function resetFilters() {
  filters.type = "";
  filters.source = "";
  filters.label = "";
  filters.start_date = "";
  filters.end_date = "";
}

function handleEdit(cashFlowId: number | string) {
  selectedCashFlowId.value = cashFlowId;
  showChangeModal.value = true;
}

async function handleDelete(cashFlowId: number | string) {
  const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus transaksi ini?");
  if (result.isConfirmed) {
    cashFlowsStore.asyncSetIsCashFlowDelete(cashFlowId);
  }
}

async function handleDeleteAll() {
  const result = await showConfirmDialog(
    "Seluruh catatan arus kas Anda akan dihapus permanen. Lanjutkan reset?"
  );
  if (result.isConfirmed) {
    cashFlowsStore.asyncSetIsCashFlowDeleteAll();
  }
}
</script>
