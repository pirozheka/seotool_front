const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

export type AuditPayload = {
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

function getApiUrl() {
  return API_URL.replace(/\/+$/, "")
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function normalizeAuditPayload(value: Record<string, unknown>): AuditPayload {
  return {
    ...value,
    warnings: normalizeStringArray(value.warnings),
  } as AuditPayload
}

export async function createAudit(domain: string) {
  const response = await fetch(`${getApiUrl()}/api/audits/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ domain }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data?.domain?.[0] ??
      data?.detail ??
      data?.error ??
      "РћС€РёР±РєР° СЃРѕР·РґР°РЅРёСЏ Р°СѓРґРёС‚Р°"

    throw new Error(message)
  }

  return data
}

export async function getAuditList(): Promise<AuditPayload[]> {
  const response = await fetch(`${getApiUrl()}/api/audits/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data?.detail ??
      data?.error ??
      "РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р°СѓРґРёС‚РѕРІ"

    throw new Error(message)
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data.filter(isRecord).map(normalizeAuditPayload)
}

export async function getAudit(id: string | number): Promise<AuditPayload> {
  try {
    const response = await fetch(`${getApiUrl()}/api/audits/${id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        data?.detail ??
        data?.error ??
        "РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р°СѓРґРёС‚Р°"

      throw new Error(message)
    }

    if (!isRecord(data)) {
      throw new Error("Аудит вернул некорректные данные")
    }

    return normalizeAuditPayload(data)
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error
    }

    throw new Error("РЎРµСЂРІРµСЂ РЅРµРґРѕСЃС‚СѓРїРµРЅ")
  }
}

export async function deleteAudit(id: string | number) {
  const response = await fetch(`${getApiUrl()}/api/audits/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    let data: unknown = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    const body = data as { detail?: string; error?: string } | null
    const message = body?.detail ?? body?.error ?? "РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ Р°СѓРґРёС‚Р°"
    throw new Error(message)
  }
}
