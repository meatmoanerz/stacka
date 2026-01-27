import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel - Stacka',
  description: 'Stacka Administration Panel',
  robots: 'noindex, nofollow',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
