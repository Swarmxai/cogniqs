import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (api.token) {
      api.me().then(setUser).catch(() => api.setToken('')).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password, mfaCode) => {
    if (mfaCode) {
      const data = await api.loginMfa(email, password, mfaCode)
      api.setToken(data.access_token)
      setUser(data.user)
      return data
    }
    const data = await api.login(email, password)
    if (data.mfa_required) {
      return { mfaRequired: true, email: data.email }
    }
    api.setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const register = async (email, password, name) => {
    const data = await api.register(email, password, name)
    api.setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    api.setToken('')
    setUser(null)
  }

  const refreshUser = async () => {
    if (api.token) {
      const u = await api.me()
      setUser(u)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
