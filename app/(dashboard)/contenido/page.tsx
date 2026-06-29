import { Library } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ContentCategoryRepository, ContentItemRepository } from '@/lib/repositories/supabase/ContentRepository'
import { ContentCategoryNav } from '@/components/crm/ContentCategoryNav'
import { NewItemModal } from '@/components/crm/NewItemModal'
import { ContentItemRow } from '@/components/crm/ContentItemRow'
import type { BusinessUnit } from '@/lib/validations/opportunity'
import type { ContentItemWithRelations } from '@/lib/repositories/interfaces/IContentRepository'

export const metadata = { title: 'Biblioteca de Contenido — CRM Global Supplier' }
export const dynamic  = 'force-dynamic'

const BUSINESS_UNIT_LABELS: Record<BusinessUnit, string> = {
  global_supplier_mty: 'Global Supplier MTY',
  thunder_safety:       'Thunder Safety Solutions',
  thunder_led:          'Thunder LED Lights',
  got_fresh_breath:     'Got Fresh Breath',
  gtx_systems:          'GTX Systems',
  juno_promotional:     'Juno Promotional',
  fire_spot:            'Fire Spot',
}

interface PageProps {
  searchParams: Promise<{ cat?: string }>
}

export default async function ContenidoPage({ searchParams }: PageProps) {
  const { cat } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isContentManager = ['marketing', 'director_general'].includes(profile?.role ?? '')

  const [categories, items] = await Promise.all([
    new ContentCategoryRepository().listAll(),
    cat ? new ContentItemRepository().listAll({ categoryId: cat }) : Promise.resolve<ContentItemWithRelations[]>([]),
  ])

  const selectedCategory = categories.find(c => c.id === cat)

  const grouped = items.reduce<Record<string, ContentItemWithRelations[]>>((acc, item) => {
    if (!acc[item.business_unit]) acc[item.business_unit] = []
    acc[item.business_unit].push(item)
    return acc
  }, {})

  const sortedUnits = (Object.keys(grouped) as BusinessUnit[]).sort((a, b) =>
    (BUSINESS_UNIT_LABELS[a] ?? a).localeCompare(BUSINESS_UNIT_LABELS[b] ?? b)
  )

  return (
    <div className="flex h-full">
      <ContentCategoryNav
        categories={categories}
        selectedId={cat}
        isContentManager={isContentManager}
      />

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {!cat ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <Library className="h-10 w-10 opacity-30" />
            <p className="text-sm">Selecciona una categoría</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h1 className="text-2xl font-bold">{selectedCategory?.nombre ?? 'Contenido'}</h1>
              {isContentManager && <NewItemModal categoryId={cat} />}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                Sin elementos en esta categoría.
                {isContentManager && (
                  <span className="block mt-2 text-primary text-xs">Usa el botón &quot;Nuevo elemento&quot; para agregar el primero.</span>
                )}
              </div>
            ) : (
              sortedUnits.map(unit => (
                <section key={unit} className="space-y-2">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {BUSINESS_UNIT_LABELS[unit] ?? unit}
                  </h2>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {grouped[unit].map(item => (
                          <ContentItemRow
                            key={item.id}
                            item={item}
                            isContentManager={isContentManager}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
