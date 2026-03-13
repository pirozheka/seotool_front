'use client'

import { createAudit } from "@/lib/api"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Audit } from "@/app/page"

type SiteInputProps = {
  onAuditCreated: (audit: Audit) => void
}

export function SiteInput({ onAuditCreated }: SiteInputProps) {
  const [site, setSite] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!site.trim()) return

    try {
      setLoading(true)
      setError(null)

      const newAudit = await createAudit(site)
      onAuditCreated(newAudit)
      setSite("")
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ошибка при создании аудита")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="surface-card motion-fade-up motion-delay-1 lg:sticky lg:top-6">
      <div className="space-y-2">
        <h2 className="section-title">Новый аудит</h2>
        <p className="section-subtitle">Введите домен и запустите проверку технических параметров сайта.</p>
      </div>

      <div className="mt-5 space-y-3">
        <label htmlFor="site-address" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Адрес сайта
        </label>
        <Input
          id="site-address"
          type="text"
          value={site}
          placeholder="example.com"
          onChange={(e) => setSite(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              void handleSubmit()
            }
          }}
          className="h-11 rounded-xl border-slate-300 bg-white/90 dark:border-slate-600 dark:bg-slate-900/70"
        />
        <p className="text-xs text-slate-500">Можно вводить с протоколом или без него.</p>
      </div>

      <Button
        className="mt-5 h-11 w-full rounded-xl bg-cyan-600 text-white shadow-sm shadow-cyan-700/20 hover:bg-cyan-700 dark:bg-cyan-500 dark:shadow-cyan-950/70 dark:hover:bg-cyan-400"
        onClick={handleSubmit}
        disabled={loading || !site.trim()}
      >
        {loading ? "Проверяем..." : "Запустить аудит"}
      </Button>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </section>
  )
}
