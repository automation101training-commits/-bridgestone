<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

    <!-- User Management -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">

      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-slate-900">ผู้ใช้ทั้งหมด</h2>
          <p class="text-xs text-slate-400 mt-0.5">จัดการสิทธิ์และสถานะผู้ใช้</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Search -->
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="search"
              type="text"
              placeholder="ค้นหาชื่อหรืออีเมล..."
              class="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 w-56"
            />
          </div>
          <!-- Refresh -->
          <button
            class="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            :class="loading ? 'opacity-50 pointer-events-none' : ''"
            @click="fetchUsers"
          >
            <svg class="h-4 w-4" :class="loading ? 'animate-spin' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th class="px-6 py-3 text-left">ชื่อ</th>
              <th class="px-6 py-3 text-left">Email</th>
              <th class="px-6 py-3 text-left">Role</th>
              <th class="px-6 py-3 text-left">สถานะ</th>
              <th class="px-6 py-3 text-left">สมัครเมื่อ</th>
              <th class="px-6 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-10 text-center">
                <span class="inline-block h-5 w-5 rounded-full border-2 border-slate-300 border-t-red-500 animate-spin" />
              </td>
            </tr>
            <tr v-else-if="filteredUsers.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-slate-400 text-xs">ไม่พบผู้ใช้</td>
            </tr>
            <tr v-for="u in filteredUsers" :key="u.id" class="hover:bg-slate-50 transition-colors">
              <!-- Name + avatar -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    :style="{ background: avatarColor(u.email) }">
                    {{ initials(u.full_name) }}
                  </div>
                  <span class="font-medium text-slate-900">{{ u.full_name }}</span>
                </div>
              </td>
              <!-- Email -->
              <td class="px-6 py-4 text-slate-500">{{ u.email }}</td>
              <!-- Role -->
              <td class="px-6 py-4">
                <select
                  :value="u.role"
                  class="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
                  @change="updateRole(u.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <!-- Status -->
              <td class="px-6 py-4">
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                  :class="u.active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'"
                  @click="toggleActive(u)"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="u.active ? 'bg-green-500' : 'bg-red-400'" />
                  {{ u.active ? 'Active' : 'Pending' }}
                </button>
              </td>
              <!-- Created At -->
              <td class="px-6 py-4 text-slate-400 text-xs">{{ formatDate(u.created_at) }}</td>
              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <button
                  class="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                  title="ลบผู้ใช้"
                  @click="confirmDelete(u)"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer summary -->
      <div class="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>ทั้งหมด {{ users.length }} คน</span>
        <div class="flex gap-4">
          <span class="text-green-600 font-medium">Active: {{ users.filter(u => u.active).length }}</span>
          <span class="text-red-500 font-medium">Pending: {{ users.filter(u => !u.active).length }}</span>
        </div>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="deleteTarget = null">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-80">
        <h3 class="font-bold text-slate-900 mb-2">ยืนยันการลบ</h3>
        <p class="text-sm text-slate-500 mb-5">
          ต้องการลบผู้ใช้ <span class="font-semibold text-slate-800">{{ deleteTarget.full_name }}</span> ใช่หรือไม่?
        </p>
        <div class="flex gap-3">
          <button class="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            @click="deleteTarget = null">ยกเลิก</button>
          <button class="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
            @click="deleteUser">ลบ</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
      <svg v-if="toast.type === 'success'" class="h-4 w-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <svg v-else class="h-4 w-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      {{ toast.msg }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"

definePageMeta({ layout: "dashboard", middleware: ["auth"] })
useHead({ title: "Settings | NIC" })

const { $supabase } = useNuxtApp() as any

const users       = ref<any[]>([])
const loading     = ref(false)
const search      = ref("")
const deleteTarget = ref<any>(null)
const toast       = ref<{ type: "success" | "error"; msg: string } | null>(null)

const filteredUsers = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  )
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const { data, error } = await $supabase
      .from("users")
      .select("id, full_name, email, role, active, created_at")
      .order("created_at", { ascending: false })
    if (!error) users.value = data ?? []
  } finally {
    loading.value = false
  }
}

const toggleActive = async (u: any) => {
  const { error } = await $supabase
    .from("users")
    .update({ active: !u.active })
    .eq("id", u.id)
  if (!error) {
    u.active = !u.active
    showToast("success", u.active ? `เปิดสิทธิ์ ${u.full_name} แล้ว` : `ปิดสิทธิ์ ${u.full_name} แล้ว`)
  } else {
    showToast("error", "เกิดข้อผิดพลาด")
  }
}

const updateRole = async (id: string, role: string) => {
  const { error } = await $supabase.from("users").update({ role }).eq("id", id)
  if (!error) {
    const u = users.value.find(u => u.id === id)
    if (u) u.role = role
    showToast("success", "อัปเดต Role แล้ว")
  } else {
    showToast("error", "เกิดข้อผิดพลาด")
  }
}

const confirmDelete = (u: any) => { deleteTarget.value = u }

const deleteUser = async () => {
  if (!deleteTarget.value) return
  const { error } = await $supabase.from("users").delete().eq("id", deleteTarget.value.id)
  if (!error) {
    users.value = users.value.filter(u => u.id !== deleteTarget.value.id)
    showToast("success", `ลบ ${deleteTarget.value.full_name} แล้ว`)
    deleteTarget.value = null
  } else {
    showToast("error", "ลบไม่สำเร็จ")
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (ts: string) =>
  ts ? new Date(ts).toLocaleDateString("th-TH", { dateStyle: "medium" }) : "—"

const initials = (name: string) =>
  (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()

const avatarColor = (email: string) => {
  const colors = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899"]
  let hash = 0
  for (const c of email || "") hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

let toastTimer: ReturnType<typeof setTimeout>
const showToast = (type: "success" | "error", msg: string) => {
  toast.value = { type, msg }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 3000)
}

onMounted(fetchUsers)
</script>
