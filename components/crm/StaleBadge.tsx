import { Badge } from '@/components/ui/badge'

export function StaleBadge() {
  return (
    <Badge
      variant="destructive"
      className="text-[10px] px-1.5 py-0 h-4 shrink-0"
    >
      Sin actividad
    </Badge>
  )
}
