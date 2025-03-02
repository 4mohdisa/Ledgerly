"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Sign-up error:', error);
        toast.error('Sign up failed', {
          description: error.message
        })
        return
      }

      if (!data.user) {
        console.error('No user data returned from sign-up');
        toast.error('Failed to create account', {
          description: 'Please try again'
        })
        return
      }

      console.log('Sign-up response:', {
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          createdAt: data.user.created_at
        },
        session: data.session ? 'exists' : 'none'
      });
      
      // Log the user data for debugging
      console.log('User created:', {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at,
        createdAt: data.user.created_at
      });

      // Create profile in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: values.email,
          name: values.fullName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Continue with sign-up process even if profile creation fails
      } else {
        console.log("Profile created successfully");
      }

      // If email confirmation is required
      if (!data.session) {
        toast.success('Sign up successful!', {
          description: 'Please check your email (including spam folder) for the confirmation link.'
        })
        
        // Wait a moment then show additional instructions
        setTimeout(() => {
          toast.info('Next steps:', {
            description: '1. Click the confirmation link in your email\n2. Return here to sign in',
            duration: 10000
          })
        }, 3000)
      } else {
        // User is automatically signed in (email confirmation disabled in Supabase)
        toast.success('Sign up successful!', {
          description: 'Your account has been created and you are now signed in.'
        })
        router.push('/')
        router.refresh()
      }

    } catch (error: any) {
      toast.error("Sign up failed", {
        description: error.message || "Please try again"
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      toast.error("Google sign up failed", {
        description: error.message || "Please try again later"
      })
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src="/Ledgerly.svg" alt="Logo" className="h-24 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">Enter your details below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" {...field} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing up...
                  </>
                ) : (
                  "Sign up"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={googleLoading}>
            {googleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing up with Google...
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
                Sign up with Google
              </>
            )}
          </Button>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


function setGoogleLoading(arg0: boolean) {
  throw new Error("Function not implemented.")
}
