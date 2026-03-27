<template>
  <div class="rounded-lg border p-2 flex flex-col items-center gap-1 bg-[#0d1526]"
    :class="{
      'border-green-500/50': status === 'RUNNING',
      'border-yellow-400/50': status === 'WARNING',
      'border-red-500/50':   status === 'ALARM',
      'border-slate-600/50': status === 'STOP',
    }">
    <!-- Icon -->
    <div class="w-10 h-10 rounded bg-[#1a2740] flex items-center justify-center text-xl">
      <svg v-if="status === 'RUNNING'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <svg v-else-if="status === 'ALARM'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <svg v-else-if="status === 'WARNING'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    </div>

    <!-- Name -->
    <p class="text-white text-xs font-semibold text-center leading-tight">{{ name }}</p>

    <!-- Status Badge -->
    <span class="text-xs font-bold px-2 py-0.5 rounded"
      :class="{
        'bg-green-600 text-white':  status === 'RUNNING',
        'bg-yellow-500 text-black': status === 'WARNING',
        'bg-red-600 text-white':    status === 'ALARM',
        'bg-slate-600 text-white':  status === 'STOP',
      }">
      {{ status }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  status: "RUNNING" | "WARNING" | "ALARM" | "STOP"
  icon?: string
}>()
</script>
