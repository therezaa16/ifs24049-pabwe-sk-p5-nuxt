<template>
  <CashFlowFormModal
    :model-value="form"
    :show="show"
    prefix="add"
    title="Catat Arus Kas Baru"
    subtitle="Tambahkan transaksi pemasukan atau pengeluaran"
    submit-label="Simpan Transaksi"
    :icon="Plus"
    :loading="loading"
    :labels="cashFlowsStore.labels"
    @close="onClose"
    @submit="handleSave"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Plus } from "lucide-vue-next";
import CashFlowFormModal from "../components/CashFlowFormModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { showErrorDialog } from "../../../helpers/toolsHelper";
import { emptyCashFlowForm, toPayload, validateCashFlowForm } from "../validators";

interface AddModalProps {
  show?: boolean;
}

const props = withDefaults(defineProps<AddModalProps>(), {
  show: false,
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
  () => props.show,
  (newShow) => {
    document.body.style.overflow = newShow ? "hidden" : "auto";
    if (newShow) {
      cashFlowsStore.asyncSetLabels();
    }
  }
);

watch(
  () => [cashFlowsStore.isCashFlowAdd, cashFlowsStore.isCashFlowAdded],
  ([isCashFlowAdd, isCashFlowAdded]) => {
    if (isCashFlowAdd) {
      loading.value = false;
      cashFlowsStore.setIsCashFlowAdd(false);
      if (isCashFlowAdded) {
        cashFlowsStore.setIsCashFlowAdded(false);
        form.value = emptyCashFlowForm();
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
  cashFlowsStore.asyncSetIsCashFlowAdd(toPayload(form.value));
}
</script>
