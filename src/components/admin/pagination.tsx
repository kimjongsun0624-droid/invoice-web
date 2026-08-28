'use client'

import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  /** 현재 페이지 번호 */
  currentPage: number
  /** 다음 페이지 존재 여부 */
  hasNext: boolean
  /** 다음 페이지 커서 */
  nextCursor: string | null
}

/**
 * 페이지네이션 컴포넌트
 * URL 쿼리 파라미터를 통해 페이지 상태 관리
 */
export function Pagination({
  currentPage,
  hasNext,
  nextCursor,
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Notion 커서 페이지네이션은 앞으로만 이동 가능하므로,
  // 방문했던 커서들을 URL의 `cursors` 파라미터에 스택으로 기록해 "이전"을 지원함.
  // cursors[i] = (i+2)번째 페이지를 조회할 때 사용한 start_cursor
  const cursorHistory =
    searchParams.get('cursors')?.split(',').filter(Boolean) ?? []

  function navigate(page: number, cursors: string[]) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))

    const cursor = cursors[cursors.length - 1]
    if (cursor) {
      params.set('cursor', cursor)
      params.set('cursors', cursors.join(','))
    } else {
      params.delete('cursor')
      params.delete('cursors')
    }

    router.push(`?${params.toString()}`)
  }

  /**
   * 이전 페이지로 이동
   * 커서 히스토리에서 마지막 항목을 제거하고, 남은 히스토리의 마지막 커서로 조회
   */
  function handlePrevious() {
    navigate(currentPage - 1, cursorHistory.slice(0, -1))
  }

  /**
   * 다음 페이지로 이동
   * Notion API의 next_cursor를 커서 히스토리에 추가
   */
  function handleNext() {
    if (nextCursor) {
      navigate(currentPage + 1, [...cursorHistory, nextCursor])
    }
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground text-sm">페이지 {currentPage}</p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          이전
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!hasNext}
        >
          다음
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
