'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteAudit } from "@/lib/api"

type DeleteAuditButtonProps = {
  auditId: number
}

export function DeleteAuditButton({ auditId }: DeleteAuditButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm("Удалить этот аудит?")) return

    try {
      setLoading(true)
      await deleteAudit(auditId)
      router.push("/")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка удаления аудита"
      window.alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleDelete()
      }}
      disabled={loading}
      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-700/50 dark:text-rose-300 dark:hover:bg-rose-950/40"
    >
      {loading ? "Удаление..." : "Удалить аудит"}
    </button>
  )
}
