'use client'
import { AdminDrawerProvider } from '@/context/AdminContext'
import { AuthProvider } from '@/context/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminDrawerProvider>
          {children}
        </AdminDrawerProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
