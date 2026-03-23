<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <aside class="w-48 min-h-screen bg-white flex flex-col shadow-sm fixed top-0 left-0 bottom-0 z-40">
      <!-- Logo -->
      <div class="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
        <img src="/Logo1.jpg" alt="NIC" class="h-10 w-10 rounded-full object-cover shrink-0" />
        <div class="leading-tight">
          <div class="text-xs font-bold text-slate-900">Nawaloha Industry</div>
          <div class="text-xs text-slate-500">Company</div>
        </div>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 py-4 px-3 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === item.to
            ? 'bg-red-600 text-white'
            : 'text-slate-600 hover:bg-gray-100'"
        >
          <Icon :icon="item.icon" class="h-4 w-4 shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Bottom actions -->
      <div class="px-3 pb-5 pt-3 border-t border-gray-100 space-y-1">
        <NuxtLink
          to="/dashboard/settings"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-100"
        >
          <Icon icon="mdi:cog-outline" class="h-4 w-4 shrink-0" />
          Settings
        </NuxtLink>
        <button
          type="button"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-100 w-full text-left"
          @click="onLogout"
        >
          <Icon icon="mdi:logout" class="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>

    <!-- Content area -->
    <div class="flex-1 ml-48 flex flex-col min-h-screen">
      <!-- Top bar -->
      <header class="bg-gray-100 px-6 py-3 flex items-center gap-4">
        <div class="flex-1">
          <div class="relative max-w-sm">
            <Icon
              icon="mdi:magnify"
              class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search"
              class="w-full h-9 rounded-full bg-white border border-gray-200 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <img
            :src="userAvatarUrl"
            alt="avatar"
            class="h-9 w-9 rounded-full object-cover"
          />
          <div class="leading-tight text-right">
            <div class="text-sm font-semibold text-slate-900">{{ displayName }}</div>
            <div class="text-xs text-slate-500">{{ userRole }}</div>
          </div>
          <Icon icon="mdi:chevron-down" class="h-4 w-4 text-slate-400" />
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 px-6 py-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import { Icon } from "@iconify/vue"

const route = useRoute()

const navItems = [
  { label: "Dashboard",       to: "/dashboard",                icon: "mdi:view-dashboard-outline" },
  { label: "Layout Line",     to: "/dashboard/layout-line",   icon: "mdi:floor-plan"              },
  { label: "Overview Status", to: "/dashboard/overview",      icon: "mdi:chart-line"              },
  { label: "Air Compressor",  to: "/dashboard/air-compressor",icon: "mdi:air-filter"              },
]

const auth  = useAuth?.()  as any
const admin = useAdmin?.() as any

onMounted(async () => {
  try {
    if (auth?.init) await auth.init()
    if (admin?.refreshAdminState) await admin.refreshAdminState()
  } catch (e) {
    console.error("dashboard layout init error:", e)
  }
})

const user        = computed(() => auth?.user?.value)
const displayName = computed(() => user.value?.user_metadata?.full_name || user.value?.email?.split("@")[0] || "Username")
const userRole    = computed(() => admin?.isAdmin?.value ? "Admin" : "User")
const userAvatarUrl = computed(() => user.value?.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName.value) + "&background=e0e7ff&color=4f46e5")

const onLogout = async () => {
  try {
    if (auth?.signOut) await auth.signOut()
  } finally {
    await navigateTo("/login")
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap");
* { font-family: "Kanit", system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
</style>
