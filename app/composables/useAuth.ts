import type { Session } from "@supabase/supabase-js"

export const useAuth = () => {
  const { $supabase } = useNuxtApp() as any

  const user = useState<any | null>("auth_user", () => null)
  const session = useState<Session | null>("auth_session", () => null)
  const initialized = useState<boolean>("auth_initialized", () => false)

  const applySession = (nextSession: Session | null) => {
    session.value = nextSession
    user.value = nextSession?.user ?? null
  }

  const getSession = async () => {
    const { data, error } = await $supabase.auth.getSession()
    if (!error) applySession(data?.session ?? null)
    return { session: data?.session ?? null, error }
  }

  const init = async () => {
    if (initialized.value) return

    await getSession()

    $supabase.auth.onAuthStateChange((_event: string, nextSession: Session | null) => {
      applySession(nextSession)
    })

    initialized.value = true
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await $supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: (fullName || "").trim(),
        },
      },
    })

    if (!error) applySession(data?.session ?? null)
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await $supabase.auth.signInWithPassword({ email, password })
    if (!error) applySession(data?.session ?? null)
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await $supabase.auth.signOut()
    if (!error) applySession(null)
    return { error }
  }

  return {
    user,
    session,
    init,
    getSession,
    signUp,
    signIn,
    signOut,
  }
}
