# API 문서

## 📋 목차

1. [환경 변수](#환경-변수)
2. [주요 함수 API](#주요-함수-api)
3. [Notion API 통합](#notion-api-통합)
4. [컴포넌트 API](#컴포넌트-api)

---

## 🔧 환경 변수

### 필수 환경 변수

#### `NOTION_API_KEY`

- **설명**: Notion Integration Token
- **형식**: `secret_` 또는 `ntn_`으로 시작하는 문자열
- **획득 방법**:
  1. https://www.notion.so/my-integrations 접속
  2. "+ New integration" 클릭
  3. Integration 이름 입력 후 생성
  4. "Internal Integration Token" 복사

**예시**:

```bash
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### `NOTION_DATABASE_ID`

- **설명**: 견적서 데이터베이스 ID
- **형식**: 32자 영숫자 문자열
- **획득 방법**:
  1. Notion 견적서 데이터베이스 열기
  2. URL 확인: `https://www.notion.so/[DATABASE_ID]?v=...`
  3. DATABASE_ID 부분 복사

**예시**:

```bash
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### `ADMIN_PASSWORD`

- **설명**: 관리자 로그인 비밀번호
- **형식**: 최소 8자 이상
- **보안 요구사항**:
  - 프로덕션에서 약한 비밀번호 사용 금지
  - 금지된 비밀번호: `admin1234`, `admin123`, `password`, `12345678`

**예시**:

```bash
ADMIN_PASSWORD=your-strong-password-here
```

#### `SESSION_SECRET`

- **설명**: JWT 세션 암호화 키
- **형식**: 정확히 32자
- **생성 방법**:

```bash
openssl rand -base64 32
```

**예시**:

```bash
SESSION_SECRET=AlwrgLHiQyGEx01dnwmuPc0V+NIRcmzp
```

### 선택 환경 변수

#### `NEXT_PUBLIC_BASE_URL`

- **설명**: 애플리케이션 기본 URL (견적서 링크 생성에 사용)
- **형식**: 유효한 URL
- **기본값**: `http://localhost:3000`
- **프로덕션 예시**:

```bash
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

---

## 🔌 주요 함수 API

### 링크 생성

#### `generateInvoiceUrl(invoiceId: string): string`

견적서 고유 URL 생성

**매개변수**:

- `invoiceId`: 견적서 ID (Notion Page ID)

**반환값**:

- 견적서 전체 URL

**사용 예시**:

```typescript
import { generateInvoiceUrl } from '@/lib/utils/link-generator'

const url = generateInvoiceUrl('2856a10d-310b-80e0-8baa-d4445d6baf92')
// 반환: "http://localhost:3000/invoice/2856a10d-310b-80e0-8baa-d4445d6baf92"
```

#### `generateShortUrl(invoiceId: string): string`

짧은 URL 표시용 (선택사항)

**매개변수**:

- `invoiceId`: 견적서 ID

**반환값**:

- 짧게 표시할 ID (앞 8자)

**사용 예시**:

```typescript
import { generateShortUrl } from '@/lib/utils/link-generator'

const shortId = generateShortUrl('2856a10d-310b-80e0-8baa-d4445d6baf92')
// 반환: "...2856a10d"
```

---

### 클립보드 복사

#### `useClipboard()`

클립보드 복사 커스텀 훅

**반환값**:

```typescript
{
  copy: (text: string) => Promise<void>,
  isCopied: boolean
}
```

**사용 예시**:

```typescript
'use client'

import { useClipboard } from '@/hooks/use-clipboard'

export function CopyButton({ text }: { text: string }) {
  const { copy, isCopied } = useClipboard()

  return (
    <button onClick={() => copy(text)}>
      {isCopied ? '복사됨!' : '복사'}
    </button>
  )
}
```

**특징**:

- Modern Clipboard API 사용
- 구형 브라우저 폴백 지원
- Sonner 토스트 알림 통합
- 복사 성공 시 2초간 `isCopied: true`

---

## 🔗 Notion API 통합

### 견적서 조회

#### `getOptimizedInvoice(pageId: string): Promise<Invoice>`

최적화된 견적서 조회 (캐싱 + Request Deduplication)

**캐싱 전략**:

- **캐시 시간**: 60초
- **캐시 키**: `invoice-${pageId}`
- **재검증**: `revalidateTag('invoices')`

**Rate Limiting**:

- Notion API 제한: 3 requests/second
- 재시도 로직: 지수 백오프 (1초, 2초, 4초)
- 최대 재시도: 3회

**사용 예시**:

```typescript
import { getOptimizedInvoice } from '@/lib/services/invoice.service'

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const invoice = await getOptimizedInvoice(params.id)

  return <div>{invoice.invoiceNumber}</div>
}
```

---

### 견적서 목록 조회

#### `getInvoicesFromNotion(pageSize?: number, startCursor?: string, sortBy?: 'issue_date' | 'total_amount', sortOrder?: 'ascending' | 'descending'): Promise<InvoiceListResult>`

Notion 데이터베이스에서 견적서 목록 조회

**매개변수**:

- `pageSize`: 페이지당 항목 수 (기본: 10, 최대: 100)
- `startCursor`: 페이지네이션 커서
- `sortBy`: 정렬 기준 (기본: `total_amount`)
- `sortOrder`: 정렬 방향 (기본: `descending`)

**반환값**:

```typescript
{
  invoices: Invoice[],
  nextCursor: string | null,
  hasMore: boolean
}
```

**사용 예시**:

```typescript
import { getInvoicesFromNotion } from '@/lib/services/invoice.service'

const { invoices, nextCursor, hasMore } = await getInvoicesFromNotion(
  10,
  undefined,
  'issue_date',
  'ascending'
)
```

---

### 견적서 검색

#### `searchInvoices(filters: InvoiceFilters, pageSize?: number, startCursor?: string, sortBy?: 'issue_date' | 'total_amount', sortOrder?: 'ascending' | 'descending'): Promise<InvoiceListResult>`

필터 조건으로 견적서 검색. 정렬 파라미터는 `getInvoicesFromNotion`과 동일하게 동작하며, 필터가 걸려 있어도 정렬이 적용됨.

**필터 타입**:

```typescript
interface InvoiceFilters {
  query?: string // 클라이언트명 또는 견적서 번호
  status?: InvoiceStatus // 'pending' | 'approved' | 'rejected'
  dateFrom?: string // ISO 8601 형식: YYYY-MM-DD
  dateTo?: string // ISO 8601 형식: YYYY-MM-DD
}
```

**주의**: Notion DB의 `상태` 속성은 **Status 타입**이어야 함 (구버전 Select 타입이 아님). Select 타입으로 만들어져 있으면 이 필터가 `validation_error`로 실패함.

**사용 예시**:

```typescript
import { searchInvoices } from '@/lib/services/invoice.service'

const { invoices } = await searchInvoices(
  {
    query: 'ABC 회사',
    status: 'pending',
    dateFrom: '2025-01-01',
    dateTo: '2025-12-31',
  },
  10,
  undefined,
  'issue_date',
  'descending'
)
```

---

### 조회수 증가

#### `incrementViewCount(pageId: string): Promise<void>`

견적서 조회 시 Notion `조회수`(Number) 속성을 +1. 속성이 없으면 조용히 무시됨(에러를 던지지 않고 `logger.warn`만 남김). 캐시된 값이 아닌 최신 값을 다시 읽어 증가시키므로 60초 캐시 윈도우 안에서도 카운트가 누락되지 않음. 동시 조회 시 read-modify-write 경쟁으로 일부 카운트가 누락될 수 있음(원자적 증가 아님).

**사용 예시**:

```typescript
import { incrementViewCount } from '@/lib/services/invoice.service'
import { after } from 'next/server'

// 응답을 막지 않도록 반드시 after()로 백그라운드 실행
after(() => incrementViewCount(invoiceId))
```

---

## 🎨 컴포넌트 API

### LinkDisplay

링크 표시 컴포넌트 (Server Component)

**Props**:

```typescript
interface LinkDisplayProps {
  url: string
  className?: string
}
```

**사용 예시**:

```typescript
import { LinkDisplay } from '@/components/admin/link-display'

<LinkDisplay url="https://example.com/invoice/123" />
```

---

### CopyButton

링크 복사 버튼 (Client Component)

**Props**:

```typescript
interface CopyButtonProps {
  text: string
  label?: string // 기본값: "링크 복사"
}
```

**사용 예시**:

```typescript
import { CopyButton } from '@/components/admin/copy-button'

<CopyButton text="https://example.com/invoice/123" label="URL 복사" />
```

---

### ShareButton

링크 공유 버튼 (Client Component). `navigator.share`를 지원하는 브라우저에서는 "공유하기(카카오톡 등)" 항목이 드롭다운 최상단에 추가로 표시됨.

**Props**:

```typescript
interface ShareButtonProps {
  url: string
  title: string
  description?: string
}
```

**사용 예시**:

```typescript
import { ShareButton } from '@/components/admin/share-button'

<ShareButton
  url="https://example.com/invoice/123"
  title="INV-2025-001"
  description="ABC 회사님의 견적서"
/>
```

---

## 🔒 보안

### Rate Limiting

- **로그인 시도**: IP당 5회 / 5분 (`src/app/(auth)/admin-login/actions.ts`의 `LOGIN_RATE_LIMIT`)
- **API 요청**(`/api/*`): IP당 10회 / 분 (`src/middleware.ts`)
- **Notion API 호출**: Notion 자체 제한(3 requests/second) 준수, 지수 백오프 재시도

### 인증

- **세션 방식**: JWT (HttpOnly Cookie)
- **세션 만료**: 7일 (발급 시점 기준, 브라우저를 닫아도 유지됨)
- **CSRF 방지**: SameSite=Lax Cookie
- **로그인 성공 후 리다이렉트**: 미인증 접근 시 `next` 쿼리 파라미터로 원래 요청 경로를 기억했다가 로그인 후 복귀

---

## 📊 성능

### 캐싱 전략

1. **Invoice 캐싱**: 60초
2. **Request Deduplication**: 동일 요청 병합
3. **병렬 처리**: 견적 항목 조회 최적화

### 최적화

- **레이지 로딩**: 컴포넌트 지연 로딩
- **이미지 최적화**: Next.js Image 컴포넌트
- **코드 분할**: 동적 import

---

## 🐛 에러 처리

### 에러 메시지

```typescript
export const ERROR_MESSAGES = {
  INVOICE_NOT_FOUND: '견적서를 찾을 수 없습니다',
  INVALID_INVOICE_DATA: '유효하지 않은 견적서 데이터입니다',
  NOTION_API_ERROR: 'Notion API 오류가 발생했습니다',
}
```

### 재시도 로직

- **재시도 횟수**: 최대 3회
- **백오프**: 지수 백오프 (1초, 2초, 4초)
- **재시도 불가**: `INVOICE_NOT_FOUND`, `INVALID_INVOICE_DATA`

---

## 📝 로깅

### 로그 레벨

- **INFO**: 정상 작업 (견적서 조회 성공)
- **WARN**: 경고 (일부 항목 조회 실패)
- **ERROR**: 오류 (API 실패)

### 로그 예시

```typescript
logger.info('견적서 목록 조회 성공', {
  count: 10,
  hasMore: true,
  sortBy: 'issue_date',
})
```
