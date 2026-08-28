interface HighlightTextProps {
  text: string
  query?: string
}

/**
 * 검색어와 일치하는 부분을 강조 표시하는 컴포넌트
 * 대소문자를 구분하지 않고 매칭하며, 정규식 특수문자는 이스케이프 처리함
 */
export function HighlightText({ text, query }: HighlightTextProps) {
  if (!query) {
    return <>{text}</>
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={index}
            className="bg-yellow-200 text-inherit dark:bg-yellow-800"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  )
}
