/**
 * 관리자 로그인 페이지
 * Server Component (이미 로그인된 경우 리다이렉트 처리)
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { LoginForm } from './login-form'

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams

  // 이미 로그인된 상태면 로그인 폼을 보여줄 필요 없이 바로 이동
  const session = await getSession()
  if (session) {
    redirect(next && next.startsWith('/admin') ? next : '/admin')
  }

  return <LoginForm next={next} />
}
