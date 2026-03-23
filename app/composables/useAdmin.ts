export const useAdmin = () => {
  const auth = useAuth()

  const isAdmin = computed(() => {
    const role = auth.session.value?.role
    return role === "admin" || role === "superadmin" || role === "owner"
  })

  const refreshAdminState = async () => {
    if (auth.init) auth.init()
    return isAdmin.value
  }

  // keep for API compatibility with layouts
  const adminProfile    = useState("admin_profile",    () => null)
  const adminMembership = useState("admin_membership", () => null)

  return { adminProfile, adminMembership, isAdmin, refreshAdminState }
}
