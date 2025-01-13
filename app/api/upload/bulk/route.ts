import { NextResponse } from 'next/server'
import * as xlsx from 'xlsx'
import { connectToMongo } from '@/lib/mongodb'

export async function POST(request: Request) {
  let client;
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sheetName = formData.get('sheetName') as string
    
    if (!file || !sheetName) {
      return NextResponse.json({ error: '파일 또는 탭 이름이 없습니다.' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = xlsx.read(buffer)
    
    // 지정된 탭이 없는 경우
    if (!workbook.SheetNames.includes(sheetName)) {
      return NextResponse.json({ 
        error: `${file.name} 파일에서 ${sheetName} 탭을 찾을 수 없습니다.`
      }, { status: 400 })
    }

    const worksheet = workbook.Sheets[sheetName]
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: ''
    })

    // 첫 번째 행의 값들을 컬럼명으로 사용
    const columns = (jsonData[0] as string[]).map((col: string, index: number) => {
      return col || `Column${index + 1}`
    })

    // 데이터 행들을 객체로 변환
    const formattedData = jsonData.slice(1).map((row: any) => {
      const obj: Record<string, string> = {}
      columns.forEach((col: string, index: number) => {
        obj[col] = row[index]?.toString() || ''
      })
      return obj
    })

    client = await connectToMongo()
    const db = client.db('excelData')
    const result = await db.collection('documents').insertMany(formattedData)

    return NextResponse.json({ 
      message: '성공적으로 저장되었습니다.',
      insertedCount: result.insertedCount 
    })

  } catch (error) {
    console.error('Bulk upload error:', error)
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