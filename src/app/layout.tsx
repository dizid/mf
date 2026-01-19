import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { isAuthenticated } from '@/lib/password-auth'
import { BottomNav } from '@/components/BottomNav'
import { Toaster } from 'sonner'

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
  const authenticated = await isAuthenticated()

  return (
    <html lang="en">
      <body className={`${inter.className} ${authenticated ? 'bg-surface-dark pb-20' : 'bg-white'} min-h-screen`}>
        <main className={authenticated ? 'max-w-lg mx-auto' : ''}>
          {children}
        </main>
        {authenticated && <BottomNav />}
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
