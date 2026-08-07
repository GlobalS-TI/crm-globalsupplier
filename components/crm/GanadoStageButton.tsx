'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GanadoTransitionModal } from '@/components/crm/GanadoTransitionModal'

interface Props {
  oppId:            string
  oppName:          string
  moneda?:          'MXN' | 'USD'
  cotizacionPath?:  string | null
  ordenCompraPath?: string | null
}

export function GanadoStageButton({ oppId, oppName, moneda = 'MXN', cotizacionPath, ordenCompraPath }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Ganado</Button>
      <GanadoTransitionModal
        open={open}
        oppId={oppId}
        oppName={oppName}
        moneda={moneda}
        cotizacionPath={cotizacionPath}
        ordenCompraPath={ordenCompraPath}
        onConfirm={() => { setOpen(false); router.refresh() }}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
