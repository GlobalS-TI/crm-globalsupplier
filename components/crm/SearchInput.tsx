'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import type { Route } from 'next'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface Props {
  placeholder?: string
}

export function SearchInput({ placeholder = 'Buscar…' }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      next.set('q', e.target.value)
    } else {
      next.delete('q')
    }
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}` as Route)
    })
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-8 w-64"
        placeholder={placeholder}
        defaultValue={searchParams.get('q') ?? ''}
        onChange={handleChange}
      />
    </div>
  )
}
