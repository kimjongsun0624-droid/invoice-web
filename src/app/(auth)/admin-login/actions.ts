/**
 * 로그인 Server Actions
 */

'use server'

import { headers } from 'next/headers'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * 로그인 시도 Rate Limit 설정 (무차별 대입 공격 방지)
 */
const LOGIN_RATE_LIMIT = {
  /** 5분당 최대 시도 횟수 */
  MAX_ATTEMPTS: 5,
  /** 시간 윈도우 (밀리초) - 5분 */
  WINDOW_MS: 5 * 60 * 1000,
} as const

/**
 * Server Action 결과 타입
 */
interface ActionResult {
  success: boolean
  message: string
}

/**
 * 요청자 IP 추출 (프록시 환경 고려)
 */
async function getClientIp(): Promise<string> {
  const headerList = await headers()
  return (
    headerList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headerList.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * 로그인 처리 Server Action
 * @param formData - 폼 데이터 (password 필드 포함)
 * @returns 로그인 성공/실패 결과
 */
export async function loginAction(formData: FormData): Promise<ActionResult> {
  const ip = await getClientIp()

  // 무차별 대입 방어: IP당 5분에 5회로 제한
  const rateLimit = checkRateLimit(
    `login:${ip}`,
    LOGIN_RATE_LIMIT.MAX_ATTEMPTS,
    LOGIN_RATE_LIMIT.WINDOW_MS
  )

  if (!rateLimit.allowed) {
    const retryMinutes = Math.ceil((rateLimit.retryAfter || 0) / 60)
    return {
      success: false,
      message: `로그인 시도 횟수를 초과했습니다. ${retryMinutes}분 후 다시 시도해주세요`,
    }
  }

  const password = formData.get('password') as string

  // 비밀번호 입력 검증
  if (!password) {
    return {
      success: false,
      message: '비밀번호를 입력해주세요',
    }
  }

  // 비밀번호 확인
  if (!verifyPassword(password)) {
    return {
      success: false,
      message: '비밀번호가 일치하지 않습니다',
    }
  }

  // 세션 생성
  await createSession()

  return {
    success: true,
    message: '로그인 성공',
  }
}
