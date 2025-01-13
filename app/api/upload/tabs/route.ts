import { NextResponse } from 'next/server'
import * as xlsx from 'xlsx'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = xlsx.read(buffer)
    
    // 모든 시트(탭) 이름 가져오기
    const sheets = workbook.SheetNames

    return NextResponse.json({ sheets: workbook.SheetNames })

  } catch (error) {
    console.error('Get tabs error:', error)
    return NextResponse.json({ 
      error: '파일 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 