'use client';

import { ArrowLeft } from "lucide-react"
import { Header } from '@/components/layout/header'
import AnalyticsDashboard from '@/components/learn/analytics-dashboard'
import Link from 'next/link'
import { useI18n } from "@/components/providers/i18n-provider";

export default function Page() {
  const { t } = useI18n();

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold">{t('progress.title')}</h1>
        </div>
        <nav className="mb-4 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900 transition">{t('nav.home')}</Link> &gt; {t('progress.title')}
        </nav>
        <AnalyticsDashboard />
      </div>
    </>
  )
}
