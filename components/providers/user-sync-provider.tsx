"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Database } from '@/database.types'

function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error fetching user:', error)
        return
      }
      setUser(session?.user ?? null)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return { user }
}

export function UserSyncProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser()
  const supabase = createClient()

  useEffect(() => {
    if (!user?.id || !user?.email) return

    const profile: Database['public']['Tables']['profiles']['Insert'] = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || 'Anonymous',
      updated_at: new Date().toISOString(),
    }

    const timeout = setTimeout(async () => {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' })

      if (upsertError) {
        console.error('Error upserting profile:', upsertError)
      }
    }, 0)

    return () => clearTimeout(timeout)
  }, [user?.id, user?.email, supabase])

  return children
}
