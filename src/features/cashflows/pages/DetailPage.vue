<template>
  <div v-if="!profile || !cashFlow" class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>

  <div v-else class="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <RouterLink
        to="/"
        data-testid="back-to-cashflows-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft :size="18" />
        Kembali ke Ringkasan
      </RouterLink>

      <div class="flex items-center gap-2">
        <button
          type="button"
          data-testid="edit-detail-cashflow-btn"
          @click="showEditModal = true"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
        >
          <Edit3 :size="16" />
          Ubah
        </button>
        <button
          type="button"
          data-testid="delete-detail-cashflow-btn"
          @click="handleDelete"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
        >
          <Trash2 :size="16" />
          Hapus
        </button>
      </div>
    </div>

    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div
        class="p-6 sm:p-8 text-white"
        :class="isInflow ? 'bg-gradient-to-br from-emerald-600 to-emerald-500' : 'bg-gradient-to-br from-red-600 to-rose-500'"
      >
        <div class="flex items-center gap-3 mb-3">
          <span class="font-mono text-xs font-bold text-white/70">#{{ cashFlow.id }}</span>
          <span
            data-testid="detail-type-badge"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20"
          >
            <component :is="isInflow ? TrendingUp : TrendingDown" :size="14" />
            {{ getTypeLabel(cashFlow.type) }}
          </span>
        </div>
        <p class="text-sm text-white/80">Nominal Transaksi</p>
        <h1 data-testid="detail-nominal" class="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {{ isInflow ? "+" : "-" }}{{ formatRupiah(cashFlow.nominal) }}
        </h1>
      </div>

      <div class="p-6 sm:p-8 space-y-6">
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag :size="14" /> Label Kategori
            </dt>
            <dd data-testid="detail-label" class="mt-1 font-semibold text-slate-800">{{ cashFlow.label }}</dd>
          </div>
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Landmark :size="14" /> Sumber Dana
            </dt>
            <dd data-testid="detail-source" class="mt-1 font-semibold text-slate-800">
              {{ getSourceLabel(cashFlow.source) }}
            </dd>
          </div>
        </dl>

        <div data-testid="detail-description" class="bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Keterangan</p>
          <p class="text-slate-600 leading-relaxed whitespace-pre-line">{{ cashFlow.description }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <div class="flex items-center gap-1.5">
            <Calendar :size="14" class="shrink-0" />
            <span>Dibuat: <strong class="text-slate-500">{{ formatDate(cashFlow.created_at) }}</strong></span>
          </div>
          <div class="flex items-center gap-1.5">
            <Calendar :size="14" class="shrink-0" />
            <span>Diperbarui: <strong class="text-slate-500">{{ formatDate(cashFlow.updated_at) }}</strong></span>
          </div>
        </div>
      </div>
    </div>

    <ChangeModal
      :show="showEditModal"
      :cash-flow-id="cashFlow.id"
      @close="showEditModal = false"
      @saved="reload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import ChangeModal from "../modals/ChangeModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { useUsersStore } from "../../users/states/usersStore";
import { getSourceLabel, getTypeLabel } from "../api/cashFlowApi";
import { formatDate, formatRupiah, showConfirmDialog } from "../../../helpers/toolsHelper";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  Tag,
  Landmark,
  TrendingUp,
  TrendingDown,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const cashFlowsStore = useCashFlowsStore();
const usersStore = useUsersStore();

const cashFlowId = computed(() => route.params.cashFlowId as string);
const profile = computed(() => usersStore.profile);
const cashFlow = computed(() => cashFlowsStore.cashFlow);
const isInflow = computed(() => cashFlow.value?.type === "inflow");

const showEditModal = ref(false);

function reload() {
  cashFlowsStore.asyncSetCashFlow(cashFlowId.value);
}

onMounted(() => {
  if (cashFlowId.value) {
    reload();
  }
});

watch(cashFlowId, (newId) => {
  if (newId) {
    reload();
  }
});

watch(
  () => [cashFlowsStore.isCashFlow, cashFlowsStore.cashFlow],
  ([isLoaded, current]) => {
    if (isLoaded) {
      cashFlowsStore.setIsCashFlow(false);
      if (!current) {
        router.push("/");
      }
    }
  }
);

watch(
  () => cashFlowsStore.isCashFlowDeleted,
  (isDeleted) => {
    if (isDeleted) {
      cashFlowsStore.setIsCashFlowDeleted(false);
      router.push("/");
    }
  }
);

async function handleDelete() {
  const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus transaksi ini?");
  if (result.isConfirmed && cashFlow.value) {
    cashFlowsStore.asyncSetIsCashFlowDelete(cashFlow.value.id);
  }
}
</script>
