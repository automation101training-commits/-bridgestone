<template>
  <div class="min-h-screen flex items-center justify-center bg-[#5f9bb1] text-slate-900">
    Redirecting...
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });
useHead({ title: "Home | Tire Production" });

await navigateTo("/home");
</script>
