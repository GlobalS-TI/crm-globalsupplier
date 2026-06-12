import Link from 'next/link'
import type { Route } from 'next'
import { ChevronLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactForm } from '@/components/crm/ContactForm'
import { CompanyRepository } from '@/lib/repositories/supabase/CompanyRepository'
import { CompanyService } from '@/lib/services/CompanyService'
import { createContact } from '../actions'

export const metadata = { title: 'Nuevo contacto — CRM Global Supplier' }

interface PageProps {
  searchParams: Promise<{ company_id?: string }>
}

export default async function NuevoContactoPage({ searchParams }: PageProps) {
  const { company_id } = await searchParams
  const companies = await new CompanyService(new CompanyRepository()).list()

  return (
    <div className="p-8 max-w-2xl">
      <Link href={'/contactos' as Route} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4" />
        Contactos
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm
            action={createContact}
            companies={companies}
            defaultValues={company_id ? { company_id } : undefined}
            submitLabel="Crear contacto"
          />
        </CardContent>
      </Card>
    </div>
  )
}
