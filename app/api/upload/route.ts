import { NextResponse } from 'next/server'
import * as xlsx from 'xlsx'
import { connectToMongo } from '@/lib/mongodb'

// ExcelDocument를 사용하지 않는다면 제거하거나 사용하세요
// any 타입을 구체적인 타입으로 변경:

// 타입 정의 추가
type ExcelRow = string[]
type RowData = Record<string, string>

// 함수 시그니처 예시:
export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = xlsx.read(buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    
    // header: 1로 설정하여 첫 번째 행도 데이터로 처리
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: ''  // 빈 셀은 빈 문자열로 처리
    })

    // 첫 번째 행의 값들을 컬럼명으로 사용
    const columns = (jsonData[0] as ExcelRow).map((col: string, index: number) => {
      return col || `Column${index + 1}`
    })

    // 데이터 행들을 객체로 변환
    const formattedData = jsonData.slice(1).map((row: unknown) => {
      const obj: RowData = {}
      columns.forEach((col: string, index: number) => {
        obj[col] = (row as ExcelRow)[index]?.toString() || ''
      })
      return obj
    })

    console.log('엑셀 데이터 변환 완료:', {
      총행수: formattedData.length,
      미리보기행수: Math.min(5, formattedData.length),
      컬럼목록: columns
    })

    return NextResponse.json({ 
      preview: formattedData,
      fullData: formattedData,
      columns: columns,
      totalRows: formattedData.length
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: '파일 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// 실제 DB 저장을 위한 새로운 엔드포인트
export async function PUT(request: Request) {
  let client;
  try {
    const { data, selectedColumns }: { data: RowData[], selectedColumns: string[] } = await request.json()
    
    // 선택된 컬럼만 포함하도록 데이터 필터링
    const filteredData = data.map((row: RowData) => {
      const filteredRow: RowData = {}
      selectedColumns.forEach((col: string) => {
        filteredRow[col] = row[col]
      })
      return filteredRow
    })

    client = await connectToMongo()
    const db = client.db('excelData')
    const result = await db.collection('documents').insertMany(filteredData)

    return NextResponse.json({ 
      message: '성공적으로 저장되었습니다.',
      insertedCount: result.insertedCount 
    })

  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json({ 
      error: '저장 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  } finally {
    if (client) {
      await client.close()
    }
  }
}