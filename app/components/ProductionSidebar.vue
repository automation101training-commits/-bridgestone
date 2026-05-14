<template>
  <aside
    class="fixed top-0 left-0 bottom-0 z-40 flex min-h-screen w-40 shrink-0 flex-col items-center bg-[#0e0e0e] py-4"
  >
    <div class="mb-6 flex flex-col items-center px-2 text-center">
      <img src="/img_Head.png" alt="Tire Production" class="mb-2 h-16 w-24 rounded-md object-cover" />
      <span class="text-xs leading-tight font-bold tracking-widest text-white">TIRE PRODUCTION</span>
    </div>

    <nav class="flex w-full flex-col gap-3 px-3">
      <NuxtLink
        v-for="item in navItems"
        :key="item.key"
        :to="item.to"
        class="w-full rounded-full py-2.5 text-center text-sm tracking-wide text-white shadow transition-colors"
        :class="item.key === active ? 'bg-red-600 font-bold' : 'bg-[#7a1a1a] font-semibold hover:bg-red-600'"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="flex-1" />

    <div class="mb-4 flex flex-col items-center gap-1">
      <button
        type="button"
        class="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg transition-colors hover:bg-blue-700"
        @click="onLogout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24">
          <polygon points="12,4 20,19 4,19" fill="#ef4444" />
        </svg>
      </button>
      <span class="text-xs font-bold tracking-widest text-white">LOGOUT</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
const props = defineProps<{
  active: "home" | "machines" | "oee";
}>();

const auth = useAuth?.() as any;

const navItems = [
  { key: "home", label: "Home", to: "/home" },
  { key: "machines", label: "Machines", to: "/machines" },
  { key: "oee", label: "OEE", to: "/oee" },
] as const;

const active = props.active;

const onLogout = async () => {
  try {
    if (auth?.signOut) await auth.signOut();
  } finally {
    await navigateTo("/login");
  }
};
</script>
