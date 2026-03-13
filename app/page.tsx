'use client'

import { useEffect, useState } from "react"
import { SiteInput } from "@/components/SiteInput"
import { Audits } from "@/components/Audits"
import { getAuditList } from "@/lib/api"

export type Audit = {
  id: number
  domain: string
  status: string
  final_url: string | null
  server_status_code: number | null
  response_time_ms: number | null
  title: string
  h1: string
  meta_description: string
  canonical: string | null
  meta_robots: string
  last_modified: string
  is_indexable: boolean | null
  warnings: string[]
  site_checks: unknown
  error_message: string
  created_at: string
  updated_at: string
}

export default function Home() {
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAudits = async () => {
      try {
        const data = await getAuditList()
        setAudits(data)
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Не удалось загрузить аудиты")
        }
      } finally {
        setLoading(false)
      }
    }

    void loadAudits()
  }, [])

  const handleAuditCreated = (newAudit: Audit) => {
    setAudits((prev) => [newAudit, ...prev])
  }

  const handleAuditDeleted = (id: number) => {
    setAudits((prev) => prev.filter((audit) => audit.id !== id))
  }

  const completed = audits.filter((audit) => audit.status === "done").length
  const withWarnings = audits.filter((audit) => (audit.warnings?.length ?? 0) > 0).length
  const latestAudit = audits[0]

  const latestAuditLabel = latestAudit
    ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(latestAudit.created_at)
    )
    : "еще не запускался"

  return (
    <div className="page-shell space-y-6">
      <section className="surface-card motion-fade-up relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-500/25" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-500/20" />

        <div className="relative space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">OneMoreSeoTool</p>
          <h1 className="section-title text-3xl sm:text-4xl">Технический SEO-аудит сайта</h1>
          <p className="section-subtitle max-w-3xl">
            Проверяйте индексируемость, robots.txt, дубли и технические сигналы сайта в одном отчете.
          </p>
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-wide text-slate-500">Всего аудитов</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{audits.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-wide text-slate-500">Завершено</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">{completed}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-wide text-slate-500">С предупреждениями</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700 dark:text-amber-300">{withWarnings}</p>
          </div>
        </div>
        <p className="relative mt-4 text-sm text-slate-600 dark:text-slate-300">
          Последний запуск: <span className="font-medium text-slate-800">{latestAuditLabel}</span>
        </p>
      </section>

      <main className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,420px)_1fr] lg:items-start">
        <SiteInput onAuditCreated={handleAuditCreated} />
        <Audits
          audits={audits}
          loading={loading}
          error={error}
          onAuditDeleted={handleAuditDeleted}
        />
      </main>
    </div>
  )
}
