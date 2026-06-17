'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useRef, useCallback, useState, useEffect } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [iconSpin, setIconSpin] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

    const btn = buttonRef.current
    if (btn) {
      const r = btn.getBoundingClientRect()
      document.documentElement.style.setProperty('--theme-x', `${r.left + r.width / 2}px`)
      document.documentElement.style.setProperty('--theme-y', `${r.top + r.height / 2}px`)
    }

    setIconSpin(false)
    requestAnimationFrame(() => setIconSpin(true))

    if (document.startViewTransition) {
      document.startViewTransition(() => setTheme(newTheme))
    } else {
      setTheme(newTheme)
    }
  }, [resolvedTheme, setTheme])

  if (!mounted) {
    return (
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" disabled>
        <Moon className="h-4 w-4 mr-2 opacity-0" />
        Tema
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="ghost"
      size="sm"
      className="w-full justify-start text-muted-foreground"
      onClick={toggleTheme}
    >
      <span
        className={iconSpin ? 'theme-icon-spinning' : 'inline-flex items-center'}
        onAnimationEnd={() => setIconSpin(false)}
      >
        {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
      </span>
      {isDark ? 'Tema claro' : 'Tema oscuro'}
    </Button>
  )
}
