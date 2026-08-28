'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

interface SortButtonProps {
  field: 'issue_date' | 'total_amount'
  currentSort?: string
  currentOrder?: 'ascending' | 'descending'
  children: React.ReactNode
}

/**
 * 정렬 버튼 컴포넌트 (Client Component)
 * 현재 URL의 검색어/필터 파라미터를 보존한 채 정렬 기준만 변경하고,
 * 이미 활성화된 컬럼을 다시 클릭하면 오름차순/내림차순을 토글함
 */
export function SortButton({
  field,
  currentSort,
  currentOrder = 'descending',
  children,
}: SortButtonProps) {
  const searchParams = useSearchParams()
  const isActive = currentSort === field

  const params = new URLSearchParams(searchParams)
  params.set('sort', field)
  params.set(
    'order',
    isActive && currentOrder === 'descending' ? 'ascending' : 'descending'
  )
  // 정렬 변경 시 페이지네이션은 처음부터 다시 시작
  params.delete('page')
  params.delete('cursor')
  params.delete('cursors')

  const Icon = !isActive
    ? ArrowUpDown
    : currentOrder === 'ascending'
      ? ArrowUp
      : ArrowDown

  return (
    <Link
      href={`?${params.toString()}`}
      className="hover:text-foreground flex items-center gap-2 transition-colors"
    >
      {children}
      <Icon
        className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
      />
    </Link>
  )
}
