import { NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  let client;
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 })
    }

    client = await connectToMongo()
    const db = client.db('excelData')
    
    // 선택한 문서 조회
    const selectedDoc = await db.collection('documents').findOne({
      _id: new ObjectId(id)
    })

    if (!selectedDoc) {
      return NextResponse.json({ error: '데이터를 찾을 수 없습니다.' }, { status: 404 })
    }

    // _meta 속성이 있는지 확인
    if (!selectedDoc._meta?.fileName || !selectedDoc._meta?.sheetName) {
      return NextResponse.json({ error: '문서 메타데이터가 올바르지 않습니다.' }, { status: 400 })
    }

    // 같은 파일, 같은 시트의 모든 데이터 조회
    const relatedDocs = await db.collection('documents')
      .find({
        '_meta.fileName': selectedDoc._meta.fileName,
        '_meta.sheetName': selectedDoc._meta.sheetName
      })
      .toArray()

    return NextResponse.json({ 
      detail: selectedDoc,
      tableData: {
        fileName: selectedDoc._meta.fileName,
        sheetName: selectedDoc._meta.sheetName,
        uploadedAt: selectedDoc._meta.uploadedAt,
        rows: relatedDocs
      }
    })

  } catch (error) {
    console.error('Detail search error:', error)
    return NextResponse.json({ 
      error: '상세 정보 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  } finally {
    if (client) {
      await client.close()
    }
  }
} 