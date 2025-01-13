import { NextResponse } from 'next/server'
import * as xlsx from 'xlsx'
import { connectToMongo } from '@/lib/mongodb'

interface DocumentData {
  [key: string]: string | {
    fileName: string;
    sheetName: string;
    uploadedAt: Date;
  };
}

interface BuildInfo {
  buildNumber: string
  date: string
}

interface ProcessedRow {
  [key: string]: string;
  빌드명: string;
  날짜: string;
}

export async function POST(request: Request) {
  let client;
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sheetName = formData.get('sheetName') as string
    const startRow = parseInt(formData.get('startRow') as string) || 0
    const columns = JSON.parse(formData.get('columns') as string) as string[]

    const buffer = await file.arrayBuffer()
    const workbook = xlsx.read(buffer)

    function processExcelData(rawData: any[]): { 
      processedData: any[], 
      buildHistories: any[] 
    } {
      const processedData: any[] = []
      const buildHistories: any[] = []
      let currentBuildInfo: BuildInfo | null = null
    
      // 헤더 행 찾기
      const headerRowIndex = rawData.findIndex(row => 
        Array.isArray(row) && row.some(cell => cell !== '')
      )
    
      if (headerRowIndex === -1) {
        return { processedData: [], buildHistories: [] }
      }

    
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i]
        
        // 첫 번째 칼럼만 값이 있는지 확인
        const isFirstColumnOnly = row[0] && row.slice(1).every((cell: any) => !cell)
        
        if (isFirstColumnOnly) {
          // 빌드 정보 추출
          const buildInfo = extractBuildInfo(row[0])
          if (buildInfo) {
            currentBuildInfo = buildInfo
            buildHistories.push({
              buildNumber: buildInfo.buildNumber,
              date: buildInfo.date,
              rawText: row[0],
              fileName: rawData[0]?._meta?.fileName || '',
              sheetName: rawData[0]?._meta?.sheetName || '',
              extractedAt: new Date().toISOString()
            })
            continue
          }
        }
    
        // 데이터 행 처리
        if (currentBuildInfo && !isFirstColumnOnly && row.some((cell: any) => cell !== '')) {
          const processedRow: any = {
            빌드명: currentBuildInfo.buildNumber,
            날짜: currentBuildInfo.date
          }
    
          // 원본 데이터의 각 칼럼을 추가
          rawData[headerRowIndex].forEach((header: string, index: number) => {
            if (header) {
              processedRow[header] = row[index] || ''
            }
          })
    
          processedData.push(processedRow)
        }
      }
    
      return { processedData, buildHistories }
    }
    
    function extractBuildInfo(text: string): BuildInfo | null {
      // 빌드 번호 추출 (예: 1.134.11.3395)
      const buildNumberMatch = text.match(/\d+\.\d+\.\d+\.\d+/)
      
      // 날짜 추출 (예: 2024-07-29 16:09:02)
      const dateMatch = text.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/)
      
      if (buildNumberMatch && dateMatch) {
        return {
          buildNumber: buildNumberMatch[0],
          date: dateMatch[0]
        }
      }
      
      return null
    }

    // 지정된 시트가 없는 경우
    if (!workbook.SheetNames.includes(sheetName)) {
      return NextResponse.json({ 
        error: `${file.name} 파일에서 ${sheetName} 시트를 찾을 수 없습니다.`
      }, { status: 400 })
    }
    const worksheet = workbook.Sheets[sheetName]
    const rawData = xlsx.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      range: startRow,
      raw: false  // 모든 값을 문자열로 변환
    }) as string[][]

    const { processedData, buildHistories } = processExcelData(rawData)

    // 데이터 변환
    const formattedData = processedData.map((row: ProcessedRow) => {
      const obj: DocumentData = {}
      let hasValidData = false
      
      // selectedColumns의 인덱스 정보 생성 (0부터 시작하는 인덱스)
      const allColumns = ['빌드명', '날짜', ...columns]
      const columnIndices = allColumns.map((col, index) => ({
        column: col,
        index: index
      }))

      // 디버깅용 로그
      console.log('Column mapping:', {
        selectedColumns: allColumns,
        columnIndices
      })

      // 선택된 컬럼 순서대로 데이터 저장
      columnIndices.forEach(({ column }) => {
        const value = row[column];  // 이제 타입 에러가 해결됨
        if (value != null) {
          const strValue = value.toString().trim();
          obj[column] = strValue;
          if (strValue !== '') {
            hasValidData = true;
          }
        }
      });

      // 디버깅용 로그
      console.log('Processing row:', {
        columnIndices,
        row,
        processedObj: obj,  // DB에 저장될 객체
        hasValidData       // 해당 행이 유효한 데이터를 포함하는지 여부
      })

      obj._meta = {
        fileName: file.name,
        sheetName: sheetName,
        uploadedAt: new Date()
      }
      
      return { obj, hasValidData }
    }).filter(({ hasValidData }) => hasValidData)  // 유효한 데이터만 필터링
      .map(({ obj }) => obj)                       // 최종 객체만 추출

    // 최종 데이터 확인
    console.log('Final data:', {
      count: formattedData.length,
      sample: formattedData[0]
    })

    // 변환된 데이터가 없는 경우
    if (formattedData.length === 0) {
      return NextResponse.json({ 
        error: `${file.name} 파일의 ${sheetName} 시트에서 유효한 데이터를 찾을 수 없습니다.`
      }, { status: 400 })
    }

    client = await connectToMongo()
    const db = client.db('excelData')
    const result = await db.collection('documents').insertMany(formattedData)

    return NextResponse.json({ 
      message: '성공적으로 저장되었습니다.',
      insertedCount: result.insertedCount
    })

  } catch (error) {
    console.error('Upload error:', error)
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