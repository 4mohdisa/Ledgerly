import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  // Sign out the user
  await supabase.auth.signOut()
  
  return NextResponse.json({
    success: true,
    message: 'Signed out successfully'
  })
}