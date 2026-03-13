"use client"

import Link from "next/link"
import { CircleHelp } from "lucide-react"
import { use, useEffect, useState } from "react"

import { DeleteAuditButton } from "@/components/DeleteAuditButton"
import { getAudit, type AuditPayload } from "@/lib/api"

type AuditPageProps = {
  params: Promise<{
    id: string
  }>
}

type DuplicateCheck = {
  path: string
  url: string
  status_code: number | null
  final_url: string | null
  redirect_count: number
  is_duplicate: boolean
}

type MarkupCheck = {
  schema_org_found?: boolean
  schema_org_types?: string[]
  opengraph_found?: boolean
  opengraph_types?: string[]
}

type PageResourceItem = {
  url?: string
  type?: string
  size_bytes?: number | null
  status_code?: number | null
  error?: string
}

type PageWeightCheck = {
  html_transfer_bytes?: number | null
  html_uncompressed_bytes?: number | null
  total_transfer_bytes?: number | null
  total_transfer_kb?: number | null
  resource_count_found?: number | null
  resource_count_checked?: number | null
  truncated?: boolean | null
  resources?: PageResourceItem[]
  warnings?: string[]
}

type ServerSecurityHeader = {
  header?: string
  present?: boolean
  value?: string
}

type ServerInfoCheck = {
  headers?: {
    server?: string
    x_powered_by?: string
    via?: string
    cf_cache_status?: string
  }
  ip_addresses?: string[]
  security_headers?: Record<string, ServerSecurityHeader>
  missing_security_headers?: string[]
}

type SslCertificateCheck = {
  valid_now?: boolean | null
  issuer?: string
  subject?: string
  not_before?: string | null
  not_after?: string | null
  days_until_expiration?: number | null
}

type DomainInfoCheck = {
  registration_date?: string | null
  expiration_date?: string | null
  age_days?: number | null
  days_until_expiration?: number | null
  registrar?: string
  dnssec?: boolean | null
  nameservers?: string[]
}

type SiteChecksShape = {
  checks?: Record<string, unknown>
  warnings?: string[]
}

type SiteChecksData = {
  protocols?: {
    http_to_https?: boolean | null
  }
  www_redirect?: {
    can_determine?: boolean | null
    is_ok?: boolean | null
    warnings?: string[]
  }
  robots?: {
    found?: boolean | null
    disallow_root?: boolean | null
    has_sitemap?: boolean | null
  }
  homepage_duplicates?: {
    duplicates_found?: boolean | null
    checks?: DuplicateCheck[]
    duplicates?: string[]
  }
  error_404?: {
    is_valid_404?: boolean | null
    has_home_link?: boolean | null
  }
  encoding?: {
    http_charset?: string | null
    html_charset?: string | null
  }
  markup?: MarkupCheck
  page_weight?: PageWeightCheck
  server_info?: ServerInfoCheck
  ssl_certificate?: SslCertificateCheck
  domain_info?: DomainInfoCheck
}

type SeoHint = {
  description: string
  impact: string
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function BoolBadge({ value, dangerWhenTrue = false }: { value: boolean; dangerWhenTrue?: boolean }) {
  const isGood = dangerWhenTrue ? !value : value
  return (
    <span className={isGood ? "status-pill status-pill-success" : "status-pill status-pill-danger"}>
      {value ? "Да" : "Нет"}
    </span>
  )
}

function CheckStateBadge({
  value,
  unknownLabel,
}: {
  value: boolean | null | undefined
  unknownLabel: string
}) {
  if (value == null) {
    return <span className="status-pill status-pill-neutral">{unknownLabel}</span>
  }

  return <BoolBadge value={value} />
}

function InfoTooltip({ description, impact }: SeoHint) {
  return (
    <span className="group/tooltip relative z-20 inline-flex align-middle focus-within:z-30 hover:z-30">
      <button
        type="button"
        aria-label="Пояснение к метрике"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:text-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 dark:text-slate-500 dark:hover:text-cyan-300"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>
      <span className="pointer-events-none invisible absolute left-0 top-full z-[250] mt-2 w-72 rounded-xl border border-slate-200 bg-white/95 p-3 text-left text-xs normal-case leading-5 text-slate-700 opacity-0 shadow-xl transition-all group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100 dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-200">
        <span className="block font-semibold text-slate-900 dark:text-slate-100">Что проверяем</span>
        <span className="mt-1 block">{description}</span>
        <span className="mt-2 block font-semibold text-slate-900 dark:text-slate-100">Влияние на SEO</span>
        <span className="mt-1 block">{impact}</span>
      </span>
    </span>
  )
}

function LabelWithHint({
  label,
  hint,
}: {
  label: string
  hint?: SeoHint
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      {hint ? <InfoTooltip description={hint.description} impact={hint.impact} /> : null}
    </span>
  )
}

function getAuditStatusStyle(status: string) {
  if (status === "done") return "status-pill status-pill-success"
  if (status === "running") return "status-pill status-pill-warning"
  if (status === "error") return "status-pill status-pill-danger"
  return "status-pill status-pill-neutral"
}

function getAuditStatusLabel(status: string) {
  if (status === "done") return "Завершен"
  if (status === "running") return "В работе"
  if (status === "error") return "Ошибка"
  return "В очереди"
}

function FieldItem({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  const normalizedLabel =
    typeof label === "string"
      ? (() => {
        const meta = fieldLabelMeta[label]
        return <LabelWithHint label={meta?.label ?? label} hint={meta?.hint} />
      })()
      : label

  return (
    <div className="relative z-0 rounded-xl border border-slate-200 bg-white/80 p-3 hover:z-10 focus-within:z-10 dark:border-slate-700/70 dark:bg-slate-900/70">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{normalizedLabel}</p>
      <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  )
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatBytes(value: number | null | undefined) {
  if (value == null) return "-"
  return `${(value / 1024).toFixed(1)} KB`
}

function translateWarning(warning: string) {
  const translations: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^Could not reliably verify WWW redirect$/, () => "Не удалось надёжно проверить WWW-редирект"],
    [/^WWW and non-WWW do not canonicalize to one host$/, () => "Версии с WWW и без WWW не сводятся к одному хосту"],
    [/^No proper redirect from HTTP to HTTPS$/, () => "Нет корректного редиректа с HTTP на HTTPS"],
    [/^Found homepage duplicates: (\d+)$/, (match) => `Найдены дубли главной страницы: ${match[1]}`],
    [/^Resource check limited to first (\d+) URLs$/, (match) => `Проверка ресурсов ограничена первыми ${match[1]} URL`],
    [/^Large page weight: ([\d.]+) KB$/, (match) => `Большой вес страницы: ${match[1]} KB`],
    [/^Missing important security headers: (.+)$/, (match) => `Отсутствуют важные защитные заголовки: ${match[1]}`],
    [/^Domain registration expires in less than 14 days$/, () => "Срок регистрации домена истекает менее чем через 14 дней"],
    [/^Domain registration expires in less than 30 days$/, () => "Срок регистрации домена истекает менее чем через 30 дней"],
    [/^Domain registration is expired$/, () => "Срок регистрации домена уже истёк"],
    [/^Could not fetch robots\.txt$/, () => "Не удалось получить robots.txt"],
    [/^robots\.txt not found$/, () => "Файл robots.txt не найден"],
    [/^robots\.txt has no sitemap$/, () => "В robots.txt не указан sitemap"],
    [/^robots\.txt returned HTTP (\d+)$/, (match) => `robots.txt вернул HTTP ${match[1]}`],
    [/^Found Disallow: \/ for User-agent: \*$/, () => "Найден Disallow: / для User-agent: *"],
    [/^Non-existing page does not return 404$/, () => "Несуществующая страница не возвращает 404"],
    [/^404 page has no link to homepage$/, () => "На странице 404 нет ссылки на главную"],
    [/^HTTP header has no charset$/, () => "В HTTP-заголовке не указана кодировка"],
    [/^HTML has no charset$/, () => "В HTML не указана кодировка"],
    [/^HTTP and HTML charset do not match$/, () => "Кодировка в HTTP и HTML не совпадает"],
    [/^Could not fetch page to measure weight$/, () => "Не удалось загрузить страницу для измерения веса"],
    [/^Main page is not HTML, resource weight not calculated$/, () => "Главная страница не является HTML, вес ресурсов не рассчитан"],
    [/^Failed to measure (\d+) resources$/, (match) => `Не удалось измерить ${match[1]} ресурсов`],
    [/^Server exposes X-Powered-By header$/, () => "Сервер раскрывает заголовок X-Powered-By"],
    [/^Could not read SSL certificate$/, () => "Не удалось прочитать SSL-сертификат"],
    [/^SSL certificate was not returned$/, () => "SSL-сертификат не был получен"],
    [/^Certificate is currently invalid$/, () => "Сертификат сейчас недействителен"],
    [/^SSL certificate is expired$/, () => "SSL-сертификат просрочен"],
    [/^SSL certificate expires in less than 14 days$/, () => "Срок действия SSL-сертификата истекает менее чем через 14 дней"],
    [/^SSL certificate expires in less than 30 days$/, () => "Срок действия SSL-сертификата истекает менее чем через 30 дней"],
    [/^Could not parse SSL validity dates$/, () => "Не удалось разобрать сроки действия SSL-сертификата"],
    [/^Could not fetch domain RDAP data$/, () => "Не удалось получить RDAP-данные домена"],
    [/^Could not determine domain registration date$/, () => "Не удалось определить дату регистрации домена"],
    [/^Could not determine domain expiration date$/, () => "Не удалось определить дату окончания регистрации домена"],
  ]

  for (const [pattern, formatter] of translations) {
    const match = warning.match(pattern)
    if (match) {
      return formatter(match)
    }
  }

  return warning
}

function TypeBadges({ types }: { types: string[] }) {
  if (!types.length) {
    return <span className="text-slate-500 dark:text-slate-400">-</span>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {types.map((typeValue) => (
        <span
          key={typeValue}
          className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-950/50 dark:text-cyan-200"
        >
          {typeValue}
        </span>
      ))}
    </div>
  )
}

const pageMetricHints = {
  httpStatus: {
    description: "HTTP-статус финальной страницы после всех редиректов.",
    impact: "Коды 200 помогают индексировать страницу, а 4xx/5xx мешают обходу и ранжированию.",
  },
  responseTime: {
    description: "Сколько времени сервер тратит на ответ странице.",
    impact: "Медленный ответ ухудшает crawl budget и пользовательские сигналы.",
  },
  finalUrl: {
    description: "Куда в итоге попадает бот после всех перенаправлений.",
    impact: "Показывает канонический адрес и помогает найти лишние цепочки редиректов.",
  },
  indexable: {
    description: "Можно ли индексировать страницу с учётом базовых SEO-сигналов.",
    impact: "Неиндексируемые страницы не попадут в поиск или будут хуже обновляться.",
  },
  createdAt: {
    description: "Когда этот аудит был создан.",
    impact: "Помогает оценить актуальность результатов проверки.",
  },
  updatedAt: {
    description: "Когда результаты аудита обновлялись в последний раз.",
    impact: "Важно для понимания, насколько свежи найденные проблемы.",
  },
  title: {
    description: "Содержимое тега title страницы.",
    impact: "Title влияет на релевантность документа и на сниппет в поиске.",
  },
  h1: {
    description: "Главный заголовок страницы H1.",
    impact: "Помогает поисковикам понять тему страницы и структуру контента.",
  },
  description: {
    description: "Содержимое meta description.",
    impact: "Прямо не ранжирует, но влияет на CTR сниппета в выдаче.",
  },
  canonical: {
    description: "Адрес из rel=canonical, если он задан.",
    impact: "Помогает объединять дубли и передавать сигнал на нужную страницу.",
  },
  metaRobots: {
    description: "Значение meta robots на странице.",
    impact: "Может запретить индексацию или передачу ссылочного веса.",
  },
  lastModified: {
    description: "Заголовок или дата последнего изменения страницы.",
    impact: "Помогает ботам понимать свежесть документа и необходимость переобхода.",
  },
  httpToHttps: {
    description: "Есть ли корректный редирект с HTTP на HTTPS.",
    impact: "Без него возможны дубли страниц и проблемы с канонизацией.",
  },
  wwwRedirect: {
    description: "Сводятся ли версии с www и без www к одному хосту.",
    impact: "Непоследовательность создаёт дубли и размазывает SEO-сигналы между версиями сайта.",
  },
  robotsFound: {
    description: "Доступен ли файл robots.txt по стандартному пути.",
    impact: "Без robots.txt сложнее управлять обходом и сообщать о sitemap.",
  },
  robotsDisallowRoot: {
    description: "Есть ли запрет Disallow: / для User-agent: *.",
    impact: "Такой запрет может полностью закрыть сайт от обхода поисковыми роботами.",
  },
  robotsSitemap: {
    description: "Указан ли sitemap внутри robots.txt.",
    impact: "Ускоряет обнаружение новых и обновлённых страниц.",
  },
  homepageDuplicates: {
    description: "Отдают ли альтернативные URL главной отдельные копии контента.",
    impact: "Дубли главной страницы мешают канонизации и размывают вес ссылок.",
  },
  schemaFound: {
    description: "Есть ли на странице структурированные данные Schema.org.",
    impact: "Разметка помогает поисковикам понять сущности и может улучшить rich results.",
  },
  ogFound: {
    description: "Есть ли Open Graph метаданные.",
    impact: "Для SEO это косвенный сигнал, но он влияет на предпросмотр и CTR в соцсетях и мессенджерах.",
  },
  valid404: {
    description: "Возвращает ли несуществующая страница HTTP 404.",
    impact: "Некорректные soft 404 засоряют индекс и тратят crawl budget.",
  },
  homeLink404: {
    description: "Есть ли на странице 404 ссылка на главную.",
    impact: "Улучшает навигацию и поведенческие сигналы после ошибки.",
  },
  httpCharset: {
    description: "Кодировка, объявленная в HTTP-заголовке Content-Type.",
    impact: "Ошибки кодировки могут ломать текст и мешать корректной обработке контента.",
  },
  htmlCharset: {
    description: "Кодировка, указанная в HTML-документе.",
    impact: "Должна совпадать с HTTP-заголовком, чтобы страница читалась без артефактов.",
  },
  schemaTypes: {
    description: "Какие типы сущностей объявлены в Schema.org разметке.",
    impact: "Показывает, понимают ли поисковики структуру страницы и объекты на ней.",
  },
  ogTypes: {
    description: "Какие типы Open Graph указаны на странице.",
    impact: "Помогает понять, как страница будет интерпретироваться внешними платформами.",
  },
  sslValidNow: {
    description: "Валиден ли SSL-сертификат на момент проверки.",
    impact: "Проблемы с SSL подрывают доверие, мешают доступности сайта и ухудшают индексацию.",
  },
  sslExpiresIn: {
    description: "Сколько дней осталось до окончания действия сертификата.",
    impact: "Истекающий сертификат несёт риск потери доступности для ботов и пользователей.",
  },
  sslIssuer: {
    description: "Кем выпущен текущий SSL-сертификат.",
    impact: "Полезно для диагностики инфраструктуры и доверия к сертификату.",
  },
  sslNotBefore: {
    description: "Дата начала действия SSL-сертификата.",
    impact: "Помогает проверить, не используется ли ещё неактивный сертификат.",
  },
  sslNotAfter: {
    description: "Дата окончания действия SSL-сертификата.",
    impact: "Нужно контролировать, чтобы сайт не выпал из индекса из-за просроченного SSL.",
  },
  registrar: {
    description: "Через какого регистратора оформлен домен.",
    impact: "На ранжирование почти не влияет, но важно для управления рисками домена.",
  },
  domainAge: {
    description: "Примерный возраст домена по регистрационным данным.",
    impact: "Старый домен не гарантирует позиции, но помогает оценить историю проекта.",
  },
  domainExpiresIn: {
    description: "Через сколько дней истекает регистрация домена.",
    impact: "Просрочка домена критична: сайт может исчезнуть и потерять весь SEO-трафик.",
  },
  dnssec: {
    description: "Подписана ли DNS-зона с помощью DNSSEC.",
    impact: "Это больше про безопасность и доверие к инфраструктуре, чем про прямое ранжирование.",
  },
  htmlWeight: {
    description: "Размер HTML-документа без учёта внешних ресурсов.",
    impact: "Слишком тяжёлый HTML замедляет загрузку и обход страницы.",
  },
  totalWeight: {
    description: "Оценочный общий вес страницы вместе с ресурсами.",
    impact: "Большой вес ухудшает скорость, Core Web Vitals и эффективность обхода.",
  },
  checkedResources: {
    description: "Сколько внешних ресурсов удалось измерить по сравнению с найденными.",
    impact: "Показывает полноту оценки веса страницы и помогает найти проблемные ресурсы.",
  },
  serverHeader: {
    description: "Значение HTTP-заголовка Server.",
    impact: "На SEO почти не влияет, но помогает понять конфигурацию сервера и диагностировать проблемы.",
  },
  poweredBy: {
    description: "Значение заголовка X-Powered-By, если сервер его раскрывает.",
    impact: "На SEO напрямую не влияет, но может указывать на лишнее раскрытие технологий.",
  },
  ipAddresses: {
    description: "IP-адреса, на которые резолвится хост.",
    impact: "Полезно для диагностики CDN, балансировки и сетевых проблем, влияющих на доступность.",
  },
  nameservers: {
    description: "DNS-серверы, обслуживающие домен.",
    impact: "Ошибки в DNS влияют на доступность сайта для ботов и пользователей.",
  },
  missingSecurityHeaders: {
    description: "Каких защитных HTTP-заголовков не хватает на сайте.",
    impact: "Это косвенный SEO-фактор: безопасность влияет на доверие, стабильность и отсутствие вредоносных рисков.",
  },
  topResources: {
    description: "Какие ресурсы сильнее всего утяжеляют загрузку страницы.",
    impact: "Помогает находить файлы, из-за которых падает скорость и страдают пользовательские метрики.",
  },
} satisfies Record<string, SeoHint>

const fieldLabelMeta: Record<string, { label?: string; hint?: SeoHint }> = {
  "HTTP код": { hint: pageMetricHints.httpStatus },
  "Время ответа": { hint: pageMetricHints.responseTime },
  "Финальный URL": { hint: pageMetricHints.finalUrl },
  "Индексируемость": { hint: pageMetricHints.indexable },
  "Создан": { hint: pageMetricHints.createdAt },
  "Обновлён": { hint: pageMetricHints.updatedAt },
  Title: { label: "Тег Title", hint: pageMetricHints.title },
  H1: { hint: pageMetricHints.h1 },
  Description: { label: "Описание", hint: pageMetricHints.description },
  Canonical: { hint: pageMetricHints.canonical },
  "Meta robots": { label: "Meta robots", hint: pageMetricHints.metaRobots },
  "Last-Modified": { hint: pageMetricHints.lastModified },
  "HTTP → HTTPS": { label: "HTTP -> HTTPS", hint: pageMetricHints.httpToHttps },
  "HTTP -> HTTPS": { label: "HTTP -> HTTPS", hint: pageMetricHints.httpToHttps },
  "WWW redirect": { label: "WWW-редирект", hint: pageMetricHints.wwwRedirect },
  "robots.txt найден": { hint: pageMetricHints.robotsFound },
  "Disallow / в robots": { label: "Disallow / в robots.txt", hint: pageMetricHints.robotsDisallowRoot },
  "Sitemap в robots": { label: "Sitemap в robots.txt", hint: pageMetricHints.robotsSitemap },
  "Дубли главной": { hint: pageMetricHints.homepageDuplicates },
  "Schema.org найден": { hint: pageMetricHints.schemaFound },
  "Open Graph найден": { hint: pageMetricHints.ogFound },
  "404 код корректный": { label: "Корректный 404", hint: pageMetricHints.valid404 },
  "Ссылка на главную с 404": { hint: pageMetricHints.homeLink404 },
  "Кодировка HTTP": { hint: pageMetricHints.httpCharset },
  "Кодировка HTML": { hint: pageMetricHints.htmlCharset },
  "Schema.org types": { label: "Типы Schema.org", hint: pageMetricHints.schemaTypes },
  "Open Graph types": { label: "Типы Open Graph", hint: pageMetricHints.ogTypes },
  "SSL валиден сейчас": { hint: pageMetricHints.sslValidNow },
  "SSL истекает через": { hint: pageMetricHints.sslExpiresIn },
  "SSL issuer": { label: "Издатель SSL", hint: pageMetricHints.sslIssuer },
  "SSL not before": { label: "SSL действует с", hint: pageMetricHints.sslNotBefore },
  "SSL not after": { label: "SSL действует до", hint: pageMetricHints.sslNotAfter },
  Registrar: { label: "Регистратор", hint: pageMetricHints.registrar },
  "Возраст домена": { hint: pageMetricHints.domainAge },
  "Домен истекает через": { hint: pageMetricHints.domainExpiresIn },
  DNSSEC: { hint: pageMetricHints.dnssec },
  "HTML вес": { hint: pageMetricHints.htmlWeight },
  "Transfer вес (оценка)": { label: "Общий вес загрузки", hint: pageMetricHints.totalWeight },
  "Ресурсы (checked/found)": { label: "Проверенные ресурсы", hint: pageMetricHints.checkedResources },
  Server: { label: "Заголовок Server", hint: pageMetricHints.serverHeader },
  "X-Powered-By": { hint: pageMetricHints.poweredBy },
  "IP адреса": { hint: pageMetricHints.ipAddresses },
}

export default function AuditPage({ params }: AuditPageProps) {
  const { id } = use(params)
  const [audit, setAudit] = useState<AuditPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadAudit = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAudit(id)
        if (!active) return
        setAudit(data)
      } catch (fetchError) {
        if (!active) return
        const message = fetchError instanceof Error ? fetchError.message : "Не удалось загрузить аудит"
        setError(message)
        setAudit(null)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadAudit()

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <main className="page-shell">
        <section className="surface-card motion-fade-up">
          <Link
            href="/"
            className="inline-flex text-sm text-cyan-700 hover:text-cyan-800 hover:underline dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            ← К списку аудитов
          </Link>
          <h1 className="section-title mt-4 text-3xl sm:text-4xl">Загрузка аудита</h1>
          <div className="mt-4 space-y-3">
            <div className="h-12 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70 dark:border-slate-700/70 dark:bg-slate-800/70" />
            <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70 dark:border-slate-700/70 dark:bg-slate-800/70" />
            <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70 dark:border-slate-700/70 dark:bg-slate-800/70" />
          </div>
        </section>
      </main>
    )
  }

  if (error || !audit) {
    return (
      <main className="page-shell">
        <section className="surface-card motion-fade-up">
          <Link
            href="/"
            className="inline-flex text-sm text-cyan-700 hover:text-cyan-800 hover:underline dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            ← К списку аудитов
          </Link>
          <h1 className="section-title mt-4 text-3xl sm:text-4xl">Аудит недоступен</h1>
          <p className="mt-3 max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700/50 dark:bg-rose-950/40 dark:text-rose-200">
            {error ?? "Не удалось загрузить аудит"}
          </p>
        </section>
      </main>
    )
  }

  const siteChecksRoot = asRecord(audit.site_checks) as SiteChecksShape
  const siteChecks = asRecord(siteChecksRoot.checks ?? siteChecksRoot) as SiteChecksData

  const homepageDuplicates = asRecord(siteChecks.homepage_duplicates)
  const duplicateChecks: DuplicateCheck[] = asArray<DuplicateCheck>(homepageDuplicates.checks)
  const duplicateUrls: string[] = asArray<string>(homepageDuplicates.duplicates)
  const markupChecks: MarkupCheck = asRecord(siteChecks.markup) as MarkupCheck
  const pageWeight: PageWeightCheck = asRecord(siteChecks.page_weight) as PageWeightCheck
  const serverInfo: ServerInfoCheck = asRecord(siteChecks.server_info) as ServerInfoCheck
  const sslCertificate: SslCertificateCheck = asRecord(siteChecks.ssl_certificate) as SslCertificateCheck
  const domainInfo: DomainInfoCheck = asRecord(siteChecks.domain_info) as DomainInfoCheck
  const auditWarnings: string[] = asArray<string>(audit.warnings)
  const siteWarnings: string[] = asArray<string>(siteChecksRoot.warnings)

  const topResources = asArray<PageResourceItem>(pageWeight.resources)
    .filter((item) => typeof item.size_bytes === "number")
    .sort((a, b) => (b.size_bytes ?? 0) - (a.size_bytes ?? 0))
    .slice(0, 6)

  const missingSecurityHeaders = asArray<string>(serverInfo.missing_security_headers)
  const nameservers = asArray<string>(domainInfo.nameservers)

  return (
    <main className="page-shell space-y-6">
      <section className="surface-card motion-fade-up relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-500/25" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Link href="/" className="inline-flex text-sm text-cyan-700 hover:text-cyan-800 hover:underline dark:text-cyan-300 dark:hover:text-cyan-200">
              ← К списку аудитов
            </Link>
            <h1 className="section-title text-3xl sm:text-4xl">SEO Аудит</h1>
            <p className="max-w-3xl break-all text-slate-600 dark:text-slate-300">{audit.domain}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={getAuditStatusStyle(audit.status)}>{getAuditStatusLabel(audit.status)}</span>
            <DeleteAuditButton auditId={audit.id} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FieldItem label="HTTP код" value={audit.server_status_code ?? "-"} />
          <FieldItem label="Время ответа" value={audit.response_time_ms != null ? `${audit.response_time_ms} мс` : "-"} />
          <FieldItem label="Финальный URL" value={<span className="break-all">{audit.final_url ?? "-"}</span>} />
          <FieldItem label="Индексируемость" value={audit.is_indexable == null ? "-" : audit.is_indexable ? "Да" : "Нет"} />
          <FieldItem label="Создан" value={formatDateTime(audit.created_at)} />
          <FieldItem label="Обновлен" value={formatDateTime(audit.updated_at)} />
        </div>
      </section>

      <section className="surface-card motion-fade-up motion-delay-1">
        <h2 className="section-title">Параметры страницы</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldItem label="Title" value={audit.title || "-"} />
          <FieldItem label="H1" value={audit.h1 || "-"} />
          <FieldItem label="Description" value={audit.meta_description || "-"} />
          <FieldItem label="Canonical" value={<span className="break-all">{audit.canonical || "-"}</span>} />
          <FieldItem label="Meta robots" value={audit.meta_robots || "-"} />
          <FieldItem label="Last-Modified" value={audit.last_modified || "-"} />
        </div>
      </section>

      <section className="surface-card motion-fade-up motion-delay-2">
        <h2 className="section-title">Технические проверки</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldItem
            label="HTTP → HTTPS"
            value={siteChecks?.protocols?.http_to_https == null ? "-" : <BoolBadge value={siteChecks.protocols.http_to_https} />}
          />
          <FieldItem
            label="WWW redirect"
            value={<CheckStateBadge value={siteChecks?.www_redirect?.is_ok} unknownLabel="Не удалось точно проверить" />}
          />
          <FieldItem
            label="robots.txt найден"
            value={siteChecks?.robots?.found == null ? "-" : <BoolBadge value={siteChecks.robots.found} />}
          />
          <FieldItem
            label="Disallow / в robots"
            value={siteChecks?.robots?.disallow_root == null ? "-" : <BoolBadge value={siteChecks.robots.disallow_root} dangerWhenTrue />}
          />
          <FieldItem
            label="Sitemap в robots"
            value={siteChecks?.robots?.has_sitemap == null ? "-" : <BoolBadge value={siteChecks.robots.has_sitemap} />}
          />
          <FieldItem
            label="Дубли главной"
            value={
              siteChecks?.homepage_duplicates?.duplicates_found == null
                ? "-"
                : <BoolBadge value={siteChecks.homepage_duplicates.duplicates_found} dangerWhenTrue />
            }
          />
          <FieldItem
            label="Schema.org найден"
            value={markupChecks.schema_org_found == null ? "-" : <BoolBadge value={markupChecks.schema_org_found} />}
          />
          <FieldItem
            label="Open Graph найден"
            value={markupChecks.opengraph_found == null ? "-" : <BoolBadge value={markupChecks.opengraph_found} />}
          />
          <FieldItem
            label="404 код корректный"
            value={siteChecks?.error_404?.is_valid_404 == null ? "-" : <BoolBadge value={siteChecks.error_404.is_valid_404} />}
          />
          <FieldItem
            label="Ссылка на главную с 404"
            value={siteChecks?.error_404?.has_home_link == null ? "-" : <BoolBadge value={siteChecks.error_404.has_home_link} />}
          />
          <FieldItem label="Кодировка HTTP" value={siteChecks?.encoding?.http_charset ?? "-"} />
          <FieldItem label="Кодировка HTML" value={siteChecks?.encoding?.html_charset ?? "-"} />
        </div>

        {duplicateChecks.length ? (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/70">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left">Путь</th>
                  <th className="px-3 py-2 text-left">URL</th>
                  <th className="px-3 py-2 text-left">HTTP</th>
                  <th className="px-3 py-2 text-left">Финальный URL</th>
                  <th className="px-3 py-2 text-left">Редиректы</th>
                  <th className="px-3 py-2 text-left">Дубль</th>
                </tr>
              </thead>
              <tbody>
                {duplicateChecks.map((item, index) => (
                  <tr key={`${item.url}-${index}`} className="border-t border-slate-200 align-top dark:border-slate-700/70">
                    <td className="px-3 py-2 whitespace-nowrap">{item.path}</td>
                    <td className="px-3 py-2 break-all">{item.url}</td>
                    <td className="px-3 py-2">{item.status_code ?? "-"}</td>
                    <td className="px-3 py-2 break-all">{item.final_url ?? "-"}</td>
                    <td className="px-3 py-2">{item.redirect_count}</td>
                    <td className="px-3 py-2">
                      <BoolBadge value={item.is_duplicate} dangerWhenTrue />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : duplicateUrls.length ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/50">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Дубли главной (URL)</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {duplicateUrls.map((url) => (
                <li key={url} className="break-all rounded-lg border border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900/60">
                  {url}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/50">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
            <LabelWithHint label="Типы разметки" hint={pageMetricHints.schemaTypes} />
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <FieldItem label="Schema.org types" value={<TypeBadges types={markupChecks.schema_org_types ?? []} />} />
            <FieldItem label="Open Graph types" value={<TypeBadges types={markupChecks.opengraph_types ?? []} />} />
          </div>
        </div>
      </section>

      <section className="surface-card motion-fade-up motion-delay-3">
        <h2 className="section-title">Инфраструктура и безопасность</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <FieldItem
            label="SSL валиден сейчас"
            value={sslCertificate.valid_now == null ? "-" : <BoolBadge value={sslCertificate.valid_now} />}
          />
          <FieldItem label="SSL истекает через" value={sslCertificate.days_until_expiration != null ? `${sslCertificate.days_until_expiration} дн.` : "-"} />
          <FieldItem label="SSL issuer" value={sslCertificate.issuer || "-"} />
          <FieldItem label="SSL not before" value={formatDateTime(sslCertificate.not_before)} />
          <FieldItem label="SSL not after" value={formatDateTime(sslCertificate.not_after)} />
          <FieldItem label="Registrar" value={domainInfo.registrar || "-"} />
          <FieldItem label="Возраст домена" value={domainInfo.age_days != null ? `${domainInfo.age_days} дн.` : "-"} />
          <FieldItem label="Домен истекает через" value={domainInfo.days_until_expiration != null ? `${domainInfo.days_until_expiration} дн.` : "-"} />
          <FieldItem label="DNSSEC" value={domainInfo.dnssec == null ? "-" : <BoolBadge value={domainInfo.dnssec} />} />
          <FieldItem label="HTML вес" value={formatBytes(pageWeight.html_uncompressed_bytes)} />
          <FieldItem label="Transfer вес (оценка)" value={formatBytes(pageWeight.total_transfer_bytes)} />
          <FieldItem
            label="Ресурсы (checked/found)"
            value={`${pageWeight.resource_count_checked ?? "-"} / ${pageWeight.resource_count_found ?? "-"}`}
          />
          <FieldItem label="Server" value={serverInfo.headers?.server || "-"} />
          <FieldItem label="X-Powered-By" value={serverInfo.headers?.x_powered_by || "-"} />
          <FieldItem
            label="IP адреса"
            value={asArray<string>(serverInfo.ip_addresses).length ? asArray<string>(serverInfo.ip_addresses).join(", ") : "-"}
          />
        </div>

        {nameservers.length ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/50">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
              <LabelWithHint label="DNS-серверы" hint={pageMetricHints.nameservers} />
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {nameservers.map((ns) => (
                <li key={ns} className="break-all rounded-lg border border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900/60">
                  {ns}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {missingSecurityHeaders.length ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-700/50 dark:bg-amber-950/30">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
              <LabelWithHint label="Отсутствующие защитные заголовки" hint={pageMetricHints.missingSecurityHeaders} />
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-amber-800 dark:text-amber-200">
              {missingSecurityHeaders.map((header) => (
                <li key={header} className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2 dark:border-amber-700/50 dark:bg-slate-900/60">
                  {header}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {topResources.length ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/50">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
              <LabelWithHint label="Самые тяжёлые ресурсы" hint={pageMetricHints.topResources} />
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {topResources.map((resource, index) => (
                <li key={`${resource.url}-${index}`} className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900/60">
                  <p className="break-all">{resource.url ?? "-"}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {resource.type ?? "ресурс"} • {formatBytes(resource.size_bytes ?? null)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="surface-card motion-fade-up motion-delay-2">
          <h2 className="section-title">Предупреждения страницы</h2>
          {auditWarnings.length ? (
            <ul className="mt-3 space-y-2">
              {auditWarnings.map((warning: string, index: number) => (
                <li key={index} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
                  {translateWarning(warning)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Нет предупреждений.</p>
          )}
        </div>

        <div className="surface-card motion-fade-up motion-delay-3">
          <h2 className="section-title">Предупреждения по сайту</h2>
          {siteWarnings.length ? (
            <ul className="mt-3 space-y-2">
              {siteWarnings.map((warning: string, index: number) => (
                <li key={index} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
                  {translateWarning(warning)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Нет предупреждений.</p>
          )}
        </div>
      </section>
    </main>
  )
}
