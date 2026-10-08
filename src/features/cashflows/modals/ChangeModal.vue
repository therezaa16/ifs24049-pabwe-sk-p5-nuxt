<template>
  <CashFlowFormModal
    :model-value="form"
    :show="show"
    prefix="edit"
    title="Ubah Arus Kas"
    subtitle="Perbarui data transaksi yang sudah tersimpan"
    submit-label="Perbarui Transaksi"
    :icon="Edit3"
    :loading="loading"
    :labels="cashFlowsStore.labels"
    @close="onClose"
    @submit="handleSave"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Edit3 } from "lucide-vue-next";
import CashFlowFormModal from "../components/CashFlowFormModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { showErrorDialog } from "../../../helpers/toolsHelper";
import { emptyCashFlowForm, toPayload, validateCashFlowForm } from "../validators";

interface ChangeModalProps {
  show?: boolean;
  cashFlowId?: number | string | null;
}

const props = withDefaults(defineProps<ChangeModalProps>(), {
  show: false,
  cashFlowId: null,
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved"): void;
}>();

const cashFlowsStore = useCashFlowsStore();

const loading = ref(false);
const form = ref(emptyCashFlowForm());

function onClose() {
  emit("close");
}

watch(
  () => [props.cashFlowId, props.show],
  ([newId, newShow]) => {
    if (newId && newShow) {
      cashFlowsStore.asyncSetCashFlow(newId);
      cashFlowsStore.asyncSetLabels();
    }
  }
);

watch(
  () => [cashFlowsStore.cashFlow, props.show],
  () => {
    const current = cashFlowsStore.cashFlow;
    if (current && props.show) {
      form.value = {
        type: current.type,
        source: current.source,
        label: current.label,
        description: current.description,
        nominal: current.nominal,
      };
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => props.show,
  (newShow) => {
    document.body.style.overflow = newShow ? "hidden" : "auto";
  }
);

watch(
  () => [cashFlowsStore.isCashFlowChange, cashFlowsStore.isCashFlowChanged],
  ([isCashFlowChange, isCashFlowChanged]) => {
    if (isCashFlowChange) {
      loading.value = false;
      cashFlowsStore.setIsCashFlowChange(false);
      if (isCashFlowChanged) {
        cashFlowsStore.setIsCashFlowChanged(false);
        emit("saved");
        onClose();
      }
    }
  }
);

function handleSave() {
  const error = validateCashFlowForm(form.value);
  if (error) {
    showErrorDialog(error);
    return;
  }

  loading.value = true;
  cashFlowsStore.asyncSetIsCashFlowChange(props.cashFlowId as number | string, toPayload(form.value));
}
</script>
