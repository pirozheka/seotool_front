'use client'

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const THEME_STORAGE_KEY = "one-more-seo-theme"
type Theme = "light" | "dark"

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme
    }
  } catch {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    setTheme(getInitialTheme())
    setMounted(true)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const handleThemeChange = (checked: boolean) => {
    const nextTheme: Theme = checked ? "dark" : "light"
    setTheme(nextTheme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {}
  }

  const isDark = theme === "dark"

  return (
    <div
      className="theme-toggle fixed bottom-4 right-4 z-[100]"
      aria-hidden={!mounted}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-colors",
          isDark ? "text-slate-500" : "text-amber-500"
        )}
      />
      <Switch
        disabled={!mounted}
        checked={isDark}
        onCheckedChange={handleThemeChange}
        aria-label="Toggle theme"
      />
      <Moon
        className={cn(
          "h-4 w-4 transition-colors",
          isDark ? "text-cyan-300" : "text-slate-500"
        )}
      />
    </div>
  )
}
