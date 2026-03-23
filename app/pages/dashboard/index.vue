<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

    <!-- Stat cards -->
    <div class="flex gap-4 mb-6">
      <!-- Total Production -->
      <div class="bg-white rounded-xl p-5 border-2 border-blue-400 flex items-start justify-between w-64 shadow-sm">
        <div>
          <p class="text-sm text-slate-500 mb-1">Total Production</p>
          <p class="text-3xl font-bold text-slate-900">{{ summary?.total_production?.toLocaleString() ?? '—' }}</p>
          <p class="text-xs text-green-500 mt-2 flex items-center gap-1">
            <Icon icon="mdi:trending-up" class="h-3.5 w-3.5" />
            1.3% Up from yesterday
          </p>
        </div>
        <div class="h-11 w-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <Icon icon="mdi:package-variant-closed" class="h-6 w-6 text-orange-400" />
        </div>
      </div>

      <!-- Efficiency -->
      <div class="bg-white rounded-xl p-5 flex items-start justify-between w-64 shadow-sm">
        <div>
          <p class="text-sm text-slate-500 mb-1">Efficiency</p>
          <p class="text-3xl font-bold text-slate-900">{{ summary ? summary.efficiency + '%' : '—' }}</p>
          <p class="text-xs text-green-500 mt-2 flex items-center gap-1">
            <Icon icon="mdi:trending-up" class="h-3.5 w-3.5" />
            1.8% Up from yesterday
          </p>
        </div>
        <div class="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <Icon icon="mdi:timer-outline" class="h-6 w-6 text-red-400" />
        </div>
      </div>
    </div>

    <!-- Movement Efficiency chart -->
    <div class="bg-white rounded-xl p-6 shadow-sm mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-slate-900">Movement Efficiency</h2>
        <select class="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
          <option>October</option>
          <option>November</option>
          <option>December</option>
        </select>
      </div>
      <div class="h-64">
        <Line v-if="lineChartData" :data="lineChartData" :options="lineChartOptions" />
        <div v-else class="h-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
      </div>
    </div>

    <!-- Bottom row -->
    <div class="flex gap-6">
      <!-- Loss Time donut -->
      <div class="bg-white rounded-xl p-6 shadow-sm flex-1">
        <h2 class="text-base font-semibold text-slate-900 mb-4">Loss Time</h2>
        <div class="flex items-center gap-6">
          <div class="w-40 h-40 shrink-0">
            <Doughnut v-if="donutChartData" :data="donutChartData" :options="donutChartOptions" />
          </div>
          <div class="space-y-2 text-sm">
            <div v-for="item in lossItems" :key="item.label" class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full shrink-0" :style="{ background: item.color }" />
              <span class="text-slate-600">{{ item.label }}</span>
              <span class="ml-auto font-medium text-slate-800">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- %EFF By Line bar chart -->
      <div class="bg-white rounded-xl p-6 shadow-sm flex-1">
        <h2 class="text-base font-semibold text-slate-900 mb-4">%EFF By Line</h2>
        <div class="h-40">
          <Bar v-if="barChartData" :data="barChartData" :options="barChartOptions" />
          <div v-else class="h-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { Icon } from "@iconify/vue"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line, Doughnut, Bar } from "vue-chartjs"

definePageMeta({ layout: "dashboard", middleware: ["auth"] })
useHead({ title: "Dashboard | NIC" })

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

const { $supabase } = useNuxtApp() as any

const summary    = ref<any>(null)
const movementEff = ref<any[]>([])
const lossData   = ref<any>(null)
const lineEffData = ref<any[]>([])

// ── Fetch all data ────────────────────────────────────────────────────────────
const fetchAll = async () => {
  const [s, m, l, e] = await Promise.all([
    $supabase.from("production_daily")   .select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    $supabase.from("movement_efficiency").select("hour,value").order("created_at", { ascending: false }).order("hour").limit(24),
    $supabase.from("loss_time")          .select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    $supabase.from("line_efficiency")    .select("line_name,efficiency").order("created_at", { ascending: false }).limit(20),
  ])

  summary.value     = s.data
  movementEff.value = m.data ?? []
  lossData.value    = l.data
  lineEffData.value = e.data ?? []
}

onMounted(fetchAll)

// ── Movement Efficiency line chart ───────────────────────────────────────────
const lineChartData = computed(() => {
  if (!movementEff.value.length) return null
  return {
    labels: movementEff.value.map(d => String(d.hour)),
    datasets: [{
      data: movementEff.value.map(d => d.value),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.08)",
      pointBackgroundColor: "#3b82f6",
      pointRadius: 4,
      pointHoverRadius: 6,
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
      min: 0, max: 100,
      ticks: { callback: (v: any) => v + "%", color: "#94a3b8", font: { size: 11 } },
      grid: { color: "#f1f5f9" },
      border: { display: false },
    },
    x: {
      ticks: { color: "#94a3b8", font: { size: 11 } },
      grid: { display: false },
      border: { display: false },
    },
  },
}))

// ── Loss Time donut ───────────────────────────────────────────────────────────
const lossColors = ["#1e293b", "#93c5fd", "#94a3b8", "#4ade80"]
const lossItems = computed(() => {
  const d = lossData.value
  if (!d) return []
  return [
    { label: "Breakdown",    value: d.breakdown    + "%", color: lossColors[0] },
    { label: "Tool Change",  value: d.tool_change  + "%", color: lossColors[1] },
    { label: "Model Change", value: d.model_change + "%", color: lossColors[2] },
    { label: "Q Adjust",     value: d.q_adjust     + "%", color: lossColors[3] },
  ]
})

const donutChartData = computed(() => {
  const d = lossData.value
  if (!d) return null
  return {
    labels: ["Breakdown", "Tool Change", "Model Change", "Q Adjust"],
    datasets: [{
      data: [d.breakdown, d.tool_change, d.model_change, d.q_adjust],
      backgroundColor: lossColors,
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }
})

const donutChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: { legend: { display: false } },
}))

// ── %EFF By Line bar chart ────────────────────────────────────────────────────
const barColors = ["#93c5fd", "#6ee7b7", "#1e293b", "#93c5fd", "#c4b5fd", "#6ee7b7"]

const barChartData = computed(() => {
  if (!lineEffData.value.length) return null
  return {
    labels: lineEffData.value.map(d => d.line_name),
    datasets: [{
      data: lineEffData.value.map(d => d.efficiency),
      backgroundColor: barColors,
      borderRadius: 4,
      barThickness: 28,
    }],
  }
})

const barChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      min: 70, max: 100,
      ticks: { color: "#94a3b8", font: { size: 11 } },
      grid: { color: "#f1f5f9" },
      border: { display: false },
    },
    x: {
      ticks: { color: "#94a3b8", font: { size: 11 } },
      grid: { display: false },
      border: { display: false },
    },
  },
}))
</script>
