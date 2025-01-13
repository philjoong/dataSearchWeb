'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FilterOption {
  field: string
  label: string
}

const FILTER_OPTIONS: FilterOption[] = [
  { field: '분류', label: '분류' },
  { field: '업데이트 내용', label: '업데이트 내용' },
  { field: '일감 또는 TT', label: '일감 또는 TT' },
  { field: '결과', label: '결과' },
  { field: 'TT', label: 'TT' },
  { field: '담당자', label: '담당자' }
]

interface Filter {
  field: string
  value: string
  operator: 'AND' | 'OR'
}

interface SearchBarProps {
  dbSearchText: string
}

export default function SearchBar({ dbSearchText }: SearchBarProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filter[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    updateSearchQuery(filters)
  }, [dbSearchText])

  const handleAddFilter = (field: string) => {
    const newFilter: Filter = { field, value: '', operator: 'AND' }
    const updatedFilters = [...filters, newFilter]
    setFilters(updatedFilters)
    updateSearchQuery(updatedFilters)
  }

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index)
    setFilters(newFilters)
    updateSearchQuery(newFilters)
  }

  const handleFilterChange = (index: number, value: string) => {
    const newFilters: Filter[] = filters.map((filter, i) => 
      i === index ? { ...filter, value } : filter
    )
    setFilters(newFilters)
    updateSearchQuery(newFilters)
  }

  const handleOperatorChange = (index: number) => {
    const newFilters: Filter[] = filters.map((filter, i) => 
      i === index ? { 
        ...filter, 
        operator: filter.operator === 'AND' ? 'OR' : 'AND' 
      } : filter
    )
    setFilters(newFilters)
    updateSearchQuery(newFilters)
  }

  const updateSearchQuery = (currentFilters: Filter[]) => {
    let query = ''
    
    if (dbSearchText) {
      query = `DB 검색: ${dbSearchText}`
    }

    if (currentFilters.length > 0) {
      const filterQuery = currentFilters
        .map((filter, index) => {
          const prefix = index === 0 ? (dbSearchText ? ' AND ' : '') : ` ${filter.operator} `
          return `${prefix}${filter.field} = ${filter.value}`
        })
        .join('')
      query += filterQuery
    }

    setSearchQuery(query)
  }

  const handleSearch = async () => {
    if (!filters.length && !dbSearchText) return

    setIsSearching(true)
    try {
      const searchParams = new URLSearchParams()
      
      if (filters.length) {
        searchParams.set('filters', encodeURIComponent(JSON.stringify(filters)))
      }
      
      if (dbSearchText) {
        searchParams.set('dbSearch', encodeURIComponent(dbSearchText))
      }

      router.push(`/search?${searchParams.toString()}`)
    } catch (error) {
      console.error('검색 중 오류:', error)
      alert('검색 중 오류가 발생했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* 필터 버튼들 */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map(option => (
          <button
            key={option.field}
            onClick={() => handleAddFilter(option.field)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full 
                     hover:bg-blue-200 text-sm"
          >
            + {option.label}
          </button>
        ))}
      </div>

      {/* 활성화된 필터들 */}
      <div className="space-y-2">
        {filters.map((filter, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">{filter.field} =</span>
            <input
              type="text"
              value={filter.value}
              onChange={(e) => handleFilterChange(index, e.target.value)}
              className="border rounded px-2 py-1 flex-grow text-sm"
              placeholder={`${filter.field} 입력...`}
            />
            <button
              onClick={() => handleOperatorChange(index)}
              className={`px-2 py-1 rounded text-sm ${
                filter.operator === 'AND' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {filter.operator}
            </button>
            <button
              onClick={() => handleRemoveFilter(index)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* 검색 쿼리 표시 및 검색 버튼 */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={searchQuery}
          readOnly
          className="flex-1 border rounded px-3 py-2 bg-gray-50 text-sm"
          placeholder="검색 조건이 여기에 표시됩니다"
        />
        <button
          onClick={handleSearch}
          disabled={(!filters.length && !dbSearchText) || isSearching}
          className="px-4 py-2 bg-blue-500 text-white rounded text-sm
                   hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isSearching ? '검색 중...' : '검색'}
        </button>
      </div>
    </div>
  )
}