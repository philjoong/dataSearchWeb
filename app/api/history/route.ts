import { NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'

export async function GET() {
  let client;
  try {
    client = await connectToMongo()
    const db = client.db('excelData')
    
    // 고유한 fileName 목록 가져오기
    const fileNames = await db.collection('documents').distinct('_meta.fileName')
    
    // 각 파일의 최신 업로드 정보 가져오기
    const filesInfo = await Promise.all(fileNames.map(async (fileName) => {
      const latestDoc = await db.collection('documents')
        .findOne(
          { '_meta.fileName': fileName },
          { 
            sort: { '_meta.uploadedAt': -1 },
            projection: { 
              '_meta.fileName': 1,
              '_meta.sheetName': 1,
              '_meta.uploadedAt': 1
            }
          }
        )
      return {
        fileName,
        sheetName: latestDoc?._meta.sheetName,
        uploadedAt: latestDoc?._meta.uploadedAt
      }
    }))

    // 업로드 날짜 기준으로 정렬
    filesInfo.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )

    return NextResponse.json({ files: filesInfo })

  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ 
      error: '히스토리 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  } finally {
    if (client) {
      await client.close()
    }
  }
} 