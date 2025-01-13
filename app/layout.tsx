import './globals.css'
import type { Metadata } from 'next'
import TopBar from './components/TopBar'
import SideBar from './components/SideBar'

export const metadata: Metadata = {
  title: 'Excel Search',
  description: 'Excel file search and upload',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex flex-col">
          <TopBar />
          <div className="flex flex-1">
            <SideBar />
            <main className="flex-1 ml-64">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
} 