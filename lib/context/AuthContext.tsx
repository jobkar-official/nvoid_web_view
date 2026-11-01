'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { JOBKAR_AUTH_EXPIRED_EVENT } from '@/lib/context/client'
import type { User, UserRole } from '@/lib/context/types'

const TOKEN_KEY = 'JOBKAR_WEB_ACCESS_TOKEN'
const REFRESH_TOKEN_KEY = 'JOBKAR_WEB_REFRESH_TOKEN'
const USER_KEY = 'JOBKAR_WEB_USER'
const OAUTH_ROLE_KEY = 'JOBKAR_WEB_OAUTH_STATE'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  oauthError: string
  authError: string | null
  login: (email: string, password: string, role: UserRole) => Promise<void>
  loginWithGoogle: (role?: UserRole | null) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => void
  clearErrors: () => void
  refreshAuthToken: (email: string, refreshToken: string) => Promise<{ accessToken: string, roleId: number } | null>
}

interface BackendAuthResponse {
  id: number
  roleId: number
  companyId: number | null
  name: string
  email: string
  phone: string
  slug: string
  imageUrl?: string | null
  coverImage?: string | null
  accessToken: string
  refreshToken: string
}

const AuthContext = createContext<AuthContextType | null>(null)

const PROTECTED_ROUTES = [

  '/messages',
  '/notifications',

  '/profile',
  '/profile/edit',

  '/profile/education',
  '/profile/experience',
  '/profile/languages',
  '/profile/skills',
  '/profile/resume',

  '/highlights',
  '/applications',
  '/saved',
  '/support',
]
const AUTH_ROUTES = ['/auth/login', '/auth/register']

const isProtectedRoute = (pathname: string) => PROTECTED_ROUTES.some(p =>
  p === '/profile'
    ? pathname === '/profile' || pathname.startsWith('/profile/')
    : pathname === p || pathname.startsWith(p + '/')
)

const mapRoleId = (roleId: number | string | null | undefined): UserRole => [2, 3, 5].includes(Number(roleId)) ? 'recruiter' : 'seeker'
const roleIdForUserRole = (role: UserRole): number => role === 'recruiter' ? 3 : 4

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function AuthProviderContent({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [oauthError, setOauthError] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setToken(null)
      setUser(null)
      setAuthError('Your session expired. Please sign in again.')
      void signOut({ redirect: false })
      if (isProtectedRoute(pathname)) {
        router.replace('/auth/login')
      }
    }

    window.addEventListener(JOBKAR_AUTH_EXPIRED_EVENT, handleAuthExpired)
    return () => window.removeEventListener(JOBKAR_AUTH_EXPIRED_EVENT, handleAuthExpired)
  }, [pathname, router])

  const logout = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setToken(null)
    await signOut({ redirect: false })
    router.replace('/')
  }, [router])

  const refreshAuthToken = useCallback(async (email: string, refreshToken: string) => {
    try {
      const res = await fetch('/backend/auth/refreshToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, refreshToken })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData?.message || errorData?.error || `Refresh failed with status: ${res.status}`)
      }
      const data: BackendAuthResponse = await res.json()
      const mappedUser: User = {
        id: String(data.id), name: data.name, email: data.email, role: mapRoleId(data.roleId), slug: data.slug,
        phone: data.phone, companyId: data.companyId ? String(data.companyId) : undefined, imageUrl: data.imageUrl || null,
        coverImage: data.coverImage || null, profileStrength: 20, skills: [], education: [], experience: [], languages: []
      }
      localStorage.setItem(TOKEN_KEY, data.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))
      setToken(data.accessToken); setUser(mappedUser)
      return { accessToken: data.accessToken, roleId: data.roleId }
    } catch (err: any) {
      setAuthError(err?.message || 'Session expired')
      logout()
      return null
    }
  }, [logout])

  const generateStrongPassword = (length = 24) => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower = 'abcdefghijklmnopqrstuvwxyz', numbers = '0123456789', special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const all = upper + lower + numbers + special
    const password = [upper[Math.floor(Math.random() * upper.length)], lower[Math.floor(Math.random() * lower.length)], numbers[Math.floor(Math.random() * numbers.length)], special[Math.floor(Math.random() * special.length)]]
    const random = new Uint32Array(length - 4)
    crypto.getRandomValues(random)
    password.push(...Array.from(random, x => all[x % all.length]))
    for (let i = password.length - 1; i > 0; i -= 1) {
      const randomIndex = new Uint32Array(1); crypto.getRandomValues(randomIndex)
      const j = randomIndex[0] % (i + 1);[password[i], password[j]] = [password[j], password[i]]
    }
    return password.join('')
  }

  const handleAuthSuccess = useCallback((response: BackendAuthResponse | { data?: BackendAuthResponse; result?: BackendAuthResponse }) => {
    const data = (response as any)?.data?.accessToken
      ? (response as any).data
      : (response as any)?.result?.accessToken
        ? (response as any).result
        : response as BackendAuthResponse

    if (!data?.accessToken || !data?.refreshToken || !data?.id || !data?.email) {
      throw new Error('Authentication response was incomplete. Please try again.')
    }

    const mappedUser: User = {
      id: String(data.id), name: data.name, email: data.email, role: mapRoleId(data.roleId), slug: data.slug,
      phone: data.phone, companyId: data.companyId ? String(data.companyId) : undefined, imageUrl: data.imageUrl || null,
      coverImage: data.coverImage || null, profileStrength: 20, skills: [], education: [], experience: [], languages: []
    }
    localStorage.setItem(TOKEN_KEY, data.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))
    setUser(mappedUser); setToken(data.accessToken)
    router.push('/')
  }, [router])

  useEffect(() => {
    const syncGoogleWithBackend = async () => {
      if (status === 'authenticated' && session?.user && !token) {
        setIsLoading(true); setOauthError('')
        try {
          const storedRoleId = Number(localStorage.getItem(OAUTH_ROLE_KEY))
          const roleId = [3, 4].includes(storedRoleId) ? storedRoleId : 4
          const payload = {
            platform: 'WEB',
            name: session.user.name,
            password: 'ask password',
            email: session.user.email,
            phone: '',
            imageUrl: session.user.image,
            gender: '',
            country: 'India',
            state: '',
            city: '',
            dob: '',
            cloudToken: (session as any)?.idToken,
            roleId
          }
          const res = await fetch('/backend/auth/OAuth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          const responseData = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(responseData?.error || responseData?.message || `OAuth sync failed with status: ${res.status}`)
          localStorage.removeItem(OAUTH_ROLE_KEY)
          handleAuthSuccess(responseData)
        } catch (err: any) {
          setOauthError(err?.message || 'Google synchronization failed')
          localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_TOKEN_KEY); localStorage.removeItem(USER_KEY)
          setUser(null); setToken(null)
          await signOut({ redirect: false })
        } finally {
          setIsLoading(false)
        }
      }
    }
    syncGoogleWithBackend()
  }, [session, status, token, handleAuthSuccess])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY)
        const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY)
        const storedUser = localStorage.getItem(USER_KEY)
        if (storedToken && storedRefresh && storedUser) {
          const parsedToken = parseJwt(storedToken)
          const parsedUser = JSON.parse(storedUser)
          if (parsedToken && parsedToken.exp * 1000 > Date.now()) {
            setToken(storedToken); setUser({ ...parsedUser, role: mapRoleId(parsedToken.roleId) })
          } else {
            await refreshAuthToken(parsedUser.email, storedRefresh)
          }
        }
      } catch (err: any) {
        setAuthError(err?.message || 'Failed to re-initialize session')
      }
      setIsLoading(false)
    }
    initializeAuth()
  }, [refreshAuthToken])

  useEffect(() => {
    if (isLoading || status === 'loading') return
    const isProtected = isProtectedRoute(pathname)
    const isAuthPage = AUTH_ROUTES.some(p => pathname.startsWith(p))
    if (status === 'authenticated' && !token) return
    if (!user || !token) {
      if (isProtected) router.replace('/auth/login')
      return
    }
    if (isAuthPage) router.replace('/')
  }, [user, token, isLoading, status, pathname, router])

  const login = useCallback(async (email: string, password: string, _role: UserRole) => {
    setIsLoading(true); setAuthError(null)
    try {
      const res = await fetch('/backend/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'WEB', email, password, roleId: roleIdForUserRole(_role) })
      })
      const responseData = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(responseData?.error || responseData?.message || `Login failed with status: ${res.status}`)
      handleAuthSuccess(responseData)
    } catch (err: any) {
      setAuthError(err?.message || 'An unexpected error occurred during login')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [handleAuthSuccess])

  const loginWithGoogle = useCallback(async (role?: UserRole | null) => {
    setIsLoading(true); setOauthError('')
    try {
      const roleId = role === 'recruiter' ? 3 : 4
      localStorage.setItem(OAUTH_ROLE_KEY, String(roleId))
      await signIn('google')
    } catch (err: any) {
      localStorage.removeItem(OAUTH_ROLE_KEY)
      setOauthError(err?.message || 'Unable to start Google login')
      setIsLoading(false)
    }
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true); setAuthError(null)
    try {
      const res = await fetch(`/backend/auth/OAuthGenPassword?email=${encodeURIComponent(email)}`, { method: 'POST' })
      const responseData = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(responseData?.error || responseData?.message || `Request failed with status: ${res.status}`)
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send verification email'); throw err
    } finally { setIsLoading(false) }
  }, [])

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...data }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearErrors = useCallback(() => { setAuthError(null); setOauthError('') }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!user && !!token, oauthError, authError, login, loginWithGoogle, forgotPassword, logout, updateUser, clearErrors, refreshAuthToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) { return <AuthProviderContent>{children}</AuthProviderContent> }

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}