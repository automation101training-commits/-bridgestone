<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-40 min-h-screen bg-[#0e0e0e] flex flex-col items-center py-4 shrink-0 fixed top-0 left-0 bottom-0 z-40">
      <div class="flex flex-col items-center mb-6 px-2 text-center">
        <img src="/img_Head.png" alt="Tire Production" class="w-24 h-16 object-cover rounded-md mb-2" />
        <span class="text-white text-xs font-bold tracking-widest leading-tight">TIRE PRODUCTION</span>
      </div>

      <nav class="flex flex-col gap-3 w-full px-3">
        <NuxtLink to="/home"
          class="w-full py-2.5 rounded-full text-center text-white text-sm font-bold tracking-wide shadow transition-colors bg-[#7a1a1a] hover:bg-red-600">
          Home
        </NuxtLink>
        <NuxtLink to="/machines"
          class="w-full py-2.5 rounded-full text-center text-white text-sm font-semibold tracking-wide shadow transition-colors bg-[#7a1a1a] hover:bg-red-600">
          Machines
        </NuxtLink>
        <NuxtLink to="/oee"
          class="w-full py-2.5 rounded-full text-center text-white text-sm font-bold tracking-wide shadow bg-red-600">
          OEE
        </NuxtLink>
      </nav>

      <div class="flex-1" />

      <div class="mb-4 flex flex-col items-center gap-1">
        <button type="button"
          class="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          @click="onLogout">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24">
            <polygon points="12,4 20,19 4,19" fill="#ef4444" />
          </svg>
        </button>
        <span class="text-white text-xs font-bold tracking-widest">LOGOUT</span>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 ml-40 min-h-screen bg-[#4e9fac] p-5 overflow-auto">

      <!-- KPI Cards -->
      <div class="grid grid-cols-4 gap-4 mb-5">
        <div v-for="kpi in kpis" :key="kpi.label"
          class="rounded-xl bg-[#90ee90] shadow px-5 py-4 flex flex-col items-start">
          <p class="text-slate-700 text-sm font-semibold mb-1">{{ kpi.label }}</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-black text-slate-900">{{ kpi.value }}</span>
            <span class="text-slate-600 text-sm font-medium mb-1">{{ kpi.unit }}</span>
          </div>
        </div>
      </div>

      <!-- Line Chart: Production Output Over Time -->
      <div class="rounded-xl bg-[#1a2340] shadow p-4 mb-5">
        <p class="text-white text-sm font-semibold mb-3">Production Output Over Time</p>
        <Line :data="lineData" :options="lineOptions" class="max-h-44" />
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-cols-2 gap-4">

        <!-- Left column -->
        <div class="flex flex-col gap-4">
          <!-- Machine Performance Bar -->
          <div class="rounded-xl bg-[#1a2340] shadow p-4">
            <p class="text-white text-sm font-semibold mb-3">Machine Performance</p>
            <Bar :data="machineBarData" :options="barOptions" class="max-h-40" />
          </div>

          <!-- Cycle Time Distribution Bar -->
          <div class="rounded-xl bg-[#1a2340] shadow p-4">
            <p class="text-white text-sm font-semibold mb-3">Cycle Time Distribution</p>
            <Bar :data="cycleBarData" :options="barOptions" class="max-h-40" />
          </div>

          <!-- Machine Timeline -->
          <div class="rounded-xl bg-[#1a2340] shadow p-4">
            <p class="text-white text-sm font-semibold mb-3">Machine Timeline</p>
            <div class="space-y-2">
              <div v-for="row in timeline" :key="row.machine" class="flex items-center gap-2">
                <span class="text-white text-xs w-8 shrink-0">{{ row.machine }}</span>
                <div class="flex-1 h-5 bg-[#0d1526] rounded overflow-hidden flex">
                  <div v-for="seg in row.segments" :key="seg.color + seg.width"
                    :style="{ width: seg.width + '%', backgroundColor: seg.color }"
                    class="h-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right column -->
        <div class="flex flex-col gap-4">
          <!-- Production by Product Pie -->
          <div class="rounded-xl bg-[#1a2340] shadow p-4">
            <p class="text-white text-sm font-semibold mb-3">Production by Product</p>
            <div class="flex items-center gap-4">
              <Pie :data="pieData" :options="pieOptions" class="max-h-44" />
              <div class="flex flex-col gap-2">
                <div v-for="item in pieLabels" :key="item.label" class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-sm inline-block" :style="{ backgroundColor: item.color }" />
                  <span class="text-white text-xs">{{ item.label }} {{ item.pct }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Operator Performance -->
          <div class="rounded-xl bg-[#1a2340] shadow p-4">
            <p class="text-white text-sm font-semibold mb-3">Operator Performance</p>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-600">
                  <th class="text-left text-slate-400 font-medium py-1 pb-2">Operator</th>
                  <th class="text-left text-slate-400 font-medium py-1 pb-2">Output</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="op in operators" :key="op.name" class="border-b border-slate-700/50">
                  <td class="text-white py-2">{{ op.name }}</td>
                  <td class="text-white py-2">{{ op.output }}</td>
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
} from "chart.js"
import { Line, Bar, Pie } from "vue-chartjs"

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
)

definePageMeta({ layout: false })
useHead({ title: "OEE | Tire Production" })

// KPI
const kpis = [
  { label: "Total Output",      value: "222", unit: "pcs"    },
  { label: "Running Machines",  value: "5",   unit: "Machines" },
  { label: "Avg Cycle Time",    value: "42",  unit: "sec"    },
  { label: "Production Rate",   value: "315", unit: "pcs/hr" },
]

// Line chart
const lineLabels = ["10:00","10:15","10:20","10:30","10:35","10:45","10:50","11:00","11:05","11:10"]
const lineData = {
  labels: lineLabels,
  datasets: [{
    label: "Output",
    data: [18, 30, 25, 40, 35, 45, 38, 42, 28, 36],
    borderColor: "#60d0e4",
    backgroundColor: "rgba(96,208,228,0.15)",
    pointBackgroundColor: "#60d0e4",
    pointRadius: 4,
    tension: 0.3,
    fill: true,
  }],
}
const lineOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { color: "#1e3050" } },
    y: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { color: "#1e3050" }, min: 0, max: 50 },
  },
}

// Machine Performance Bar
const machineBarData = {
  labels: ["M01","M02","M03","M04"],
  datasets: [{
    label: "Output",
    data: [45, 38, 52, 29],
    backgroundColor: ["#4a90d9","#4a90d9","#4a90d9","#4a90d9"],
    borderRadius: 3,
  }],
}

// Cycle Time Distribution Bar
const cycleBarData = {
  labels: ["0-20s","20-30s","30-40s","40s+"],
  datasets: [{
    label: "Count",
    data: [12, 28, 45, 18],
    backgroundColor: ["#4a90d9","#4a90d9","#7ecc5a","#e8a838"],
    borderRadius: 3,
  }],
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { display: false } },
    y: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { color: "#1e3050" } },
  },
}

// Pie chart
const pieLabels = [
  { label: "Product A", pct: 40, color: "#7ecc5a" },
  { label: "Product B", pct: 35, color: "#4a90d9" },
  { label: "Product C", pct: 25, color: "#e8a838" },
]
const pieData = {
  labels: pieLabels.map(p => p.label),
  datasets: [{
    data: pieLabels.map(p => p.pct),
    backgroundColor: pieLabels.map(p => p.color),
    borderWidth: 0,
  }],
}
const pieOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
}

// Machine Timeline
const timeline = [
  { machine: "M01", segments: [{ color: "#4a90d9", width: 35 },{ color: "#e8a838", width: 10 },{ color: "#4a90d9", width: 30 },{ color: "#94a3b8", width: 25 }] },
  { machine: "M02", segments: [{ color: "#4a90d9", width: 50 },{ color: "#ef4444", width: 8  },{ color: "#4a90d9", width: 22 },{ color: "#94a3b8", width: 20 }] },
  { machine: "M03", segments: [{ color: "#7ecc5a", width: 60 },{ color: "#94a3b8", width: 40 }] },
  { machine: "M04", segments: [{ color: "#4a90d9", width: 20 },{ color: "#94a3b8", width: 80 }] },
]

// Operator Performance
const operators = [
  { name: "OP01", output: 52 },
  { name: "OP02", output: 44 },
  { name: "OP03", output: 39 },
]

// Logout
const auth = useAuth?.() as any
const onLogout = async () => {
  try {
    if (auth?.signOut) await auth.signOut()
  } finally {
    await navigateTo("/login")
  }
}
</script>
