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
          class="w-full py-2.5 rounded-full text-center text-white text-sm font-bold tracking-wide shadow bg-red-600">
          Home
        </NuxtLink>
        <NuxtLink to="/machines"
          class="w-full py-2.5 rounded-full text-center text-white text-sm font-semibold tracking-wide shadow transition-colors bg-[#7a1a1a] hover:bg-red-600">
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
    <div class="flex-1 ml-40 min-h-screen bg-[#4e9fac]" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: "Home | Tire Production" })

const auth = useAuth?.() as any
const onLogout = async () => {
  try {
    if (auth?.signOut) await auth.signOut()
  } finally {
    await navigateTo("/login")
  }
}
</script>
