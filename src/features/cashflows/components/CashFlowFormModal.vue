<template>
  <div
    v-if="show"
    :data-testid="`${prefix}-cashflow-modal`"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
  >
    <div class="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <component :is="icon" :size="18" :stroke-width="2.5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-800">{{ title }}</h3>
            <p class="text-xs text-slate-500">{{ subtitle }}</p>
          </div>
        </div>
        <button
          type="button"
          :data-testid="`close-${prefix}-modal-btn`"
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="emit('submit')" class="p-6 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Jenis Arus Kas</label>
            <select
              :data-testid="`${prefix}-cashflow-type-select`"
              v-model="form.type"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option v-for="item in TYPE_OPTIONS" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Sumber Dana</label>
            <select
              :data-testid="`${prefix}-cashflow-source-select`"
              v-model="form.source"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option v-for="item in SOURCE_OPTIONS" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">
            Label Kategori <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            :list="`${prefix}-label-options`"
            :data-testid="`${prefix}-cashflow-label-input`"
            v-model="form.label"
            placeholder="Contoh: gaji, alat-mandi"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
          <datalist :id="`${prefix}-label-options`">
            <option v-for="item in labels" :key="item" :value="item" />
          </datalist>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">
            Nominal (Rupiah) <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">Rp</span>
            <input
              type="number"
              min="0"
              :data-testid="`${prefix}-cashflow-nominal-input`"
              v-model="form.nominal"
              placeholder="0"
              class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
          <p class="mt-1 text-xs text-slate-500" :data-testid="`${prefix}-nominal-preview`">
            {{ formatRupiah(form.nominal) }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">
            Keterangan <span class="text-red-500">*</span>
          </label>
          <textarea
            rows="3"
            :data-testid="`${prefix}-cashflow-description-input`"
            v-model="form.description"
            placeholder="Tuliskan keterangan transaksi..."
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            :data-testid="`cancel-${prefix}-modal-btn`"
            @click="emit('close')"
            :disabled="loading"
            class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            :data-testid="`submit-${prefix}-modal-btn`"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
          >
            <template v-if="loading">
              <Loader2 :size="18" class="animate-spin" />
              <span>Menyimpan...</span>
            </template>
            <template v-else>
              <component :is="icon" :size="18" :stroke-width="2.5" />
              <span>{{ submitLabel }}</span>
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, Loader2 } from "lucide-vue-next";
import { SOURCE_OPTIONS, TYPE_OPTIONS } from "../api/cashFlowApi";
import { formatRupiah } from "../../../helpers/toolsHelper";
import type { CashFlowFormValue } from "../validators";

interface FormModalProps {
  show?: boolean;
  prefix: string;
  title: string;
  subtitle: string;
  submitLabel: string;
  icon: any;
  loading?: boolean;
  labels?: string[];
}

withDefaults(defineProps<FormModalProps>(), {
  show: false,
  loading: false,
  labels: () => [],
});

const form = defineModel<CashFlowFormValue>({ required: true });

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit"): void;
}>();
</script>
