'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to sign-in page with return URL
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname || '/')}`)
    }
  }, [user, isLoading, router, pathname])

  return { user, isLoading }
}
