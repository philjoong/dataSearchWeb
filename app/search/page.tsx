'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DetailData, UploadedData } from '@/types'

// 하이라이트 헬퍼 함수 추가
function highlightText(text: string, searchTerms: string[]) {
  if (!searchTerms.length || !text) return text

  let result = text
  searchTerms.forEach(term => {
    if (!term) return
    const regex = new RegExp(term, 'gi')
    result = result.replace(regex, match => `<mark class="bg-yellow-200">${match}</mark>`)
  })
  
  return result
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filtersParam = searchParams.get('filters')
  const filterQuery = searchParams.get('filter') || ''
  
  const [searchResults, setSearchResults] = useState<UploadedData[]>([])
  const [filteredResults, setFilteredResults] = useState<UploadedData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerms, setSearchTerms] = useState<string[]>([])
  const [copySuccess, setCopySuccess] = useState<boolean>(false)

  // 필터 파라미터가 변경될 때마다 검색 실행
  useEffect(() => {
    const filtersParam = searchParams.get('filters')
    const dbSearchParam = searchParams.get('dbSearch')
    
    // 검색어 terms 수집
    const terms: string[] = []
    if (dbSearchParam) {
      terms.push(decodeURIComponent(dbSearchParam))
    }
    if (filtersParam) {
      const filters = JSON.parse(decodeURIComponent(filtersParam))
      filters.forEach((filter: any) => {
        if (filter.value) terms.push(filter.value)
      })
    }
    setSearchTerms(terms)
    
    if (filtersParam || dbSearchParam) {
      const filters = filtersParam ? JSON.parse(decodeURIComponent(filtersParam)) : []
      const dbSearch = dbSearchParam ? decodeURIComponent(dbSearchParam) : ''
      searchData(filters, dbSearch)
    }
  }, [searchParams])

  const handleFilter = useCallback((filterText: string) => {
    // URL 업데이트
    const params = new URLSearchParams(searchParams.toString())
    if (filterText) {
      params.set('filter', filterText)
    } else {
      params.delete('filter')
    }
    router.replace(`/search?${params.toString()}`)

    // 결과 필터링
    if (!filterText.trim()) {
      setFilteredResults(searchResults)
      return
    }

    const filtered = searchResults.filter(result => 
      Object.values(result).some(value => 
        value?.toString().toLowerCase().includes(filterText.toLowerCase()) ?? false
      )
    )
    setFilteredResults(filtered)
  }, [searchParams, router, searchResults])

  useEffect(() => {
    if (searchResults.length > 0) {
      handleFilter(filterQuery)
    }
  }, [filterQuery, searchResults, handleFilter])

  const searchData = async (filters: any[], dbSearch: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters, dbSearch })
      })

      const data = await response.json()
      if (data.error) {
        alert(data.error)
        return
      }

      setSearchResults(data.results || [])
      setFilteredResults(data.results || [])
    } catch (error) {
      console.error('검색 중 오류:', error)
      alert('검색 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRowClick = (id: string) => {
    // 검색 필터와 결과 내 검색 필터를 유지한 상태로 상세 페이지로 이동
    router.push(`/detail?id=${id}&from=search&filters=${filtersParam || ''}&filter=${encodeURIComponent(filterQuery)}`)
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

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => handleFilter(e.target.value)}
          placeholder="결과 내 검색"
          className="w-64 px-3 py-2 border rounded"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          {isLoading ? (
            <div>검색 중...</div>
          ) : (
            <>
              {filteredResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg">검색 결과: {filteredResults.length}건</h3>
                    <button
                      onClick={handleCopyTable}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      {copySuccess ? '✓ 복사됨' : '표 복사'}
                    </button>
                  </div>
                  <table className="min-w-full border">
                    <thead>
                      <tr className="bg-gray-50">
                        {Object.keys(filteredResults[0])
                          .filter(key => !key.startsWith('_'))
                          .map(col => (
                            <th key={col} className="border p-2 text-left">{col}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((row, i) => (
                        <tr 
                          key={i} 
                          onClick={() => handleRowClick(row._id as string)}
                          className="hover:bg-blue-50 cursor-pointer transition-colors duration-150 ease-in-out border-b"
                        >
                          {Object.entries(row)
                            .filter(([key]) => !key.startsWith('_'))
                            .map(([key, value]) => (
                              <td 
                                key={key} 
                                className="border p-2"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(String(value), searchTerms)
                                }}
                              />
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                filtersParam && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">
                      <svg 
                        className="mx-auto h-12 w-12 mb-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" 
                        />
                      </svg>
                      <div className="text-lg font-medium">검색 결과가 없습니다</div>
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
} 