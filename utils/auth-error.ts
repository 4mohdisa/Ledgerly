export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred'

  // Handle Supabase auth errors
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password'
    case 'Email not confirmed':
      return 'Please verify your email address'
    case 'User already registered':
      return 'An account with this email already exists'
    case 'Password should be at least 8 characters':
      return 'Password must be at least 8 characters'
    case 'Email rate limit exceeded':
      return 'Too many attempts. Please try again later'
    default:
      return error.message || 'An unexpected error occurred'
  }
}

export function isAuthError(error: any): boolean {
  return (
    error?.status === 400 ||
    error?.status === 401 ||
    error?.status === 403 ||
    error?.message?.toLowerCase().includes('auth') ||
    error?.message?.toLowerCase().includes('password') ||
    error?.message?.toLowerCase().includes('email')
  )
}
