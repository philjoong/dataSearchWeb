import { NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'

interface Filter {
  field: string
  value: string
  operator: 'AND' | 'OR'
}

export async function POST(request: Request) {
  let client;
  try {
    const { filters, dbSearch } = await request.json()
    let query: any = {}

    // DB 검색어가 있는 경우
    if (dbSearch) {
      // 컬렉션의 첫 번째 문서를 가져와서 필드 목록 확인
      client = await connectToMongo()
      const db = client.db('excelData')
      const sampleDoc = await db.collection('documents').findOne({})
      
      if (sampleDoc) {
        // _id와 _meta를 제외한 모든 필드에서 검색
        const searchableFields = Object.keys(sampleDoc).filter(
          key => !key.startsWith('_')
        )

        // 모든 필드에 대해 검색 조건 생성
        query = {
          $or: searchableFields.map(field => ({
            [field]: { $regex: dbSearch, $options: 'i' }
          }))
        }
      }
    }

    // 필터가 있는 경우
    if (filters?.length) {
      const filterConditions = filters.reduce((acc: any[], filter: Filter, index: number) => {
        const condition = { [filter.field]: { $regex: filter.value, $options: 'i' } }
        
        if (index === 0) {
          return [condition]
        }

        if (filter.operator === 'AND') {
          return [...acc, condition]
        } else {
          return [{ $or: [...acc, condition] }]
        }
      }, [])

      // DB 검색어와 필터 조건 결합
      if (dbSearch && filterConditions.length) {
        query = { $and: [query, ...filterConditions] }
      } else if (filterConditions.length) {
        query = filterConditions.length > 1 ? { $and: filterConditions } : filterConditions[0]
      }
    }

    // MongoDB 연결 및 검색 (이미 연결되어 있지 않은 경우에만 연결)
    if (!client) {
      client = await connectToMongo()
    }
    const db = client.db('excelData')
    const results = await db.collection('documents')
      .find(query)
      .toArray()

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ 
      error: '검색 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  } finally {
    if (client) {
      await client.close()
    }
  }
} 