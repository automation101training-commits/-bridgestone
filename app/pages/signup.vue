<template>
  <div
    class="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat"
    style="background-image: url('/89545074311e989885507e250778ac23cc382be0.png')"
  >
    <div class="w-full max-w-sm mx-4">
      <div class="rounded-3xl bg-white/80 backdrop-blur-sm shadow-2xl px-8 py-10">

        <!-- Logo -->
        <div class="flex flex-col items-center mb-6">
          <img src="/Logo1.jpg" alt="NIC" class="h-20 w-20 object-contain mb-4" />
          <h1 class="text-2xl font-black text-slate-900 tracking-widest">REGISTER</h1>
          <p class="text-slate-600 text-sm mt-1">Create your account</p>
        </div>

        <form class="space-y-4" autocomplete="off" @submit.prevent="onSignUp">
          <!-- Full Name -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              v-model.trim="fullName"
              type="text"
              autocomplete="name"
              placeholder="Enter your full name"
              class="w-full h-11 rounded-lg bg-white border border-slate-300 px-4 text-slate-900
                     focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              :disabled="loading"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              v-model.trim="email"
              type="email"
              autocomplete="email"
              placeholder="Enter your email"
              class="w-full h-11 rounded-lg bg-white border border-slate-300 px-4 text-slate-900
                     focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              :disabled="loading"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPw ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Create a password"
                class="w-full h-11 rounded-lg bg-white border border-slate-300 px-4 pr-12 text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                :disabled="loading"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                @click="showPw = !showPw"
              >
                <svg v-if="!showPw" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <div class="relative">
              <input
                v-model="confirmPassword"
                :type="showConfirmPw ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Confirm your password"
                class="w-full h-11 rounded-lg bg-white border border-slate-300 px-4 pr-12 text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                :disabled="loading"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                @click="showConfirmPw = !showConfirmPw"
              >
                <svg v-if="!showConfirmPw" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="errorMsg" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ errorMsg }}
          </div>

          <!-- Success -->
          <div v-if="successMsg" class="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {{ successMsg }}
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="w-full h-12 rounded-full bg-red-600 text-white font-bold text-lg tracking-widest
                   shadow hover:bg-red-700 active:bg-red-800 transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <span v-if="!loading">SIGN UP</span>
            <span v-else class="inline-flex items-center gap-2 justify-center">
              <span class="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin"></span>
              Loading...
            </span>
          </button>

          <!-- Login link -->
          <p class="text-center text-sm text-slate-500 pt-1">
            Already Have An Account?
            <NuxtLink to="/login" class="font-bold text-red-500 hover:text-red-700">Sign in</NuxtLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"

definePageMeta({ layout: false })
useHead({ title: "Sign Up | NIC" })

const fullName        = ref("")
const email           = ref("")
const password        = ref("")
const confirmPassword = ref("")
const showPw          = ref(false)
const showConfirmPw   = ref(false)
const loading         = ref(false)
const errorMsg        = ref("")
const successMsg      = ref("")

const { signUp } = useAuth()

const onSignUp = async () => {
  errorMsg.value  = ""
  successMsg.value = ""

  if (!fullName.value || !email.value || !password.value || !confirmPassword.value) {
    errorMsg.value = "กรุณากรอกข้อมูลให้ครบทุกช่อง"
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = "รหัสผ่านไม่ตรงกัน"
    return
  }
  if (password.value.length < 6) {
    errorMsg.value = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    return
  }

  loading.value = true
  try {
    await signUp(email.value, password.value, fullName.value)
    successMsg.value = "สมัครสมาชิกสำเร็จ! กรุณารอการอนุมัติจากผู้ดูแลระบบ"
  } catch (e: any) {
    errorMsg.value = e?.message || "สมัครสมาชิกไม่สำเร็จ"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Fix browser autofill dark background */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: #0f172a;
  -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
