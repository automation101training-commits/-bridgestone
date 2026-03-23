<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900 mb-6">Layout Line</h1>

    <!-- Zone M/C1 — รูปจริง -->
    <section class="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 class="text-base font-semibold text-slate-700 mb-3">Layout Zone M/C1</h2>
      <img src="/Zone1.png" alt="Layout Zone M/C1" class="w-full max-h-[calc(100vh-220px)] object-contain rounded border border-slate-200" />
    </section>

    <!-- Floor Plan -->
    <section class="bg-white rounded-xl shadow-sm p-4">
      <h2 class="text-base font-semibold text-slate-700 mb-3">Layout Zone M/C1</h2>
      <img src="/Layout Machine 2 For Grafana Smart Andon 1.png" alt="Layout Zone M/C1 Floor Plan" class="w-full max-h-[calc(100vh-220px)] object-contain rounded border border-slate-200" />
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: ["auth"] })
useHead({ title: "Layout Line | NIC" })

</script>
