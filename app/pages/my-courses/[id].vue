<template>
  <div class="space-y-5">
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <NuxtLink to="/my-courses" class="text-sm text-slate-500 hover:text-red-700">
          ← กลับไปคอร์สของฉัน
        </NuxtLink>
        <h1 class="text-2xl sm:text-3xl font-bold mt-1">{{ course?.title || "คอร์สเรียน" }}</h1>
        <p class="text-sm text-slate-500">{{ course?.description || "" }}</p>
      </div>
    </div>

    <div v-if="loading" class="text-slate-500 flex items-center gap-2">
      <span class="inline-block h-5 w-5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin"></span>
      กำลังโหลด...
    </div>

    <div v-else-if="pageErrorMsg" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      {{ pageErrorMsg }}
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div class="lg:col-span-8">
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div
            ref="playerContainer"
            class="aspect-video bg-black"
            @contextmenu.capture.prevent.stop
          >
            <iframe
              v-if="playerType === 'drive' && videoUrl"
              :key="videoUrl"
              :src="videoUrl"
              class="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allowfullscreen
            />
            <video
              v-else-if="videoUrl"
              :key="videoUrl"
              :src="videoUrl"
              controls
              controlslist="nodownload noremoteplayback"
              disablepictureinpicture
              playsinline
              @contextmenu.prevent
              class="w-full h-full"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-white/70">
              เลือกบทเรียนเพื่อเริ่มเล่นวิดีโอ
            </div>
          </div>

          <div class="p-4 border-t border-slate-100">
            <div class="font-semibold">{{ currentLesson?.title || "-" }}</div>
            <div v-if="videoErrorMsg" class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {{ videoErrorMsg }}
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-4">
        <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <div class="font-bold">บทเรียน</div>
            <button class="text-sm text-slate-600 hover:text-red-700" type="button" @click="reloadSignedUrl">
              รีเฟรชลิงก์
            </button>
          </div>

          <div class="max-h-[520px] overflow-auto">
            <div v-if="lessons.length === 0" class="px-4 py-6 text-sm text-slate-500">
              ยังไม่มีบทเรียนในคอร์สนี้
            </div>

            <button
              v-for="lesson in lessons"
              :key="lesson.id"
              type="button"
              class="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50"
              :class="currentLesson?.id === lesson.id ? 'bg-red-50' : ''"
              @click="selectLesson(lesson)"
            >
              <div class="font-semibold text-slate-900 line-clamp-2">{{ lesson.title }}</div>
              <div class="text-xs text-slate-500 mt-1">Lesson {{ lesson.sort_order }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] })

type Course = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
}

type Lesson = {
  id: string
  course_id: string
  title: string
  video_path: string
  sort_order: number
}

const { $supabase } = useNuxtApp() as any
const route = useRoute()
const { getSession } = useAuth()

const courseId = computed(() => String(route.params.id || ""))

const loading = ref(true)
const pageErrorMsg = ref("")
const videoErrorMsg = ref("")

const course = ref<Course | null>(null)
const lessons = ref<Lesson[]>([])
const currentLesson = ref<Lesson | null>(null)
const videoUrl = ref("")
const playerType = ref<"video" | "drive">("video")
const playerContainer = ref<HTMLElement | null>(null)

const blockPlayerContextMenu = (event: MouseEvent) => {
  const container = playerContainer.value
  const target = event.target as Node | null
  if (!container || !target) return
  if (!container.contains(target)) return
  event.preventDefault()
  event.stopPropagation()
}

function getGoogleDriveEmbedUrl(rawPath: string) {
  const value = String(rawPath || "").trim()
  if (!/^https?:\/\//i.test(value)) return ""

  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (!host.includes("drive.google.com")) return ""

    let fileId = ""

    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/i)
    if (pathMatch?.[1]) {
      fileId = pathMatch[1]
    } else if (url.searchParams.get("id")) {
      fileId = String(url.searchParams.get("id") || "")
    }

    if (!fileId) return ""
    return `https://drive.google.com/file/d/${fileId}/preview?rm=minimal`
  } catch {
    return ""
  }
}

function normalizeVideoPath(rawPath: string) {
  let value = String(rawPath || "").trim()
  if (!value) return ""

  try {
    value = decodeURIComponent(value)
  } catch {
    // Keep the original value if it is not URI-encoded.
  }

  const withoutQuery = value.split("?")[0]?.split("#")[0] || value

  if (/^https?:\/\//i.test(withoutQuery)) {
    try {
      const url = new URL(withoutQuery)
      const markers = [
        "/storage/v1/object/sign/course-videos/",
        "/storage/v1/object/public/course-videos/",
        "/storage/v1/object/authenticated/course-videos/",
        "/storage/v1/object/course-videos/",
      ]

      for (const marker of markers) {
        const index = url.pathname.indexOf(marker)
        if (index >= 0) {
          return url.pathname.slice(index + marker.length).replace(/^\/+/, "")
        }
      }
    } catch {
      return withoutQuery
    }

    return withoutQuery
  }

  return withoutQuery.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^course-videos\/+/i, "")
}

function uniqueNonEmpty(values: string[]) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
}

async function buildSignedUrl(lesson = currentLesson.value) {
  videoUrl.value = ""
  videoErrorMsg.value = ""
  playerType.value = "video"

  const rawPath = String(lesson?.video_path || "").trim()
  if (!rawPath) {
    videoErrorMsg.value = "บทเรียนนี้ยังไม่มีไฟล์วิดีโอ"
    return false
  }

  const googleDriveEmbedUrl = getGoogleDriveEmbedUrl(rawPath)
  if (googleDriveEmbedUrl) {
    videoUrl.value = googleDriveEmbedUrl
    playerType.value = "drive"
    return true
  }

  const normalizedPath = normalizeVideoPath(rawPath)
  const candidates = uniqueNonEmpty([
    normalizedPath,
    normalizedPath.replace(/^course-videos\/+/i, ""),
    rawPath.replace(/^\/+/, "").replace(/^course-videos\/+/i, ""),
  ])

  let lastError = ""

  for (const candidate of candidates) {
    if (/^https?:\/\//i.test(candidate)) continue

    const { data, error } = await $supabase.storage
      .from("course-videos")
      .createSignedUrl(candidate, 60 * 60)

    if (!error && data?.signedUrl) {
      videoUrl.value = data.signedUrl
      return true
    }

    lastError = error?.message || lastError
  }

  if (/^https?:\/\//i.test(rawPath)) {
    videoUrl.value = rawPath
    playerType.value = "video"
    return true
  }

  videoErrorMsg.value = lastError || "ไม่สามารถโหลดวิดีโอของบทเรียนนี้ได้"
  return false
}

async function selectLesson(lesson: Lesson) {
  currentLesson.value = lesson
  await buildSignedUrl(lesson)
}

async function reloadSignedUrl() {
  if (!currentLesson.value) return
  await buildSignedUrl(currentLesson.value)
}

async function selectFirstPlayableLesson() {
  for (const lesson of lessons.value) {
    currentLesson.value = lesson

    if (await buildSignedUrl(lesson)) {
      return
    }
  }

  if (lessons.value.length > 0) {
    currentLesson.value = lessons.value[0]
    videoUrl.value = ""
    playerType.value = "video"
    videoErrorMsg.value =
      videoErrorMsg.value ||
      "คอร์สนี้มีบทเรียน แต่ยังเปิดวิดีโอไม่ได้ กรุณาตรวจสอบ video_path และไฟล์ใน bucket course-videos"
  }
}

const load = async () => {
  loading.value = true
  pageErrorMsg.value = ""
  videoErrorMsg.value = ""
  videoUrl.value = ""
  playerType.value = "video"
  course.value = null
  lessons.value = []
  currentLesson.value = null

  try {
    const { session } = await getSession()
    const uid = session?.user?.id
    if (!uid) {
      pageErrorMsg.value = "กรุณาเข้าสู่ระบบก่อน"
      return
    }

    const { data: enrollment, error: enrollmentError } = await $supabase
      .from("course_enrollments")
      .select("id")
      .eq("user_id", uid)
      .eq("course_id", courseId.value)
      .maybeSingle()

    if (enrollmentError) throw enrollmentError
    if (!enrollment) {
      pageErrorMsg.value = "คุณไม่มีสิทธิ์เข้าถึงคอร์สนี้"
      return
    }

    const { data: courseData, error: courseError } = await $supabase
      .from("courses")
      .select("id,title,description,thumbnail_url")
      .eq("id", courseId.value)
      .single()

    if (courseError) throw courseError
    course.value = courseData as Course

    const { data: lessonRows, error: lessonError } = await $supabase
      .from("course_lessons")
      .select("id,course_id,title,video_path,sort_order")
      .eq("course_id", courseId.value)
      .order("sort_order", { ascending: true })

    if (lessonError) throw lessonError
    lessons.value = (lessonRows || []) as Lesson[]

    await selectFirstPlayableLesson()
  } catch (error: any) {
    pageErrorMsg.value = error?.message || "โหลดข้อมูลไม่สำเร็จ"
  } finally {
    loading.value = false
  }
}

watch(courseId, () => load(), { immediate: true })

onMounted(() => {
  window.addEventListener("contextmenu", blockPlayerContextMenu, true)
})

onBeforeUnmount(() => {
  window.removeEventListener("contextmenu", blockPlayerContextMenu, true)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
