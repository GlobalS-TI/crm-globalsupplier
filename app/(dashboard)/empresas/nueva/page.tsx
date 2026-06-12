import Link from 'next/link'
import type { Route } from 'next'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyForm } from '@/components/crm/CompanyForm'
import { createCompany } from '../actions'

export const metadata = { title: 'Nueva empresa — CRM Global Supplier' }

export default function NuevaEmpresaPage() {
  return (
    <div className="p-8 max-w-2xl">
      <Link href={'/empresas' as Route} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4" />
        Empresas
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nueva empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm action={createCompany} submitLabel="Crear empresa" />
        </CardContent>
      </Card>
    </div>
  )
}
