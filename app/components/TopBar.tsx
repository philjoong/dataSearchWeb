'use client'

import { useState } from 'react'
import SearchBar from './SearchBar'

export default function TopBar() {
  const [dbSearchText, setDbSearchText] = useState('')

  const handleDbSearchChange = (text: string) => {
    setDbSearchText(text)
  }

  return (
    <div className="flex-grow bg-gradient-to-r from-blue-50 to-indigo-50 border-b shadow-sm">
      <div className="px-4 py-3 flex items-center">
        <div className="w-1/3 flex flex-col justify-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Excel Search
          </h1>
          <input
            type="text"
            value={dbSearchText}
            onChange={(e) => handleDbSearchChange(e.target.value)}
            placeholder="DB 검색..."
            className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-2/3 border-l border-blue-100 pl-4">
          <SearchBar dbSearchText={dbSearchText} />
        </div>
      </div>
    </div>
  )
}