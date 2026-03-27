export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { getSession } = useAuth()

  const path = (to.path || "/").replace(/\/+$/, "") || "/"

  // หน้าที่เข้าได้โดยไม่ต้อง login
  const publicPages = ["/login"]
  const isPublicPage = publicPages.includes(path)

  const { session } = await getSession()

  // ยังไม่ login → ไปหน้าอื่นนอกจาก /login → บังคับไป /login
  if (!session && !isPublicPage) {
    return navigateTo("/login")
  }

  // login แล้ว แต่พยายามเข้า /login → เด้งไป /home
  if (session && path === "/login") {
    return navigateTo("/home")
  }
})
