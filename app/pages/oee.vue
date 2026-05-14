<template>
  <div class="min-h-screen flex">
    <ProductionSidebar active="oee" />

    <div class="flex-1 ml-40 min-h-screen bg-[#4e9fac] p-5 overflow-auto">
      <div v-if="errorMessages.length" class="mb-4 rounded-xl bg-red-950/70 px-4 py-3 text-sm text-red-200">
        {{ errorMessages.join(" | ") }}
      </div>
      <div v-else-if="!hasAnyData" class="mb-4 rounded-xl bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
        No data returned from Supabase tables yet.
      </div>

      <div class="grid grid-cols-1 gap-4 mb-5 md:grid-cols-2 xl:grid-cols-4">
        <div v-for="kpi in kpis" :key="kpi.label" class="rounded-xl bg-[#90ee90] shadow px-5 py-4 flex flex-col items-start">
          <p class="text-slate-700 text-sm font-semibold mb-1">{{ kpi.label }}</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-black text-slate-900">{{ kpi.value }}</span>
            <span class="text-slate-600 text-sm font-medium mb-1">{{ kpi.unit }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-[#1a2340] shadow p-4 mb-5">
        <p class="text-white text-sm font-semibold mb-3">Movement Efficiency</p>
        <Line v-if="movementLineData" :data="movementLineData" :options="lineOptions" class="max-h-44" />
        <div v-else class="h-44 flex items-center justify-center text-sm text-slate-400">No movement efficiency data</div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div class="flex flex-col gap-4">
          <div class="rounded-xl bg-[#1a2340] shadow p-4">
            <p class="text-white text-sm font-semibold mb-3">Machine OEE</p>
            <Bar v-if="machineBarData" :data="machineBarData" :options="barOptions" class="max-h-40" />
            <div v-else class="h-40 flex items-center justify-center text-sm text-slate-400">No machine OEE data</div>
          </div>

          <div class="rounded-xl bg-[#1a2340] shadow p-4">
            <p class="text-white text-sm font-semibold mb-3">Loss Time Distribution</p>
            <Bar v-if="lossBarData" :data="lossBarData" :options="barOptions" class="max-h-40" />
            <div v-else class="h-40 flex items-center justify-center text-sm text-slate-400">No loss time data</div>
          </div>

          <div class="rounded-xl bg-[#1a2340] shadow p-4">
            <p class="text-white text-sm font-semibold mb-3">Recent Machine OEE</p>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-600">
                  <th class="text-left text-slate-400 font-medium py-1 pb-2">Machine</th>
                  <th class="text-left text-slate-400 font-medium py-1 pb-2">Status</th>
                  <th class="text-left text-slate-400 font-medium py-1 pb-2">OEE</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in recentMachineRows" :key="row.machine" class="border-b border-slate-700/50">
                  <td class="text-white py-2">{{ row.machine }}</td>
                  <td class="py-2">
                    <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="row.badgeClass">{{ row.status }}</span>
                  </td>
                  <td class="text-white py-2">{{ row.oee }}</td>
                </tr>
                <tr v-if="recentMachineRows.length === 0">
                  <td colspan="3" class="py-6 text-center text-slate-500">No machine rows</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div class="rounded-xl bg-[#1a2340] shadow p-4">
            <p class="text-white text-sm font-semibold mb-3">Line Efficiency Share</p>
            <div class="flex items-center gap-4">
              <Pie v-if="linePieData" :data="linePieData" :options="pieOptions" class="max-h-44" />
              <div v-else class="h-44 flex flex-1 items-center justify-center text-sm text-slate-400">No line efficiency data</div>
              <div class="flex flex-col gap-2">
                <div v-for="item in pieLegend" :key="item.label" class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-sm inline-block" :style="{ backgroundColor: item.color }" />
                  <span class="text-white text-xs">{{ item.label }} {{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-xl bg-[#1a2340] shadow p-4">
            <p class="text-white text-sm font-semibold mb-3">Line Efficiency Table</p>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-600">
                  <th class="text-left text-slate-400 font-medium py-1 pb-2">Line</th>
                  <th class="text-left text-slate-400 font-medium py-1 pb-2">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in lineEfficiencyRows" :key="line.lineName" class="border-b border-slate-700/50">
                  <td class="text-white py-2">{{ line.lineName }}</td>
                  <td class="text-white py-2">{{ line.efficiency }}</td>
                </tr>
                <tr v-if="lineEfficiencyRows.length === 0">
                  <td colspan="2" class="py-6 text-center text-slate-500">No line efficiency rows</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie } from "vue-chartjs";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

definePageMeta({ layout: false });
useHead({ title: "OEE | Tire Production" });

const { load } = useProductionDashboard();

const dashboardData = ref<any>(null);

onMounted(async () => {
  dashboardData.value = await load();
});

const avgLineEfficiency = computed(() => {
  const rows = dashboardData.value?.lineEfficiency ?? [];
  if (!rows.length) return 0;
  return rows.reduce((sum: number, row: any) => sum + Number(row.efficiency ?? 0), 0) / rows.length;
});

const avgMovement = computed(() => {
  const rows = dashboardData.value?.movement ?? [];
  if (!rows.length) return 0;
  return rows.reduce((sum: number, row: any) => sum + Number(row.value ?? 0), 0) / rows.length;
});

const kpis = computed(() => [
  { label: "Total Output", value: dashboardData.value?.productionDaily?.total_production ?? "-", unit: "pcs" },
  { label: "Avg Line Eff.", value: avgLineEfficiency.value ? avgLineEfficiency.value.toFixed(1) : "-", unit: "%" },
  { label: "Avg Movement", value: avgMovement.value ? avgMovement.value.toFixed(1) : "-", unit: "%" },
  { label: "Machine OEE Rows", value: dashboardData.value?.oeeByMachine?.length ?? 0, unit: "rows" },
]);

const movementLineData = computed(() => {
  const rows = dashboardData.value?.movement ?? [];
  if (!rows.length) return null;
  return {
    labels: rows.map((item: any) => String(item.hour)),
    datasets: [{
      label: "Output",
      data: rows.map((item: any) => Number(item.value ?? 0)),
      borderColor: "#60d0e4",
      backgroundColor: "rgba(96,208,228,0.15)",
      pointBackgroundColor: "#60d0e4",
      pointRadius: 4,
      tension: 0.3,
      fill: true,
    }],
  };
});

const lineOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { color: "#1e3050" } },
    y: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { color: "#1e3050" } },
  },
};

const machineBarData = computed(() => {
  const rows = dashboardData.value?.oeeByMachine ?? [];
  if (!rows.length) return null;
  return {
    labels: rows.map((row: any) => row.machine),
    datasets: [{
      label: "OEE",
      data: rows.map((row: any) => Number(row.oee ?? 0)),
      backgroundColor: rows.map((row: any) =>
        row.status === "RUNNING" ? "#4a90d9" :
        row.status === "ALARM" ? "#ef4444" :
        row.status === "WARNING" ? "#e8a838" : "#94a3b8"),
      borderRadius: 3,
    }],
  };
});

const lossBarData = computed(() => {
  const row = dashboardData.value?.lossTime;
  if (!row) return null;
  return {
    labels: ["Breakdown", "Tool Change", "Model Change", "Q Adjust"],
    datasets: [{
      label: "Loss %",
      data: [
        Number(row.breakdown ?? 0),
        Number(row.tool_change ?? 0),
        Number(row.model_change ?? 0),
        Number(row.q_adjust ?? 0),
      ],
      backgroundColor: ["#ef4444", "#4a90d9", "#7ecc5a", "#e8a838"],
      borderRadius: 3,
    }],
  };
});

const barOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { display: false } },
    y: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { color: "#1e3050" } },
  },
};

const piePalette = ["#7ecc5a", "#4a90d9", "#e8a838", "#ef4444", "#a855f7", "#22c55e"];

const linePieData = computed(() => {
  const rows = dashboardData.value?.lineEfficiency ?? [];
  if (!rows.length) return null;
  return {
    labels: rows.map((row: any) => row.lineName),
    datasets: [{
      data: rows.map((row: any) => Number(row.efficiency ?? 0)),
      backgroundColor: rows.map((_: any, index: number) => piePalette[index % piePalette.length]),
      borderWidth: 0,
    }],
  };
});

const pieLegend = computed(() =>
  (dashboardData.value?.lineEfficiency ?? []).map((row: any, index: number) => ({
    label: row.lineName,
    value: `${Number(row.efficiency ?? 0).toFixed(1)}%`,
    color: piePalette[index % piePalette.length],
  }))
);

const pieOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
};

const badgeClass = (status: string) =>
  ({
    RUNNING: "bg-emerald-500/20 text-emerald-300",
    WARNING: "bg-yellow-500/20 text-yellow-300",
    ALARM: "bg-red-500/20 text-red-300",
    STOP: "bg-slate-500/20 text-slate-200",
  }[status] ?? "bg-slate-500/20 text-slate-200");

const recentMachineRows = computed(() =>
  (dashboardData.value?.oeeByMachine ?? []).map((row: any) => ({
    machine: row.machine,
    status: row.status,
    badgeClass: badgeClass(row.status),
    oee: `${Number(row.oee ?? 0).toFixed(1)}%`,
  }))
);

const lineEfficiencyRows = computed(() =>
  (dashboardData.value?.lineEfficiency ?? []).map((row: any) => ({
    lineName: row.lineName,
    efficiency: `${Number(row.efficiency ?? 0).toFixed(1)}%`,
  }))
);

const errorMessages = computed(() =>
  Object.entries(dashboardData.value?.errors ?? {})
    .filter(([, error]) => !!error)
    .map(([key, error]: any) => `${key}: ${error.message ?? error}`)
);

const hasAnyData = computed(() => !!dashboardData.value?.hasAnyData);

</script>
