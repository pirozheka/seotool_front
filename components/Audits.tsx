'use client'

import Link from "next/link"
import { useState } from "react"
import { X } from "lucide-react"

import { deleteAudit } from "@/lib/api"
import type { Audit } from "@/app/page"

type AuditsProps = {
  audits: Audit[]
  loading: boolean
  error: string | null
  onAuditDeleted: (id: number) => void
}

function getStatusStyle(status: string) {
  if (status === "done") return "status-pill status-pill-success"
  if (status === "running") return "status-pill status-pill-warning"
  if (status === "error") return "status-pill status-pill-danger"
  return "status-pill status-pill-neutral"
}

function getStatusLabel(status: string) {
  if (status === "done") return "Завершен"
  if (status === "running") return "В работе"
  if (status === "error") return "Ошибка"
  return "В очереди"
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function Audits({ audits, loading, error, onAuditDeleted }: AuditsProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить этот аудит?")) return

    try {
      setDeletingId(id)
      setDeleteError(null)
      await deleteAudit(id)
      onAuditDeleted(id)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteError(err.message)
      } else {
        setDeleteError("Ошибка удаления аудита")
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="surface-card motion-fade-up motion-delay-2">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">История аудитов</h2>
          <p className="section-subtitle">Откройте любой аудит, чтобы увидеть подробный технический отчет.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
          {audits.length} шт.
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70 dark:border-slate-700/70 dark:bg-slate-800/70" />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700/50 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>
      ) : null}

      {deleteError ? (
        <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700/50 dark:bg-rose-950/40 dark:text-rose-300">{deleteError}</p>
      ) : null}

      {!loading && !error && audits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-10 text-center dark:border-slate-700/70 dark:bg-slate-900/60">
          <p className="text-slate-700">Аудитов пока нет.</p>
          <p className="mt-1 text-sm text-slate-500">Запустите первый аудит в форме слева.</p>
        </div>
      ) : null}

      {!loading && !error && audits.length > 0 ? (
        <div className="space-y-3">
          {audits.map((audit, index) => (
            <article
              key={audit.id}
              className="group motion-fade-up rounded-2xl border border-slate-200 bg-white/85 p-4 transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_10px_24px_-20px_rgba(8,145,178,0.9)] dark:border-slate-700/70 dark:bg-slate-900/70 dark:hover:border-cyan-500/50 dark:hover:shadow-[0_12px_26px_-20px_rgba(34,211,238,0.55)]"
              style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/audits/${audit.id}`} className="block">
                    <p className="truncate text-base font-semibold text-slate-900 hover:text-cyan-700 dark:text-slate-100 dark:hover:text-cyan-300">{audit.domain}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      HTTP {audit.server_status_code ?? "-"} - {audit.response_time_ms ?? "-"} мс
                    </p>
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <span className={getStatusStyle(audit.status)}>{getStatusLabel(audit.status)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDelete(audit.id)
                    }}
                    disabled={deletingId === audit.id}
                    aria-label={deletingId === audit.id ? "Удаление аудита" : "Удалить аудит"}
                    title={deletingId === audit.id ? "Удаление..." : "Удалить аудит"}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-300 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-700/60 dark:bg-rose-950/45 dark:text-rose-300 dark:hover:bg-rose-900/60"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">{deletingId === audit.id ? "Удаление..." : "Удалить"}</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-1">Создан: {formatDateTime(audit.created_at)}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  Предупреждений: {audit.warnings?.length ?? 0}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
