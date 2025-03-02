import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectUrl = requestUrl.searchParams.get('redirectUrl') || '/'
  
  console.log('Auth callback received:', {
    code: code ? 'exists' : 'missing',
    redirectUrl
  })
  
  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      console.log('Exchanging code for session...')
      
      // Exchange the code for a session
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code:', exchangeError)
        throw exchangeError
      }
      
      console.log('Session established:', {
        user: session?.user?.id,
        expiresAt: session?.expires_at
      })
      
      // Get the user from the newly created session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        throw userError
      }
    
      // If we have a user, ensure their profile exists
      if (user) {
        // Get user metadata for name
        const { data: userData } = await supabase.auth.getUser()
        const fullName = userData.user?.user_metadata?.full_name || 
                        `${userData.user?.user_metadata?.name || ''} ${userData.user?.user_metadata?.family_name || ''}`.trim() ||
                        'Anonymous'
        
        // Upsert to profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email || '',
            name: fullName,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // Continue with the flow even if profile creation fails
        }
      }
    } catch (error: any) {
      console.error('Auth callback error:', error)
      // Redirect to sign-in page with error
      return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url))
    }
  }
  
  // Redirect to the specified URL or homepage
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}