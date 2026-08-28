'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Mail, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ShareButtonProps {
  url: string
  title: string
  description?: string
}

/**
 * 링크 공유 버튼 컴포넌트 (Client Component)
 * 이메일, 텔레그램, 시스템 공유(카카오톡 등) 옵션 제공
 */
export function ShareButton({ url, title, description }: ShareButtonProps) {
  // navigator.share는 SSR에서 접근 불가하므로 마운트 후 클라이언트에서만 판별
  const [canUseWebShare, setCanUseWebShare] = useState(false)

  useEffect(() => {
    setCanUseWebShare(typeof navigator.share === 'function')
  }, [])

  const shareViaSystem = async () => {
    try {
      await navigator.share({ title, text: description, url })
    } catch (error) {
      // 사용자가 공유를 취소한 경우(AbortError)는 에러로 취급하지 않음
      if ((error as Error)?.name !== 'AbortError') {
        toast.error('공유에 실패했습니다')
      }
    }
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`견적서: ${title}`)
    const body = encodeURIComponent(
      `${description || '견적서를 확인해주세요'}\n\n${url}`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const shareViaTelegram = () => {
    const text = encodeURIComponent(`${title}\n${url}`)
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('링크가 복사되었습니다')
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Share2 className="h-4 w-4" />
          <span className="sr-only">공유</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canUseWebShare && (
          <DropdownMenuItem onClick={shareViaSystem}>
            <Send className="mr-2 h-4 w-4" />
            공유하기 (카카오톡 등)
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={shareViaEmail}>
          <Mail className="mr-2 h-4 w-4" />
          이메일로 공유
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaTelegram}>
          <MessageCircle className="mr-2 h-4 w-4" />
          텔레그램으로 공유
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          <Share2 className="mr-2 h-4 w-4" />
          링크 복사
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
