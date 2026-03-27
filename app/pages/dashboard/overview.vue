<template>
  <div>
    <!-- Select Line -->
    <div class="flex items-center gap-3 mb-4">
      <div class="relative">
        <select
          v-model="selectedLine"
          class="appearance-none bg-white border border-slate-300 rounded-lg pl-4 pr-10 py-2 text-sm text-slate-700
                 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer shadow-sm"
          @change="fetchStatus"
        >
          <option value="">-Select Line-</option>
          <option v-for="line in lines" :key="line.value" :value="line.value">{{ line.label }}</option>
        </select>
        <svg class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <!-- Last updated -->
      <span v-if="lastUpdated" class="text-xs text-slate-400">
        อัปเดต: {{ lastUpdated }}
      </span>

      <!-- Loading indicator -->
      <span v-if="loading" class="inline-flex items-center gap-1 text-xs text-slate-400">
        <span class="h-3 w-3 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin" />
        Loading...
      </span>
    </div>

    <!-- Overview panel -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <span class="text-sm font-semibold text-slate-700">Overview</span>
        <!-- Legend -->
        <div class="flex items-center gap-4 text-xs text-slate-500">
          <span class="flex items-center gap-1"><span class="h-3 w-3 rounded-full bg-green-500 inline-block" /> Running</span>
          <span class="flex items-center gap-1"><span class="h-3 w-3 rounded-full bg-yellow-400 inline-block" /> Warning</span>
          <span class="flex items-center gap-1"><span class="h-3 w-3 rounded-full bg-red-500 inline-block"   /> Stop</span>
        </div>
      </div>

      <!-- Machine image + dots -->
      <div class="relative bg-gradient-to-br from-slate-100 to-slate-200" style="min-height: calc(100vh - 220px)">
        <div class="relative w-full h-full" @click="onImageClick">
          <!-- Debug cursor position -->
          <div v-if="debugPos" class="absolute z-50 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none"
            :style="{ left: debugPos.x + '%', top: debugPos.y + '%' }">
            x: {{ debugPos.x }} y: {{ debugPos.y }}
          </div>
          <img
            src="/img_Head.png"
            alt="Machine Overview"
            class="w-full object-contain"
            style="min-height: calc(100vh - 220px)"
          />

          <!-- Status dots -->
          <template v-if="selectedLine">
            <div
              v-for="dot in dotsWithStatus"
              :key="dot.station"
              class="absolute flex flex-col items-center gap-1 cursor-pointer group"
              :style="{ left: dot.x + '%', top: dot.y + '%' }"
              @click="activeDot = dot"
            >
              <!-- Outer ring pulse -->
              <span
                v-if="dot.status === 'run'"
                class="absolute rounded-full opacity-40 animate-ping"
                :class="dotBg(dot.status)"
                style="width:52px;height:52px;top:50%;left:50%;transform:translate(-50%,-50%)"
              />
              <!-- Ball -->
              <span
                class="relative block rounded-full border-4 border-white transition-transform group-hover:scale-110 z-10"
                :class="dotBg(dot.status)"
                :style="dotStyle(dot.status)"
                style="width:44px;height:44px"
              />
              <!-- Tooltip on hover -->
              <div class="hidden group-hover:flex flex-col absolute z-30 whitespace-nowrap bg-white text-slate-900 text-xs rounded-xl px-3 py-2 shadow-2xl gap-0.5 border border-slate-200"
                style="bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%)">
                <span class="font-bold text-slate-900">{{ dot.station }}</span>
                <span class="font-medium" :class="statusText(dot.status)">{{ statusLabel(dot.status) }}</span>
                <span class="text-slate-600">{{ dot.efficiency }}%</span>
              </div>
            </div>
          </template>

          <!-- No line selected overlay -->
          <div v-else class="absolute inset-0 bg-white/60 flex flex-col items-center justify-center gap-2 text-slate-400">
            <svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
            <p class="text-sm">กรุณาเลือก Line</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Status table (แสดงเมื่อเลือก line แล้ว) -->
    <div v-if="selectedLine" class="bg-white rounded-xl shadow-sm mt-4 overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100">
        <span class="text-sm font-semibold text-slate-700">สถานะเครื่องจักร — LINE : {{ selectedLine }}</span>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th class="px-5 py-3 text-left">Station</th>
            <th class="px-5 py-3 text-left">Status</th>
            <th class="px-5 py-3 text-left">Efficiency</th>
            <th class="px-5 py-3 text-left">Note</th>
            <th class="px-5 py-3 text-left">Updated At</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="statusRows.length === 0">
            <td colspan="5" class="px-5 py-6 text-center text-slate-400 text-xs">ไม่มีข้อมูล</td>
          </tr>
          <tr v-for="row in statusRows" :key="row.id" class="hover:bg-slate-50">
            <td class="px-5 py-3 font-medium text-slate-800">{{ row.station }}</td>
            <td class="px-5 py-3">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                :class="statusBadge(row.status)">
                <span class="h-1.5 w-1.5 rounded-full" :class="dotBg(row.status)" />
                {{ statusLabel(row.status) }}
              </span>
            </td>
            <td class="px-5 py-3 text-slate-700">{{ row.efficiency ?? '—' }}%</td>
            <td class="px-5 py-3 text-slate-500">{{ row.note || '—' }}</td>
            <td class="px-5 py-3 text-slate-400 text-xs">{{ formatTime(row.updated_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail modal -->
    <div v-if="activeDot" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="activeDot = null">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-80">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-900">{{ activeDot.station }}</h3>
          <button class="text-slate-400 hover:text-slate-600" @click="activeDot = null">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-2 mb-4">
          <span class="h-4 w-4 rounded-full" :class="dotBg(activeDot.status)" />
          <span class="font-semibold text-sm" :class="statusText(activeDot.status)">{{ statusLabel(activeDot.status) }}</span>
        </div>
        <div class="space-y-2 text-sm text-slate-600">
          <div class="flex justify-between"><span>Line</span><span class="font-medium text-slate-900">{{ selectedLine }}</span></div>
          <div class="flex justify-between"><span>Efficiency</span><span class="font-medium text-green-600">{{ activeDot.efficiency }}%</span></div>
          <div v-if="activeDot.note" class="flex justify-between"><span>Note</span><span class="font-medium text-slate-900">{{ activeDot.note }}</span></div>
          <div class="flex justify-between"><span>Updated</span><span class="text-xs text-slate-400">{{ formatTime(activeDot.updated_at) }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"

definePageMeta({ layout: "dashboard", middleware: ["auth"] })
useHead({ title: "Overview Status | NIC" })

const { $supabase } = useNuxtApp() as any

const selectedLine = ref("")
const statusRows   = ref<any[]>([])
const loading      = ref(false)
const lastUpdated  = ref("")
const activeDot    = ref<any>(null)
let   timer: ReturnType<typeof setInterval> | null = null

const lines = [
  { label: "LINE : HFW1", value: "HFW1" },
  { label: "LINE : HFW2", value: "HFW2" },
  { label: "LINE : CF",   value: "CF"   },
  { label: "LINE : BD5",  value: "BD5"  },
  { label: "LINE : BD3",  value: "BD3"  },
  { label: "LINE : BD2",  value: "BD2"  },
  { label: "LINE : FW4",  value: "FW4"  },
  { label: "LINE : FW7",  value: "FW7"  },
  { label: "LINE : FW8",  value: "FW8"  },
  { label: "LINE : HUB3", value: "HUB3" },
  { label: "LINE : HUB4", value: "HUB4" },
  { label: "LINE : HUB5", value: "HUB5" },
  { label: "LINE : EM2",  value: "EM2"  },
  { label: "LINE : EM9",  value: "EM9"  },
  { label: "LINE : CD",   value: "CD"   },
  { label: "LINE : DB1",  value: "DB1"  },
  { label: "LINE : DB2",  value: "DB2"  },
  { label: "LINE : DB3",  value: "DB3"  },
]

// ตำแหน่ง dot แยกตาม line → station
// key: "LINE/Station"  value: { x, y } เป็น % บนรูป
const dotPositions: Record<string, Record<string, { x: number; y: number }>> = {
  HFW1: {
    "Station 1": { x: 20, y: 40 },
    "Station 2": { x: 55, y: 46 },
    "Station 3": { x: 82, y: 62 },
  },
  HFW2: {
    "Station 1": { x: 25, y: 55 },
    "Station 2": { x: 52, y: 44 },
    "Station 3": { x: 80, y: 60 },
  },
  // เพิ่ม line อื่นๆ ได้เรื่อยๆ
}

const dotsWithStatus = computed(() =>
  statusRows.value.map((row) => ({
    ...row,
    ...(dotPositions[selectedLine.value]?.[row.station] ?? { x: 50, y: 50 }),
  }))
)

const fetchStatus = async () => {
  if (!selectedLine.value) { statusRows.value = []; return }
  loading.value = true
  try {
    const { data, error } = await $supabase
      .from("machine_status")
      .select("*")
      .eq("line", selectedLine.value)
      .order("station")
    if (!error) {
      statusRows.value = data ?? []
      lastUpdated.value = new Date().toLocaleTimeString("th-TH")
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  timer = setInterval(fetchStatus, 5000) // auto-refresh ทุก 5 วิ
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// ── Helpers ──────────────────────────────────────────────────────────────────
const dotBg = (s: string) =>
  ({ run: "bg-green-500", warn: "bg-yellow-400", stop: "bg-red-500" }[s] ?? "bg-slate-400")

const dotStyle = (s: string) => {
  const gradients: Record<string, string> = {
    run:  "radial-gradient(circle at 35% 35%, #86efac, #16a34a)",
    warn: "radial-gradient(circle at 35% 35%, #fde047, #ca8a04)",
    stop: "radial-gradient(circle at 35% 35%, #fca5a5, #dc2626)",
  }
  return {
    background: gradients[s] ?? "radial-gradient(circle at 35% 35%, #cbd5e1, #64748b)",
    boxShadow: s === "run"  ? "0 0 16px 4px rgba(34,197,94,0.6)"  :
               s === "warn" ? "0 0 16px 4px rgba(234,179,8,0.6)"   :
               s === "stop" ? "0 0 16px 4px rgba(239,68,68,0.6)"   : "none",
  }
}

const statusBadge = (s: string) =>
  ({ run: "bg-green-100 text-green-700", warn: "bg-yellow-100 text-yellow-700", stop: "bg-red-100 text-red-700" }[s] ?? "bg-slate-100 text-slate-600")

const statusText = (s: string) =>
  ({ run: "text-green-600", warn: "text-yellow-600", stop: "text-red-600" }[s] ?? "text-slate-600")

const statusLabel = (s: string) =>
  ({ run: "Running", warn: "Warning", stop: "Stop" }[s] ?? s)

// ── Debug click position ─────────────────────────────────────────────────────
const debugPos = ref<{ x: number; y: number } | null>(null)
const onImageClick = (e: MouseEvent) => {
  const el = (e.currentTarget as HTMLElement)
  const rect = el.getBoundingClientRect()
  const x = +((( e.clientX - rect.left) / rect.width)  * 100).toFixed(1)
  const y = +((( e.clientY - rect.top)  / rect.height) * 100).toFixed(1)
  debugPos.value = { x, y }
  console.log(`"Station ?": { x: ${x}, y: ${y} },`)
}

const formatTime = (ts: string) =>
  ts ? new Date(ts).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "—"
</script>
