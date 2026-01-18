import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { auth } from '@/lib/auth'
import { BottomNav } from '@/components/BottomNav'
import { Toaster } from 'sonner'
import { getUserLimits } from '@/lib/limits'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'App Rater',
  description: 'Evaluate and compare your web apps',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a56db',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const isAuthenticated = !!session?.user

  // Get user tier for the nav menu
  let tier = 'free'
  if (session?.user?.id) {
    try {
      const limits = await getUserLimits(session.user.id)
      tier = limits.tier
    } catch {
      // Stripe not configured - default to free
    }
  }

  return (
    <html lang="en">
      <body className={`${inter.className} ${isAuthenticated ? 'bg-surface-dark pb-20' : 'bg-white'} min-h-screen`}>
        <main className={isAuthenticated ? 'max-w-lg mx-auto' : ''}>
          {children}
        </main>
        {isAuthenticated && session?.user && (
          <BottomNav user={session.user} tier={tier} />
        )}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              padding: '16px',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
