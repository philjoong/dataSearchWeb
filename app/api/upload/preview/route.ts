import { NextResponse } from 'next/server'
import * as xlsx from 'xlsx'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sheetName = formData.get('sheetName') as string
    const startRow = parseInt(formData.get('startRow') as string) || 0
    
    if (!file || !sheetName) {
      return NextResponse.json({ error: '파일 또는 탭 이름이 없습니다.' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = xlsx.read(buffer)
    const worksheet = workbook.Sheets[sheetName]
    
    // 전체 데이터를 가져옴 (헤더 포함)
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      range: startRow // 시작 행부터 데이터 읽기
    }) as any[][]

    // 빈 행 제거
    const filteredData = jsonData.filter(row => row.some(cell => cell !== ''))

    // 첫 10행만 반환 (컬럼 선택용)
    const previewRows = filteredData.slice(0, 10)

    return NextResponse.json({ 
      previewRows,
      totalRows: filteredData.length
    })

  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json({ 
      error: '파일 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 