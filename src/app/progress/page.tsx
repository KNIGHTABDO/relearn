tsx
'use client'

import Header from '@/components/header'
import AnalyticsDashboard from '@/components/learn/analytics-dashboard'
import { IoMdArrowBack } from 'react-icons/io'
import Link from 'next/link'

export default function Page() {
  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition">
            <IoMdArrowBack size={24} />
          </Link>
          <h1 className="text-3xl font-bold">Your Progress</h1>
        </div>
        <nav className="mb-4 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900 transition">Home</Link> &gt; Progress
        </nav>
        <AnalyticsDashboard />
      </div>
    </>
  )
}