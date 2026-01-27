import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin/auth'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return children
}
