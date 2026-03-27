<template>
  <div class="min-h-screen w-full bg-[#4e9fac] flex items-center justify-center">
    <div class="w-full max-w-sm mx-4">
      <!-- Card -->
      <div class="rounded-3xl bg-[#2d7abf] shadow-2xl overflow-hidden pb-8 px-6">

        <!-- Banner -->
        <div class="relative mb-6 -mx-6 overflow-hidden">
          <img src="/img_Head.png" alt="Tire Production" class="w-full h-44 object-cover object-center" />
          <!-- Language selector -->
          <div class="absolute top-2 right-3">
            <div class="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 cursor-pointer hover:bg-white/30 transition-colors">
              <span class="text-sm">🇺🇸</span>
              <span class="text-white text-xs font-medium">English</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <form class="space-y-4" autocomplete="off" @submit.prevent="onLogin">
          <input
            v-model.trim="email"
            type="text"
            autocomplete="username"
            placeholder="Username"
            class="w-full h-12 rounded-lg bg-white border-0 px-4 text-slate-800 text-base placeholder:text-slate-400
                   focus:outline-none focus:ring-2 focus:ring-white/60"
            :disabled="loading"
          />
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="Password"
            class="w-full h-12 rounded-lg bg-white border-0 px-4 text-slate-800 text-base placeholder:text-slate-400
                   focus:outline-none focus:ring-2 focus:ring-white/60"
            :disabled="loading"
          />

          <div v-if="errorMsg" class="rounded-lg bg-red-500/80 px-3 py-2 text-sm text-white">
            {{ errorMsg }}
          </div>

          <button
            type="submit"
            class="w-full h-12 rounded-full bg-red-600 text-white font-bold text-lg tracking-widest
                   shadow-lg hover:bg-red-700 active:bg-red-800 transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <span v-if="!loading">Login</span>
            <span v-else class="inline-flex items-center gap-2 justify-center">
              <span class="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
              Loading...
            </span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute } from "vue-router"

definePageMeta({ layout: false })
useHead({ title: "Login | Tire Production" })

const route = useRoute()
const redirectTo = computed(() => {
  const r = route.query.redirect
  return typeof r === "string" && r.startsWith("/") ? r : "/home"
})

const email = ref("")
const password = ref("")
const loading = ref(false)
const errorMsg = ref("")

const { signIn } = useAuth()

const onLogin = async () => {
  errorMsg.value = ""
  if (!email.value || !password.value) {
    errorMsg.value = "กรุณากรอก Username และรหัสผ่าน"
    return
  }
  loading.value = true
  try {
    await signIn(email.value, password.value)
    await navigateTo(redirectTo.value)
  } catch (e: any) {
    errorMsg.value = e?.message || "Login failed"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: #1e293b;
  -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
