import { createClient } from "@supabase/supabase-js"

type AuthUserRecord = {
  userId: string
  email: string
  displayName: string
  createdAt: string | null
  lastSignInAt: string | null
}

const ADMIN_ROLE_VALUES = new Set(["admin", "superadmin", "owner"])

function hasAdminRole(input: unknown): boolean {
  if (Array.isArray(input)) return input.some(hasAdminRole)
  if (typeof input !== "string") return false

  return input
    .split(/[,\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .some((value) => ADMIN_ROLE_VALUES.has(value))
}

function hasAdminFlag(input: unknown): boolean {
  if (typeof input === "boolean") return input
  if (typeof input === "number") return input === 1
  if (typeof input !== "string") return false
  return ["1", "true", "yes"].includes(input.trim().toLowerCase())
}

function getEmailName(email: string) {
  const normalized = String(email || "").trim()
  if (!normalized.includes("@")) return normalized
  return normalized.split("@")[0].trim()
}

function getDisplayName(user: any) {
  const meta = user?.user_metadata || user?.raw_user_meta_data || {}
  const email = String(user?.email || "").trim()
  const candidates = [
    meta?.full_name,
    meta?.display_name,
    meta?.displayName,
    meta?.name,
    [meta?.first_name, meta?.last_name].filter(Boolean).join(" "),
    getEmailName(email),
    email,
    user?.id,
  ]

  return String(candidates.find(Boolean) || "ลูกค้า").trim()
}

function parseAdminEmails(input: unknown) {
  return String(input || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl = String(config.public.SUPABASE_URL || "").trim()
  const anonKey = String(config.public.SUPABASE_KEY || "").trim()
  const serviceRoleKey = String(config.SUPABASE_SERVICE_ROLE_KEY || "").trim()

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "Supabase admin user directory is not configured.",
    })
  }

  const authorization = getHeader(event, "authorization") || ""
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : ""
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: "Missing access token." })
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: authUserData, error: authUserError } = await authClient.auth.getUser(accessToken)
  if (authUserError || !authUserData?.user) {
    throw createError({ statusCode: 401, statusMessage: "Invalid session." })
  }

  const currentUser = authUserData.user
  const email = String(currentUser.email || "").trim().toLowerCase()
  const adminEmails = parseAdminEmails(config.ADMIN_EMAILS || config.public.ADMIN_EMAILS)
  const isAdmin =
    hasAdminRole(currentUser.app_metadata?.role) ||
    hasAdminRole(currentUser.app_metadata?.roles) ||
    hasAdminRole(currentUser.user_metadata?.role) ||
    hasAdminRole(currentUser.user_metadata?.roles) ||
    hasAdminFlag(currentUser.app_metadata?.is_admin) ||
    hasAdminFlag(currentUser.user_metadata?.is_admin) ||
    adminEmails.includes(email)

  if (!isAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Admin access required." })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const users: AuthUserRecord[] = []
  const perPage = 200
  let page = 1

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    const rows = Array.isArray(data?.users) ? data.users : []
    for (const user of rows) {
      users.push({
        userId: String(user?.id || "").trim(),
        email: String(user?.email || "").trim(),
        displayName: getDisplayName(user),
        createdAt: user?.created_at || null,
        lastSignInAt: user?.last_sign_in_at || null,
      })
    }

    if (rows.length < perPage) break
    page += 1
  }

  return { users }
})
