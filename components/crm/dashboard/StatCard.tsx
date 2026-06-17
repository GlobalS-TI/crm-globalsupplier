import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title:       string
  value:       string | number
  sub?:        string
  trend?:      number   // positive = up, negative = down, 0 = flat
  trendLabel?: string
  className?:  string
  delay?:      number   // stagger delay in ms
}

export function StatCard({ title, value, sub, trend, trendLabel, className, delay }: StatCardProps) {
  const trendColor = trend === undefined || trend === 0
    ? 'text-muted-foreground'
    : trend > 0
      ? 'text-emerald-600'
      : 'text-destructive'

  const trendIcon = trend === undefined || trend === 0 ? '' : trend > 0 ? '▲' : '▼'
  const trendPct  = trend !== undefined && trend !== 0
    ? ` ${trendIcon} ${Math.abs(Math.round(trend))}%`
    : ''

  return (
    <Card
      className={cn('animate-fade-up hover:-translate-y-0.5 hover:shadow-md transition-all duration-200', className)}
      style={delay ? { '--stagger': `${delay}ms` } as React.CSSProperties : undefined}
    >
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {(sub || trendPct) && (
          <p className="text-xs mt-1 flex items-center gap-1">
            {trendPct && <span className={cn('font-medium', trendColor)}>{trendPct}</span>}
            {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
            {sub && !trendLabel && <span className="text-muted-foreground">{sub}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
