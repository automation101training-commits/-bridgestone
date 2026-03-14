export default defineNuxtRouteMiddleware(async () => {
  if (process.server) return

  const admin = useAdmin()
  const allowed = await admin.refreshAdminState()

  if (!allowed) {
    return navigateTo("/my-courses")
  }
})
