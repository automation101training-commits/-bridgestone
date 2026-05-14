<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Layout Line</h1>

    <section class="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-slate-700">Machine Layout Points</h2>
        <span class="text-xs text-slate-400">{{ layoutPoints.length }} points</span>
      </div>

      <div class="rounded border border-slate-200 overflow-hidden bg-slate-100" style="min-height: calc(100vh - 220px)">
        <MachineLayoutViewer v-if="layoutPoints.length" :layout-points="layoutPoints" />
        <div v-else class="flex items-center justify-center text-sm text-slate-400" style="min-height: calc(100vh - 220px)">
          No machine layout data
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

definePageMeta({ layout: "dashboard", middleware: ["auth"] });
useHead({ title: "Layout Line | Tire Production" });

const { getMachineLayoutPoints, getMachineAlarms } = useMachines();

const layoutPoints = ref<any[]>([]);

onMounted(async () => {
  const [{ data: points }, { data: activeAlarms }] = await Promise.all([
    getMachineLayoutPoints(),
    getMachineAlarms(undefined, true),
  ]);

  const activeAlarmMachineIds = new Set((activeAlarms ?? []).map((alarm: any) => alarm.machine_id));

  layoutPoints.value = (points ?? []).map((point: any) => ({
    ...point,
    status: activeAlarmMachineIds.has(point.machine_id) ? "error" : point.status ?? "normal",
  }));
});
</script>
