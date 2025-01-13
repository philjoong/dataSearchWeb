'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { name: '데이터 업로드', href: '/upload', icon: '📤' },
  { name: '데이터 검색', href: '/search', icon: '🔍' },
  { name: '업로드 히스토리', href: '/history', icon: '📋' }
]

export default function SideBar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-50 min-h-screen fixed left-0 border-r">
      <div className="p-4">
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-4 py-2 rounded-lg
                    ${pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
            
            {pathname.startsWith('/detail') && (
              <li>
                <div className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-700">
                  <span className="mr-3">📄</span>
                  상세 정보
                </div>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  )
} 