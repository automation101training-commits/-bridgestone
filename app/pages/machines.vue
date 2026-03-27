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
          class="w-full py-2.5 rounded-full text-center text-white text-sm font-bold tracking-wide shadow bg-red-600">
          Machines
        </NuxtLink>
        <NuxtLink to="/oee"
          class="w-full py-2.5 rounded-full text-center text-white text-sm font-semibold tracking-wide shadow transition-colors bg-[#7a1a1a] hover:bg-red-600">
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
    <div class="flex-1 ml-40 min-h-screen bg-[#0a0e1a] flex flex-col">

      <!-- Top Stats Bar -->
      <div class="flex items-center gap-6 px-6 py-3 bg-[#111827] border-b border-slate-700/50">
        <div class="flex items-center gap-2">
          <span class="text-yellow-400 text-lg">🔔</span>
          <div>
            <div class="text-slate-400 text-xs">Total</div>
            <div class="text-white text-xl font-black">152</div>
          </div>
        </div>
        <div class="h-8 w-px bg-slate-700" />
        <div class="flex items-center gap-2">
          <span class="text-red-400 text-lg">🔴</span>
          <div>
            <div class="text-slate-400 text-xs">Active</div>
            <div class="text-white text-xl font-black">4 <span class="text-sm font-normal text-slate-300">Active</span></div>
          </div>
        </div>
        <div class="h-8 w-px bg-slate-700" />
        <div class="flex items-center gap-2">
          <span class="text-orange-400 text-lg">⚠️</span>
          <div>
            <div class="text-slate-400 text-xs">Critical</div>
            <div class="text-white text-xl font-black">2 <span class="text-sm font-normal text-slate-300">Critical</span></div>
          </div>
        </div>
        <div class="h-8 w-px bg-slate-700" />
        <div class="flex items-center gap-2">
          <span class="text-orange-300 text-lg">⚠️</span>
          <div>
            <div class="text-slate-400 text-xs">Alarm</div>
            <div class="text-white text-xl font-black">22 <span class="text-sm font-normal text-slate-300">Alarms/hr</span></div>
          </div>
        </div>

        <div class="flex-1" />

        <!-- Legend -->
        <div class="flex items-center gap-4 text-xs">
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm bg-green-500 inline-block" />
            <span class="text-slate-300">RUNNING</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />
            <span class="text-slate-300">WARNING</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm bg-red-500 inline-block" />
            <span class="text-slate-300">ALARM</span>
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm bg-slate-500 inline-block" />
            <span class="text-slate-300">STOP</span>
          </span>
        </div>
      </div>

      <!-- Machine Layout -->
      <div class="flex-1 px-4 pt-4 pb-2 grid grid-cols-3 gap-3">

        <!-- 1ST Zone -->
        <div class="rounded-xl border-2 border-dashed border-blue-400 p-3 bg-blue-900/10 flex flex-col">
          <h2 class="text-blue-300 text-center font-bold tracking-widest text-sm mb-3">1ST</h2>
          <div class="flex-1 grid grid-cols-2 gap-2 content-start">
            <MachineNode v-for="m in zone1st" :key="m.name" :name="m.name" :status="m.status" :icon="m.icon" />
          </div>
        </div>

        <!-- BAND Zone -->
        <div class="rounded-xl border-2 border-dashed border-red-400 p-3 bg-red-900/10 flex flex-col">
          <h2 class="text-red-300 text-center font-bold tracking-widest text-sm mb-3">BAND</h2>
          <div class="flex-1 grid grid-cols-1 gap-2 content-start">
            <MachineNode v-for="m in zoneBand" :key="m.name" :name="m.name" :status="m.status" :icon="m.icon" />
          </div>
        </div>

        <!-- 2ND Zone -->
        <div class="rounded-xl border-2 border-dashed border-green-400 p-3 bg-green-900/10 flex flex-col">
          <h2 class="text-green-300 text-center font-bold tracking-widest text-sm mb-3">2ND</h2>
          <div class="flex-1 grid grid-cols-2 gap-2 content-start">
            <MachineNode v-for="m in zone2nd" :key="m.name" :name="m.name" :status="m.status" :icon="m.icon" />
          </div>
        </div>
      </div>

      <!-- Bottom Charts -->
      <div class="grid grid-cols-3 gap-3 px-4 pb-4">

        <!-- Alarm Trend -->
        <div class="rounded-xl bg-[#111827] border border-slate-700/50 p-3">
          <p class="text-slate-300 text-xs font-semibold mb-2">ALARM TREND <span class="text-slate-500 font-normal">(Last 24 hrs)</span></p>
          <Line :data="trendData" :options="trendOptions" class="max-h-28" />
        </div>

        <!-- Alarm by Area -->
        <div class="rounded-xl bg-[#111827] border border-slate-700/50 p-3">
          <p class="text-slate-300 text-xs font-semibold mb-2">ALARM BY AREA</p>
          <Bar :data="areaData" :options="areaOptions" class="max-h-28" />
        </div>

        <!-- Top Alarm Code -->
        <div class="rounded-xl bg-[#111827] border border-slate-700/50 p-3">
          <p class="text-slate-300 text-xs font-semibold mb-2">TOP ALARM CODE</p>
          <table class="w-full text-xs">
            <thead>
              <tr class="text-slate-500 border-b border-slate-700">
                <th class="text-left py-1 font-medium">Time</th>
                <th class="text-left py-1 font-medium">Machine</th>
                <th class="text-left py-1 font-medium">Alarm</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in alarms" :key="a.time" class="border-b border-slate-800">
                <td class="text-slate-400 py-1.5">{{ a.time }}</td>
                <td class="text-slate-300 py-1.5">{{ a.machine }}</td>
                <td class="py-1.5">
                  <span class="bg-red-600 text-white rounded px-1.5 py-0.5 font-bold text-xs">{{ a.code }}</span>
                  <span class="text-red-400 ml-1 font-semibold">CRITICAL</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler,
} from "chart.js"
import { Line, Bar } from "vue-chartjs"

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
)

definePageMeta({ layout: false })
useHead({ title: "Machines | Tire Production" })

// Machine zones
const zone1st = [
  { name: "LET OFF",      status: "RUNNING", icon: "⚙️" },
  { name: "FRONT SERVER", status: "RUNNING", icon: "🖥️" },
  { name: "1ST MAIN",     status: "RUNNING", icon: "🏭" },
]
const zoneBand = [
  { name: "PLY",       status: "RUNNING", icon: "🔧" },
  { name: "I/L",       status: "RUNNING", icon: "⚙️" },
  { name: "BAND MAIN", status: "RUNNING", icon: "🏭" },
]
const zone2nd = [
  { name: "BT REAR SERVER",  status: "RUNNING", icon: "🖥️" },
  { name: "BT MAIN",         status: "RUNNING", icon: "🏭" },
  { name: "BT FRONT SERVER", status: "RUNNING", icon: "🖥️" },
  { name: "BT MAIN",         status: "RUNNING", icon: "🏭" },
  { name: "GT UNLOADER",     status: "ALARM",   icon: "⚠️" },
  { name: "FR MAIN",         status: "RUNNING", icon: "🏭" },
]

// Alarm Trend chart
const trendData = {
  labels: ["06:00","06:00","12:30","18:00","24:00"],
  datasets: [{
    label: "Alarms",
    data: [5, 18, 30, 12, 25],
    borderColor: "#60a5fa",
    backgroundColor: "rgba(96,165,250,0.15)",
    pointBackgroundColor: "#60a5fa",
    pointRadius: 3,
    tension: 0.4,
    fill: true,
  }],
}
const trendOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: "#64748b", font: { size: 9 } }, grid: { color: "#1e2d45" } },
    y: { ticks: { color: "#64748b", font: { size: 9 } }, grid: { color: "#1e2d45" }, min: 0 },
  },
}

// Alarm by Area chart
const areaData = {
  labels: ["1ST","BAND","2ND"],
  datasets: [{
    label: "Alarms",
    data: [45, 72, 30],
    backgroundColor: ["#3b82f6","#ef4444","#22c55e"],
    borderRadius: 3,
  }],
}
const areaOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: "#64748b", font: { size: 10 } }, grid: { display: false } },
    y: { ticks: { color: "#64748b", font: { size: 9 } }, grid: { color: "#1e2d45" }, min: 0, max: 80 },
  },
}

// Top Alarm Codes
const alarms = [
  { time: "10:23:52", machine: "M03 MOLDING",   code: "E221" },
  { time: "10:22:47", machine: "M01 1ST MAIN",  code: "E101" },
  { time: "10:21:05", machine: "M04 BAND MAIN", code: "E450" },
  { time: "10:19:38", machine: "GT UNLOADER",   code: "E133" },
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
