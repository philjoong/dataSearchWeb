'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface DetailData {
  detail: {
    _id: string;
    _meta: {
      fileName: string;
      sheetName: string;
      uploadedAt: string;
    };
    [key: string]: any;
  };
  tableData: {
    fileName: string;
    sheetName: string;
    uploadedAt: string;
    rows: any[];
  };
}

function DetailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')
  const [detailData, setDetailData] = useState<DetailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState<boolean>(false)

  useEffect(() => {
    if (id) {
      loadDetailData(id)
    }
  }, [id])

  const loadDetailData = async (documentId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/search/detail?id=${documentId}`)
      const data = await response.json()
      
      if (data.error) {
        alert(data.error)
        return
      }

      setDetailData(data)
    } catch (error) {
      console.error('상세 정보 조회 중 오류:', error)
      alert('상세 정보를 가져오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToSearch = () => {
    const filters = searchParams.get('filters')
    const filter = searchParams.get('filter')
    
    // 필터 정보를 포함하여 검색 페이지로 이동
    const searchUrl = `/search?${filters ? `filters=${filters}` : ''}${filter ? `&filter=${filter}` : ''}`
    router.push(searchUrl)
  }

  const handleCopyTable = async () => {
    try {
      const table = document.querySelector('table')
      if (!table) {
        throw new Error('테이블을 찾을 수 없습니다.')
      }

      await navigator.clipboard.writeText(table.outerHTML)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000)
    } catch (err) {
      console.error('표 복사 중 오류:', err)
      alert('표 복사에 실패했습니다.')
    }
  }

  if (!detailData || isLoading) {
    return <div className="p-8">로딩 중...</div>
  }

  return (
    <div className="p-8">
      {searchParams.get('from') === 'search' && (
        <button
          onClick={handleBackToSearch}
          className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          검색 결과로 돌아가기
        </button>
      )}

      <div className="mb-4 p-4 bg-gray-50 rounded">
        <h4 className="font-medium mb-2">파일 정보</h4>
        <div>파일명: {detailData.tableData.fileName}</div>
        <div>시트명: {detailData.tableData.sheetName}</div>
        <div>업로드 일시: {new Date(detailData.tableData.uploadedAt).toLocaleString()}</div>
      </div>
      {detailData.tableData.rows.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={handleCopyTable}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {copySuccess ? '✓ 복사됨' : '표 복사'}
            </button>
          </div>
        </div>
      )}
      <div>
        <h4 className="font-medium mb-2">테이블 데이터</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-50">
                {Object.keys(detailData.tableData.rows[0])
                  .filter(key => !key.startsWith('_'))
                  .map(col => (
                    <th key={col} className="border p-2 text-left">{col}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {detailData.tableData.rows.map((row, i) => (
                <tr 
                  key={i}
                  className={`
                    border-b
                    ${row._id === detailData.detail._id ? 'bg-blue-50' : ''}
                  `}
                >
                  {Object.entries(row)
                    .filter(([key]) => !key.startsWith('_'))
                    .map(([key, value]) => (
                      <td key={key} className="border p-2">{String(value)}</td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function DetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DetailContent />
    </Suspense>
  )
} 