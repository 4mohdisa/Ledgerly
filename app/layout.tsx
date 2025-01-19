"use client";

import localFont from "next/font/local";
import { ClerkProvider } from '@clerk/nextjs';
import { SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClerkProvider 
          appearance={{
            elements: {
              footer: "hidden",
              card: "shadow-none",
            }
          }}
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          <SidebarProvider>
            <SidebarTrigger />
            {children}
          </SidebarProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
