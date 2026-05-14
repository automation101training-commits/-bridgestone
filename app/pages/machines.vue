<template>
  <div class="min-h-screen flex">
    <ProductionSidebar active="machines" />

    <div class="flex-1 ml-40 min-h-screen bg-[#0a0e1a] flex flex-col">
      <div v-if="errorMessages.length" class="mx-4 mt-4 rounded-xl bg-red-950/70 px-4 py-3 text-sm text-red-200">
        {{ errorMessages.join(" | ") }}
      </div>
      <div v-else-if="!hasAnyData" class="mx-4 mt-4 rounded-xl bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
        No data returned from Supabase tables yet.
      </div>

      <div class="flex items-center gap-6 px-6 py-3 bg-[#111827] border-b border-slate-700/50">
        <div v-for="item in topStats" :key="item.label" class="flex items-center gap-2">
          <div>
            <div class="text-slate-400 text-xs">{{ item.label }}</div>
            <div class="text-white text-xl font-black">
              {{ item.value }}
              <span v-if="item.unit" class="text-sm font-normal text-slate-300">{{ item.unit }}</span>
            </div>
          </div>
        </div>

        <div class="flex-1" />

        <div class="flex items-center gap-4 text-xs">
          <span v-for="item in legendItems" :key="item.label" class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm inline-block" :style="{ backgroundColor: item.color }" />
            <span class="text-slate-300">{{ item.label }}</span>
          </span>
        </div>
      </div>

      <div class="flex-1 px-4 pt-4 pb-2 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <section v-for="zone in zoneSections" :key="zone.label" class="rounded-xl border-2 border-dashed p-3 flex flex-col" :class="zone.containerClass">
          <h2 class="text-center font-bold tracking-widest text-sm mb-3" :class="zone.titleClass">{{ zone.label }}</h2>
          <div class="flex-1 grid grid-cols-2 gap-2 content-start">
            <MachineNode
              v-for="machine in zone.items"
              :key="machine.id"
              :name="machine.name"
              :status="machine.status"
            />
            <div v-if="zone.items.length === 0" class="col-span-2 rounded-lg border border-slate-700 bg-[#0d1526] px-3 py-6 text-center text-xs text-slate-500">
              No machines in this zone
            </div>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 gap-3 px-4 pb-4 xl:grid-cols-3">
        <div class="rounded-xl bg-[#111827] border border-slate-700/50 p-3">
          <p class="text-slate-300 text-xs font-semibold mb-2">ALARM TREND <span class="text-slate-500 font-normal">(Last 24 hrs)</span></p>
          <Line v-if="alarmTrendData" :data="alarmTrendData" :options="chartOptions" class="max-h-28" />
          <div v-else class="h-28 flex items-center justify-center text-xs text-slate-500">No alarm trend data</div>
        </div>

        <div class="rounded-xl bg-[#111827] border border-slate-700/50 p-3">
          <p class="text-slate-300 text-xs font-semibold mb-2">ALARM BY ZONE</p>
          <Bar v-if="alarmByZoneData" :data="alarmByZoneData" :options="chartOptions" class="max-h-28" />
          <div v-else class="h-28 flex items-center justify-center text-xs text-slate-500">No alarm zone data</div>
        </div>

        <div class="rounded-xl bg-[#111827] border border-slate-700/50 p-3">
          <p class="text-slate-300 text-xs font-semibold mb-2">LATEST ALARM EVENTS</p>
          <table class="w-full text-xs">
            <thead>
              <tr class="text-slate-500 border-b border-slate-700">
                <th class="text-left py-1 font-medium">Time</th>
                <th class="text-left py-1 font-medium">Machine</th>
                <th class="text-left py-1 font-medium">Alarm</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="alarm in latestAlarms" :key="alarm.id" class="border-b border-slate-800">
                <td class="text-slate-400 py-1.5">{{ alarm.time }}</td>
                <td class="text-slate-300 py-1.5">{{ alarm.machine }}</td>
                <td class="py-1.5">
                  <span class="bg-red-600 text-white rounded px-1.5 py-0.5 font-bold text-xs">{{ alarm.code }}</span>
                  <span class="text-red-400 ml-1 font-semibold">{{ alarm.name }}</span>
                </td>
              </tr>
              <tr v-if="latestAlarms.length === 0">
                <td colspan="3" class="py-6 text-center text-slate-500">No active alarms</td>
              </tr>
            </tbody>
          </table>
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
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "vue-chartjs";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

definePageMeta({ layout: false });
useHead({ title: "Machines | Tire Production" });

const { load } = useProductionDashboard();

const dashboardData = ref<any>(null);

onMounted(async () => {
  dashboardData.value = await load();
});

const statusColor = (status: string) =>
  ({
    RUNNING: "#22c55e",
    WARNING: "#facc15",
    ALARM: "#ef4444",
    STOP: "#64748b",
  }[status] ?? "#64748b");

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "-";

const machines = computed(() => dashboardData.value?.machineCards ?? []);
const activeAlarms = computed(() => dashboardData.value?.activeAlarms ?? []);

const topStats = computed(() => [
  { label: "Total", value: machines.value.length, unit: "machines" },
  { label: "Running", value: machines.value.filter((m: any) => m.status === "RUNNING").length, unit: "active" },
  { label: "Critical", value: machines.value.filter((m: any) => m.status === "ALARM").length, unit: "alarms" },
  { label: "Alarm 24h", value: dashboardData.value?.alarmTrend?.reduce((sum: number, item: any) => sum + item.count, 0) ?? 0, unit: "events" },
]);

const legendItems = [
  { label: "RUNNING", color: "#22c55e" },
  { label: "WARNING", color: "#facc15" },
  { label: "ALARM", color: "#ef4444" },
  { label: "STOP", color: "#64748b" },
];

const zoneSections = computed(() => {
  const grouped = {
    "1ST": machines.value.filter((m: any) => m.zone === "1ST"),
    BAND: machines.value.filter((m: any) => m.zone === "BAND"),
    "2ND": machines.value.filter((m: any) => m.zone === "2ND"),
  };

  return [
    {
      label: "1ST",
      items: grouped["1ST"],
      containerClass: "border-blue-400 bg-blue-900/10",
      titleClass: "text-blue-300",
    },
    {
      label: "BAND",
      items: grouped.BAND,
      containerClass: "border-red-400 bg-red-900/10",
      titleClass: "text-red-300",
    },
    {
      label: "2ND",
      items: grouped["2ND"],
      containerClass: "border-green-400 bg-green-900/10",
      titleClass: "text-green-300",
    },
  ];
});

const alarmTrendData = computed(() => {
  const trend = dashboardData.value?.alarmTrend ?? [];
  if (!trend.length) return null;
  return {
    labels: trend.map((item: any) => item.hour),
    datasets: [
      {
        label: "Alarms",
        data: trend.map((item: any) => item.count),
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96,165,250,0.15)",
        pointBackgroundColor: "#60a5fa",
        pointRadius: 3,
        tension: 0.4,
        fill: true,
      },
    ],
  };
});

const alarmByZoneData = computed(() => {
  const rows = dashboardData.value?.alarmByZone ?? [];
  if (!rows.length) return null;
  return {
    labels: rows.map((item: any) => item.zone),
    datasets: [
      {
        label: "Alarms",
        data: rows.map((item: any) => item.count),
        backgroundColor: rows.map((item: any) => {
          if (item.zone === "1ST") return "#3b82f6";
          if (item.zone === "BAND") return "#ef4444";
          if (item.zone === "2ND") return "#22c55e";
          return "#94a3b8";
        }),
        borderRadius: 3,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: "#64748b", font: { size: 9 } }, grid: { color: "#1e2d45" } },
    y: { ticks: { color: "#64748b", font: { size: 9 } }, grid: { color: "#1e2d45" }, min: 0 },
  },
};

const latestAlarms = computed(() =>
  activeAlarms.value.slice(0, 6).map((alarm: any) => {
    const machine = machines.value.find((item: any) => item.id === alarm.machine_id);
    return {
      id: alarm.id,
      time: formatDateTime(alarm.start_time),
      machine: machine?.name ?? alarm.machine_id ?? "-",
      code: alarm.alarm_code ?? alarm.code ?? "-",
      name: alarm.alarm_name ?? alarm.name ?? "Alarm",
      color: statusColor("ALARM"),
    };
  })
);

const errorMessages = computed(() =>
  Object.entries(dashboardData.value?.errors ?? {})
    .filter(([, error]) => !!error)
    .map(([key, error]: any) => `${key}: ${error.message ?? error}`)
);

const hasAnyData = computed(() => !!dashboardData.value?.hasAnyData);

</script>
