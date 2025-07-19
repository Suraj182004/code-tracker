import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  username?: string
  displayName?: string
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  session: any | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setSession: (session: any | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, username: string, displayName?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            set({ isLoading: false })
            return { success: false, error: error.message }
          }

          if (data.user) {
            const { user, session } = data
            set({
              user: {
                id: user.id,
                email: user.email || '',
                username: user.user_metadata?.username,
                displayName: user.user_metadata?.display_name,
                avatarUrl: user.user_metadata?.avatar_url,
              },
              session,
              isAuthenticated: true,
              isLoading: false,
            })
          }

          return { success: true }
        } catch (error: any) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      register: async (email: string, password: string, username: string, displayName?: string) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username,
                display_name: displayName || username,
              },
            },
          })

          if (error) {
            set({ isLoading: false })
            return { success: false, error: error.message }
          }

          set({ isLoading: false })
          return { success: true }
        } catch (error: any) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await supabase.auth.signOut()
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          })
        } catch (error) {
          console.error('Logout error:', error)
          set({ isLoading: false })
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        set({ isLoading: true })
        try {
          const { user } = get()
          if (!user) return { success: false, error: 'Not authenticated' }

          // Update auth metadata
          const { error: authError } = await supabase.auth.updateUser({
            data: {
              display_name: updates.displayName,
              avatar_url: updates.avatarUrl,
            },
          })

          if (authError) {
            set({ isLoading: false })
            return { success: false, error: authError.message }
          }

          // Update local state
          set({
            user: { ...user, ...updates },
            isLoading: false,
          })

          return { success: true }
        } catch (error: any) {
          set({ isLoading: false })
          return { success: false, error: error.message }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
) 