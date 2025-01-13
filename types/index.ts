export interface UploadedData {
  [key: string]: string | number | boolean | null
}

export interface TableData {
  rows: UploadedData[]
  fileName: string
  sheetName: string
  uploadedAt: string
}

export interface DetailData {
  detail: {
    _id: string
    _meta: {
      fileName: string
      sheetName: string
      uploadedAt: string
    }
    [key: string]: unknown
  }
  tableData: TableData
} 