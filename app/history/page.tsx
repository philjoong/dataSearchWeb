'use client'

import { useState, useEffect } from 'react'

interface FileInfo {
  fileName: string
  sheetName: string
  uploadedAt: string
}

export default function HistoryPage() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/history')
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setFiles(data.files)
    } catch (error) {
      console.error('히스토리 로딩 중 오류:', error)
      alert('히스토리를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="p-8">로딩 중...</div>
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">업로드 히스토리</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left">파일명</th>
              <th className="border p-2 text-left">시트명</th>
              <th className="border p-2 text-left">최근 업로드 일시</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <tr key={index} className="border-b">
                <td className="border p-2">{file.fileName}</td>
                <td className="border p-2">{file.sheetName}</td>
                <td className="border p-2">
                  {new Date(file.uploadedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 