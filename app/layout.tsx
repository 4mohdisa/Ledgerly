"use client";

import { ClerkProvider } from '@clerk/nextjs';
import { SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
import "./globals.css";
import { UserSyncProvider } from '@/components/providers/user-sync-provider'
import localFont from "next/font/local";
import { SupabaseAuthSync } from '@/components/SupabaseAuthSync';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      appearance={{
        elements: {
          footer: "hidden",
          card: "shadow-none",
        }
      }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      __experimental_crossOriginAuth
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <SupabaseAuthSync />
          <UserSyncProvider>
            {children}
          </UserSyncProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
