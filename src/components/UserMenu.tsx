'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  tier?: string
}

export function UserMenu({ user, tier = 'free' }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const tierColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    pro: 'bg-blue-100 text-blue-700',
    team: 'bg-purple-100 text-purple-700',
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col items-center justify-center min-h-touch py-2 px-4 text-gray-500"
        aria-label="User menu"
        aria-expanded={open}
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-6 h-6 rounded-full mb-1"
          />
        ) : (
          <UserIcon className="w-6 h-6 mb-1" />
        )}
        <span className="text-xs font-medium">Account</span>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* User Info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {user.name || 'User'}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${tierColors[tier] || tierColors.free}`}>
                {tier.toUpperCase()} PLAN
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 active:bg-gray-50"
            >
              <CreditCardIcon className="w-5 h-5 text-gray-400" />
              <span>Manage Subscription</span>
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-100 py-2">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-3 px-4 py-3 text-danger w-full text-left active:bg-red-50"
            >
              <LogOutIcon className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}
