const STORAGE_KEY = "nic_auth"

async function sha256(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text)
  const buffer  = await crypto.subtle.digest("SHA-256", encoded)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export const useAuth = () => {
  const { $supabase } = useNuxtApp() as any

  const user    = useState<any | null>("auth_user",    () => null)
  const session = useState<any | null>("auth_session", () => null)

  const applySession = (data: any | null) => {
    session.value = data
    user.value    = data
  }

  const init = () => {
    if (!process.client)  return
    if (session.value)    return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      applySession(JSON.parse(raw))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const getSession = async () => {
    init()
    return { session: session.value }
  }

  // ── Sign Up ──────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, fullName: string) => {
    const emailLower    = email.trim().toLowerCase()
    const password_hash = await sha256(password)

    // Check duplicate email
    const { data: existing } = await $supabase
      .from("users")
      .select("id")
      .eq("email", emailLower)
      .maybeSingle()

    if (existing) throw new Error("Email นี้ถูกใช้งานแล้ว")

    const { data, error } = await $supabase
      .from("users")
      .insert({ full_name: fullName, email: emailLower, password_hash, active: false, role: "user" })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  }

  // ── Sign In ──────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    const emailLower    = email.trim().toLowerCase()
    const password_hash = await sha256(password)

    const { data, error } = await $supabase
      .from("users")
      .select("id, full_name, email, active, role")
      .eq("email", emailLower)
      .eq("password_hash", password_hash)
      .maybeSingle()

    if (error) throw error
    if (!data)        throw new Error("Email หรือรหัสผ่านไม่ถูกต้อง")
    if (!data.active) throw new Error("บัญชีของคุณรอการอนุมัติจากผู้ดูแลระบบ")

    const sessionData = {
      id:        data.id,
      email:     data.email,
      full_name: data.full_name,
      role:      data.role,
    }
    applySession(sessionData)

    if (process.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData))
    }

    return { data: sessionData, error: null }
  }

  // ── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = async () => {
    applySession(null)
    if (process.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
    return { error: null }
  }

  return { user, session, init, getSession, signUp, signIn, signOut }
}
