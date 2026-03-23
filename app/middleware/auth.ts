export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const { getSession } = useAuth()

  // normalize path กันเคส /login/ หรือ /my-courses/
  const path = (to.path || "/").replace(/\/+$/, "") || "/"

  // ✅ หน้าที่ “ต้องล็อกอิน” (เพิ่มได้ตามต้องการ)
  const protectedPrefixes = ["/my-courses", "/invoice", "/dashboard"]
  const isProtectedRoute = protectedPrefixes.some(
    (p) => path === p || path.startsWith(p + "/")
  )

  // ✅ หน้าสาธารณะ (เข้าดูได้)
  const authPages = ["/login", "/signup"]
  const isAuthPage = authPages.includes(path)

  const { session } = await getSession()

  // ถ้าไม่ล็อกอิน แล้วเข้าหน้า protected → ไป login
  if (!session && isProtectedRoute) {
    return navigateTo("/login")
  }

  // ถ้าล็อกอินแล้ว แต่จะไป login/signup → เด้งไปหน้าคอร์สของฉัน (หรือจะเป็น "/" ก็ได้)
  if (session && isAuthPage) {
    return navigateTo("/dashboard")
  }
})
