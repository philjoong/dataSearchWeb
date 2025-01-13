'use client'

import { useState } from 'react'

interface UploadResult {
  success: boolean
  fileName: string
  message?: string
  uploadCount?: number
}

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  directory?: string;
  webkitdirectory?: string;
}

export default function UploadPage() {
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<'file' | 'folder'>('file')
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(0)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)

  const resetAllStates = () => {
    setPreviewFile(null)
    setSelectedSheet('')
    setAvailableSheets([])
    setSelectedHeaderRow(0)
    setSelectedColumns([])
    setAvailableColumns([])
    setUploadResults([])
    setIsUploading(false)
  }

  const handlePreview = async (sheetName: string) => {
    if (!previewFile || !sheetName) return;

    const formData = new FormData()
    formData.append('file', previewFile)
    formData.append('sheetName', sheetName)
    formData.append('startRow', '0')

    try {
      const response = await fetch('/api/upload/preview', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.error) {
        alert(data.error)
        return
      }

      setSelectedHeaderRow(0)
      setAvailableColumns(data.previewRows[0] || [])
      setSelectedColumns([])
    } catch (error) {
      console.error('미리보기 생성 중 오류:', error)
      alert('미리보기 생성 중 오류가 발생했습니다.')
    }
  }

  const handleDirectoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    setSelectedFiles(e.target.files)
    const files = Array.from(e.target.files)
    const firstFile = files[0]
    setPreviewFile(firstFile)

    try {
      const formData = new FormData()
      formData.append('file', firstFile)

      const response = await fetch('/api/upload/tabs', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.error) {
        alert(data.error)
        return
      }

      setAvailableSheets(data.sheets || [])
      setSelectedSheet('')
      setSelectedColumns([])
    } catch (error) {
      console.error('시트 목록 가져오기 중 오류:', error)
      alert('시트 목록을 가져오는 중 오류가 발생했습니다.')
    }
  }

  const handleSingleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return

    const file = e.target.files[0]
    setPreviewFile(file)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/tabs', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.error) {
        alert(data.error)
        return
      }

      setAvailableSheets(data.sheets || [])
      setSelectedSheet('')
      setSelectedColumns([])
    } catch (error) {
      console.error('시트 목록 가져오기 중 오류:', error)
      alert('시트 목록을 가져오는 중 오류가 발생했습니다.')
    }
  }

  const handleBulkUpload = async () => {
    if (!selectedSheet || !previewFile || !selectedColumns.length || selectedHeaderRow === undefined) {
      alert('시트와 컬럼을 선택해주세요.')
      return
    }

    setIsUploading(true)
    const results: UploadResult[] = []

    try {
      const files = Array.from((document.querySelector('input[type="file"]') as HTMLInputElement).files || [])
      console.log('업로드할 파일 수:', files.length)
      
      for (const file of files) {
        console.log('처리 중인 파일:', file.name)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('sheetName', selectedSheet)
        formData.append('startRow', selectedHeaderRow.toString())
        formData.append('columns', JSON.stringify(selectedColumns))

        try {
          const response = await fetch('/api/upload/data', {
            method: 'POST',
            body: formData,
          })

          const result = await response.json()
          console.log('파일 처리 결과:', result)
          if (result.error) {
            results.push({
              success: false,
              fileName: file.name,
              message: result.error
            })
            console.log('현재 results:', results)
            continue
          }

          results.push({
            success: true,
            fileName: file.name,
            message: result.message,
            uploadCount: result.insertedCount
          })
        } catch (error) {
          results.push({
            success: false,
            fileName: file.name,
            message: '업로드 실패'
          })
        }
      }
    } finally {
      setIsUploading(false)
      console.log('최종 results:', results)
      setUploadResults(results)
    }
  }

  const handleHeaderRowSelect = async (rowIndex: number) => {
    if (!previewFile || !selectedSheet) return;

    const formData = new FormData()
    formData.append('file', previewFile)
    formData.append('sheetName', selectedSheet)
    formData.append('startRow', rowIndex.toString())

    try {
      const response = await fetch('/api/upload/preview', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.error) {
        alert(data.error)
        return
      }

      setSelectedHeaderRow(rowIndex)
      setAvailableColumns(data.previewRows[0] || [])
      setSelectedColumns([])
    } catch (error) {
      console.error('헤더 행 변경 중 오류:', error)
      alert('헤더 행 변경 중 오류가 발생했습니다.')
    }
  }

  const handleSingleUploadData = async () => {
    if (!selectedSheet || !previewFile || !selectedColumns.length || selectedHeaderRow === undefined) {
      alert('시트와 컬럼을 선택해주세요.')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', previewFile)
      formData.append('sheetName', selectedSheet)
      formData.append('startRow', selectedHeaderRow.toString())
      formData.append('columns', JSON.stringify(selectedColumns))

      const response = await fetch('/api/upload/data', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (result.error) {
        setUploadResults([{
          success: false,
          fileName: previewFile.name,
          message: result.error
        }])
        return
      }

      setUploadResults([{
        success: true,
        fileName: previewFile.name,
        message: result.message,
        uploadCount: result.insertedCount
      }])
    } catch (error) {
      setUploadResults([{
        success: false,
        fileName: previewFile.name,
        message: '업로드 실패'
      }])
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-xl mb-4">데이터 업로드</h2>

      <div className="mb-4 flex gap-4">
        <label className="flex items-center p-3 rounded hover:bg-gray-100 cursor-pointer">
          <input
            type="radio"
            name="uploadType"
            value="file"
            checked={uploadType === 'file'}
            onChange={(e) => {
              setUploadType(e.target.value as 'file' | 'folder')
              resetAllStates()
            }}
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <span>단일 파일 업로드</span>
        </label>
        <label className="flex items-center p-3 rounded hover:bg-gray-100 cursor-pointer">
          <input
            type="radio"
            name="uploadType"
            value="folder"
            checked={uploadType === 'folder'}
            onChange={(e) => {
              setUploadType(e.target.value as 'file' | 'folder')
              resetAllStates()
            }}
            className="mr-2 h-4 w-4 text-blue-600"
          />
          <span>폴더 업로드</span>
        </label>
      </div>

      <div className="mb-8">
        <label 
          className="
            block w-full p-6
            border-2 border-dashed border-gray-300 
            rounded-lg 
            hover:border-blue-500 hover:bg-blue-50 
            transition-colors duration-150 
            cursor-pointer
            text-center
            flex flex-col items-center justify-center
            min-h-[120px]
          "
        >
          <input
            {...({
              type: "file",
              accept: uploadType === 'file' ? '.xlsx,.xls' : undefined,
              directory: uploadType === 'folder' ? '' : undefined,
              webkitdirectory: uploadType === 'folder' ? '' : undefined,
              multiple: uploadType === 'folder',
              onChange: uploadType === 'folder' ? handleDirectoryUpload : handleSingleFileUpload,
              className: "hidden"
            } as CustomInputProps)}
          />
          <svg 
            className="w-8 h-8 mb-2 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <div className="text-gray-500">
            {previewFile 
              ? previewFile.name 
              : `클릭하여 ${uploadType === 'file' ? '파일' : '폴더'}을 선택하세요`
            }
          </div>
        </label>
      </div>

      {previewFile && availableSheets.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg mb-2">시트 선택</h3>
          <select
            value={selectedSheet}
            onChange={(e) => {
              setSelectedSheet(e.target.value)
              handlePreview(e.target.value)
            }}
            className="p-2 border rounded"
          >
            <option value="">시트를 선택하세요</option>
            {availableSheets.map(sheet => (
              <option key={sheet} value={sheet}>{sheet}</option>
            ))}
          </select>
        </div>
      )}

      {availableColumns.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg mb-2">헤더 행 및 컬럼 선택</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">헤더 행 선택:</label>
            <select
              value={selectedHeaderRow}
              onChange={(e) => handleHeaderRowSelect(parseInt(e.target.value))}
              className="p-2 border rounded"
            >
              {[...Array(5)].map((_, index) => (
                <option key={index} value={index}>{index + 1}번째 행</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">컬럼 선택:</label>
            <div className="flex flex-wrap gap-2">
              {availableColumns.map((col, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newColumns = [...selectedColumns]
                        newColumns[index] = col
                        setSelectedColumns(newColumns.filter(Boolean))
                      } else {
                        setSelectedColumns(selectedColumns.filter(c => c !== col))
                      }
                    }}
                    className="mr-2"
                  />
                  {col || `Column ${index + 1}`}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={uploadType === 'folder' ? handleBulkUpload : handleSingleUploadData}
            disabled={!selectedColumns.length || isUploading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
          >
            {isUploading ? '업로드 중...' : (
              uploadType === 'folder' ? 
              `DB에 데이터 업로드 (${selectedFiles?.length || 0}개 파일)` : 
              'DB에 데이터 업로드'
            )}
          </button>
        </div>
      )}

      {uploadResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg mb-2">업로드 결과</h3>
          <div className="border rounded p-4">
            {uploadResults.map((result, i) => (
              <div key={i} className={`mb-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                <div className="font-bold">
                  {result.success ? '✓ 성공' : '✗ 실패'}
                </div>
                <div className="ml-6">
                  <div>파일명: {result.fileName}</div>
                  <div>{result.message}</div>
                  {result.uploadCount && (
                    <div>업로드된 데이터 수: {result.uploadCount}건</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}