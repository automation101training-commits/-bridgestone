<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Air Compressor</h1>

    <!-- Stat cards -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div class="bg-white rounded-xl p-5 border-2 border-blue-400 flex items-start justify-between w-64 shadow-sm">
        <div>
          <p class="text-sm text-slate-500 mb-1">Pressure</p>
          <p class="text-3xl font-bold text-slate-900">{{ latest?.pressure ?? '—' }} <span class="text-base font-medium text-slate-400">bar</span></p>
        </div>
        <div class="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Icon icon="mdi:gauge" class="h-6 w-6 text-blue-500" />
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 flex items-start justify-between w-64 shadow-sm">
        <div>
          <p class="text-sm text-slate-500 mb-1">Temperature</p>
          <p class="text-3xl font-bold text-slate-900">{{ latest?.temperature ?? '—' }} <span class="text-base font-medium text-slate-400">°C</span></p>
        </div>
        <div class="h-11 w-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <Icon icon="mdi:thermometer" class="h-6 w-6 text-orange-400" />
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 flex items-start justify-between w-64 shadow-sm">
        <div>
          <p class="text-sm text-slate-500 mb-1">Status</p>
          <p class="text-3xl font-bold" :class="statusColor">{{ statusLabel }}</p>
        </div>
        <div class="h-11 w-11 rounded-full flex items-center justify-center shrink-0" :class="statusBg">
          <Icon icon="mdi:air-filter" class="h-6 w-6" :class="statusIconColor" />
        </div>
      </div>
    </div>

    <!-- Pressure history chart -->
    <div class="bg-white rounded-xl p-6 shadow-sm mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-slate-900">Pressure History</h2>
        <span class="text-xs text-slate-400">Last 24 records</span>
      </div>
      <div class="h-64">
        <Line v-if="lineChartData" :data="lineChartData" :options="lineChartOptions" />
        <div v-else class="h-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
      </div>
    </div>

    <!-- Recent records table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100">
        <h2 class="text-base font-semibold text-slate-900">Recent Records</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th class="px-6 py-3 text-left">Time</th>
              <th class="px-6 py-3 text-left">Pressure (bar)</th>
              <th class="px-6 py-3 text-left">Temperature (°C)</th>
              <th class="px-6 py-3 text-left">Status</th>
              <th class="px-6 py-3 text-left">Note</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-10 text-center">
                <span class="inline-block h-5 w-5 rounded-full border-2 border-slate-300 border-t-red-500 animate-spin" />
              </td>
            </tr>
            <tr v-else-if="records.length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-slate-400 text-xs">ไม่มีข้อมูล</td>
            </tr>
            <tr v-for="row in records" :key="row.id" class="hover:bg-slate-50">
              <td class="px-6 py-3 text-slate-400 text-xs">{{ formatTime(row.created_at) }}</td>
              <td class="px-6 py-3 font-medium text-slate-800">{{ row.pressure }}</td>
              <td class="px-6 py-3 text-slate-700">{{ row.temperature }}</td>
              <td class="px-6 py-3">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  :class="badgeClass(row.status)">
                  <span class="h-1.5 w-1.5 rounded-full" :class="dotClass(row.status)" />
                  {{ row.status || '—' }}
                </span>
              </td>
              <td class="px-6 py-3 text-slate-500">{{ row.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { Icon } from "@iconify/vue"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js"
import { Line } from "vue-chartjs"

definePageMeta({ layout: "dashboard", middleware: ["auth"] })
useHead({ title: "Air Compressor | NIC" })

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const { $supabase } = useNuxtApp() as any

const records = ref<any[]>([])
const loading = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const fetchData = async () => {
  loading.value = true
  try {
    const { data, error } = await $supabase
      .from("air_compressor")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(24)
    if (!error) records.value = data ?? []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
  timer = setInterval(fetchData, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const latest = computed(() => records.value[0] ?? null)

const statusLabel = computed(() => {
  const s = latest.value?.status
  return s === "run" ? "Running" : s === "stop" ? "Stop" : s || "—"
})
const statusColor   = computed(() => latest.value?.status === "run" ? "text-green-600" : latest.value?.status === "stop" ? "text-red-600" : "text-slate-600")
const statusBg      = computed(() => latest.value?.status === "run" ? "bg-green-100" : latest.value?.status === "stop" ? "bg-red-100" : "bg-slate-100")
const statusIconColor = computed(() => latest.value?.status === "run" ? "text-green-500" : latest.value?.status === "stop" ? "text-red-500" : "text-slate-400")

const lineChartData = computed(() => {
  const rows = [...records.value].reverse()
  if (!rows.length) return null
  return {
    labels: rows.map(r => formatTime(r.created_at)),
    datasets: [{
      data: rows.map(r => r.pressure),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.08)",
      pointBackgroundColor: "#3b82f6",
      pointRadius: 3,
      tension: 0.3,
      fill: true,
    }],
  }
})

const lineChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      ticks: { color: "#94a3b8", font: { size: 11 } },
      grid: { color: "#f1f5f9" },
      border: { display: false },
    },
    x: {
      ticks: { color: "#94a3b8", font: { size: 10 }, maxRotation: 45 },
      grid: { display: false },
      border: { display: false },
    },
  },
}))

const badgeClass = (s: string) =>
  ({ run: "bg-green-100 text-green-700", stop: "bg-red-100 text-red-700" }[s] ?? "bg-slate-100 text-slate-600")

const dotClass = (s: string) =>
  ({ run: "bg-green-500", stop: "bg-red-500" }[s] ?? "bg-slate-400")

const formatTime = (ts: string) =>
  ts ? new Date(ts).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "—"
</script>
