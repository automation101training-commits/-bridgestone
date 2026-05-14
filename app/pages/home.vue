<template>
  <div class="min-h-screen flex bg-[#5f9bb1]">
    <ProductionSidebar active="home" />

    <main class="flex-1 ml-40 min-h-screen px-6 py-7 lg:px-8">
      <div v-if="errorMessages.length" class="mb-4 rounded-xl bg-red-950/70 px-4 py-3 text-sm text-red-200">
        {{ errorMessages.join(" | ") }}
      </div>
      <div v-else-if="!hasAnyData" class="mb-4 rounded-xl bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
        No data returned from Supabase tables yet.
      </div>

      <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-[26px] bg-[#82f55f] px-5 py-5 text-[#111] shadow-[0_10px_20px_rgba(0,0,0,0.16)]"
        >
          <p class="text-[1.05rem] font-medium">{{ card.label }}</p>
          <div class="mt-4 flex items-end gap-3">
            <span class="text-[2.25rem] leading-none font-medium">{{ card.value }}</span>
            <span class="pb-1 text-[1rem]">{{ card.unit }}</span>
          </div>
        </article>
      </section>

      <section class="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.9fr_1.05fr]">
        <article class="dashboard-panel px-4 py-3">
          <div class="flex items-center justify-between text-white/90">
            <div class="flex items-center gap-2">
              <span class="h-3 w-3 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.7)]"></span>
              <h2 class="text-[1.05rem] font-semibold">Production Overview</h2>
            </div>
            <div class="text-right">
              <div class="text-xs uppercase tracking-[0.25em] text-slate-400">Latest</div>
              <div class="text-3xl font-semibold text-white/90">{{ latestProductionValue }}</div>
            </div>
          </div>

          <div class="mt-3 rounded-2xl border border-white/6 bg-[rgba(10,18,34,0.78)] p-4">
            <Line v-if="productionChartData" :data="productionChartData" :options="chartOptions" class="h-72" />
            <div v-else class="flex h-72 items-center justify-center text-sm text-slate-400">No production data</div>
          </div>
        </article>

        <article class="dashboard-panel px-4 py-3">
          <div class="flex items-center justify-between text-white/90">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold tracking-[0.25em] text-slate-300">STS</span>
              <h2 class="text-[1.05rem] font-semibold">Machine Status</h2>
            </div>
            <span class="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
              {{ totalMachines }} machines
            </span>
          </div>

          <div class="mt-4 grid grid-cols-[1fr_1.05fr] gap-3">
            <div class="space-y-3">
              <div
                v-for="item in statusSummaryCards"
                :key="item.label"
                class="rounded-xl border border-white/8 bg-white/6 px-3 py-3 shadow-inner"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-base font-semibold tracking-wide text-slate-100">{{ item.label }}</span>
                  <span class="rounded-md px-3 py-1 text-xs font-semibold tracking-wide" :class="item.badgeClass">
                    {{ item.value }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-center justify-center">
              <div class="h-44 w-44">
                <Doughnut v-if="statusChartData" :data="statusChartData" :options="statusChartOptions" />
                <div v-else class="flex h-full items-center justify-center text-xs text-slate-400">No status data</div>
              </div>
              <div class="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-300">
                <div v-for="item in pieLegend" :key="item.label" class="flex items-center gap-1.5">
                  <span class="h-3 w-3 rounded-sm" :style="{ backgroundColor: item.color }"></span>
                  <span>{{ item.label }} {{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1.1fr]">
        <article class="dashboard-panel px-4 py-3">
          <div class="flex items-center justify-between text-white/90">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold tracking-[0.25em] text-slate-300">TOP</span>
              <h2 class="text-[1.05rem] font-semibold">Latest Machine Snapshot</h2>
            </div>
            <span class="text-xs text-slate-400">Real-time from logs</span>
          </div>

          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <div v-for="machine in machineSnapshotCards" :key="machine.id" class="machine-card rounded-xl px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-[1.2rem] leading-none text-slate-100">{{ machine.name }}</p>
                  <p class="mt-1 text-xs tracking-wide text-slate-400">{{ machine.spec }}</p>
                </div>
                <span class="rounded-md px-3 py-1 text-xs font-semibold tracking-wide" :class="machine.badgeClass">
                  {{ machine.status }}
                </span>
              </div>

              <div class="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-300">
                <div class="rounded-lg bg-white/5 px-2 py-2">
                  <div class="text-slate-500">OEE</div>
                  <div class="mt-1 text-sm font-semibold text-amber-300">{{ machine.oee }}</div>
                </div>
                <div class="rounded-lg bg-white/5 px-2 py-2">
                  <div class="text-slate-500">Zone</div>
                  <div class="mt-1 text-sm font-semibold text-slate-100">{{ machine.zone }}</div>
                </div>
                <div class="rounded-lg bg-white/5 px-2 py-2">
                  <div class="text-slate-500">Updated</div>
                  <div class="mt-1 text-sm font-semibold text-slate-100">{{ machine.updatedAt }}</div>
                </div>
              </div>

              <div v-if="machine.alarmName" class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {{ machine.alarmName }}
              </div>
            </div>
          </div>
        </article>

        <article class="dashboard-panel px-4 py-3">
          <div class="flex items-center justify-between text-white/90">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold tracking-[0.25em] text-slate-300">DB</span>
              <h2 class="text-[1.05rem] font-semibold">Machine OEE Table</h2>
            </div>
            <span class="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-300">
              {{ productionTableRows.length }} rows
            </span>
          </div>

          <div class="mt-4 overflow-hidden rounded-2xl border border-white/6 bg-[rgba(14,22,39,0.72)]">
            <table class="w-full text-left text-sm text-slate-200">
              <thead class="bg-white/6 text-slate-400">
                <tr>
                  <th v-for="column in productionTableColumns" :key="column.key" class="px-4 py-3 font-medium">
                    {{ column.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in productionTableRows"
                  :key="row.id"
                  class="border-t border-white/6 transition-colors hover:bg-white/5"
                >
                  <td class="px-4 py-3 text-sky-300">{{ row.machine }}</td>
                  <td class="px-4 py-3 text-slate-100">{{ row.zone }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="row.badgeClass">
                      {{ row.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-amber-300">{{ row.oee }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ row.alarm }}</td>
                  <td class="px-4 py-3 text-slate-400">{{ row.updatedAt }}</td>
                </tr>
                <tr v-if="productionTableRows.length === 0">
                  <td colspan="6" class="px-4 py-8 text-center text-sm text-slate-500">No machine OEE data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
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
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "vue-chartjs";

definePageMeta({ layout: false });
useHead({ title: "Home | Tire Production" });

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const { load } = useProductionDashboard();

const dashboardData = ref<any>(null);

const fetchDashboard = async () => {
  dashboardData.value = await load();
};

onMounted(fetchDashboard);

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "-";

const statusBadgeClass = (status: string) =>
  ({
    RUNNING: "bg-emerald-500/20 text-emerald-300",
    WARNING: "bg-yellow-500/20 text-yellow-300",
    ALARM: "bg-red-500/20 text-red-300",
    STOP: "bg-slate-500/20 text-slate-200",
  }[status] ?? "bg-slate-500/20 text-slate-200");

const totalMachines = computed(() => dashboardData.value?.machineCards?.length ?? 0);
const latestProductionValue = computed(() => dashboardData.value?.productionDaily?.total_production ?? "-");

const summaryCards = computed(() => {
  const data = dashboardData.value;
  return [
    { label: "Total Production", value: data?.productionDaily?.total_production ?? "-", unit: "pcs" },
    { label: "Running Machines", value: data?.statusOverview?.RUNNING ?? 0, unit: "machines" },
    { label: "Active Alarms", value: data?.activeAlarms?.length ?? 0, unit: "events" },
    { label: "Last Activity", value: formatDateTime(data?.lastActivityTimestamp ? new Date(data.lastActivityTimestamp).toISOString() : ""), unit: "" },
  ];
});

const errorMessages = computed(() =>
  Object.entries(dashboardData.value?.errors ?? {})
    .filter(([, error]) => !!error)
    .map(([key, error]: any) => `${key}: ${error.message ?? error}`)
);

const hasAnyData = computed(() => !!dashboardData.value?.hasAnyData);

const productionChartData = computed(() => {
  const movement = dashboardData.value?.movement ?? [];
  if (!movement.length) return null;
  return {
    labels: movement.map((item: any) => String(item.hour)),
    datasets: [
      {
        label: "Movement Efficiency",
        data: movement.map((item: any) => Number(item.value ?? 0)),
        borderColor: "#89d5ff",
        backgroundColor: "rgba(86, 195, 255, 0.16)",
        pointBackgroundColor: "#d5f1ff",
        pointRadius: 3,
        tension: 0.35,
        fill: true,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { color: "#94a3b8" },
      grid: { color: "rgba(255,255,255,0.06)" },
      border: { display: false },
    },
    y: {
      ticks: { color: "#94a3b8" },
      grid: { color: "rgba(255,255,255,0.06)" },
      border: { display: false },
    },
  },
};

const statusSummaryCards = computed(() => {
  const overview = dashboardData.value?.statusOverview ?? {};
  return [
    { label: "RUNNING", value: overview.RUNNING ?? 0, badgeClass: statusBadgeClass("RUNNING") },
    { label: "WARNING", value: overview.WARNING ?? 0, badgeClass: statusBadgeClass("WARNING") },
    { label: "ALARM", value: overview.ALARM ?? 0, badgeClass: statusBadgeClass("ALARM") },
    { label: "STOP", value: overview.STOP ?? 0, badgeClass: statusBadgeClass("STOP") },
  ];
});

const pieLegend = computed(() => statusSummaryCards.value.map((item) => ({
  label: item.label,
  value: item.value,
  color:
    item.label === "RUNNING" ? "#22c55e" :
    item.label === "WARNING" ? "#facc15" :
    item.label === "ALARM" ? "#ef4444" :
    "#64748b",
})));

const statusChartData = computed(() => {
  const rows = pieLegend.value;
  if (!rows.length) return null;
  return {
    labels: rows.map((item) => item.label),
    datasets: [
      {
        data: rows.map((item) => item.value),
        backgroundColor: rows.map((item) => item.color),
        borderWidth: 0,
      },
    ],
  };
});

const statusChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "62%",
  plugins: { legend: { display: false } },
};

const machineSnapshotCards = computed(() =>
  (dashboardData.value?.machineCards ?? [])
    .slice(0, 6)
    .map((machine: any) => ({
      id: machine.id,
      name: machine.name,
      spec: machine.spec,
      zone: machine.zone,
      status: machine.status,
      badgeClass: statusBadgeClass(machine.status),
      oee: machine.oee ? `${machine.oee.toFixed(1)}%` : "-",
      updatedAt: formatDateTime(machine.updatedAt),
      alarmName: machine.latestAlarm?.alarm_name ?? "",
    }))
);

const productionTableColumns = [
  { key: "machine", label: "Machine" },
  { key: "zone", label: "Zone" },
  { key: "status", label: "Status" },
  { key: "oee", label: "OEE" },
  { key: "alarm", label: "Latest Alarm" },
  { key: "updatedAt", label: "Updated" },
];

const productionTableRows = computed(() =>
  (dashboardData.value?.recentProductionTable ?? []).map((row: any) => ({
    id: row.id,
    machine: row.machine,
    zone: row.zone,
    status: row.status,
    badgeClass: statusBadgeClass(row.status),
    oee: row.oee ? `${Number(row.oee).toFixed(1)}%` : "-",
    alarm: row.alarmName && row.alarmName !== "-" ? row.alarmName : "-",
    updatedAt: formatDateTime(row.updatedAt),
  }))
);

</script>

<style scoped>
.dashboard-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(120, 175, 255, 0.08);
  border-radius: 1.5rem;
  background:
    radial-gradient(circle at top, rgba(49, 101, 181, 0.16), transparent 36%),
    linear-gradient(180deg, rgba(19, 30, 50, 0.97), rgba(10, 18, 35, 0.95));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 30px rgba(7, 12, 23, 0.3);
}

.dashboard-panel::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: linear-gradient(90deg, rgba(72, 173, 255, 0), rgba(72, 173, 255, 0.9), rgba(72, 173, 255, 0));
}

.machine-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  background:
    linear-gradient(180deg, rgba(42, 58, 86, 0.45), rgba(18, 28, 46, 0.78)),
    radial-gradient(circle at left, rgba(65, 165, 255, 0.08), transparent 35%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}
</style>
