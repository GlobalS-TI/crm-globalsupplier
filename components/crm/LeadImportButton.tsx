'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { bulkImportLeads } from '@/app/(dashboard)/leads/actions'

type ParsedRow = {
  nombre:         string
  empresa?:       string
  email?:         string
  telefono?:      string
  requerimientos?: string
}

// Normalize: remove accents, lowercase, trim
function normalize(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Case-insensitive, accent-insensitive column alias detection
function findCol(headers: string[], ...aliases: string[]): string | undefined {
  const normAliases = aliases.map(normalize)
  return headers.find(h => normAliases.includes(normalize(h)))
}

// Scan raw rows (as arrays) to find the first row that looks like a header
// Returns the row index, or -1 if not found
const HEADER_SIGNALS = ['nombre', 'name', 'contacto', 'contact', 'email', 'correo']
function detectHeaderRow(rawRows: unknown[][]): number {
  return rawRows.findIndex(row =>
    row.some(cell =>
      HEADER_SIGNALS.some(s => normalize(String(cell ?? '')).includes(s))
    )
  )
}

// Cells can be numbers (e.g. phone numbers stored as numeric in Excel) — always stringify
function cell(raw: Record<string, unknown>, col: string | undefined): string {
  if (!col) return ''
  const v = raw[col]
  const s = v != null ? String(v).trim() : ''
  // Skip bare paths (Monday.com protected file identifiers) but keep http URLs so they show as links
  if (s.startsWith('/') || s.startsWith('v/protected')) return ''
  return s
}

function mapRow(raw: Record<string, unknown>, headers: string[]): ParsedRow | null {
  const nombreCol  = findCol(headers, 'nombre', 'name', 'contacto', 'contact')
  const empresaCol = findCol(headers, 'empresa', 'company', 'compañia', 'compania', 'organization')
  const emailCol   = findCol(headers, 'email', 'correo', 'correo electronico', 'correo electrónico', 'mail', 'e-mail')
  const telCol     = findCol(headers, 'telefono', 'teléfono', 'phone', 'tel', 'mobile', 'celular')
  const reqCol     = findCol(headers, 'requerimientos', 'requirements', 'notas', 'notes', 'descripcion', 'description', 'observaciones')

  const nombre = cell(raw, nombreCol)
  if (!nombre) return null

  return {
    nombre,
    empresa:        cell(raw, empresaCol) || undefined,
    email:          cell(raw, emailCol)   || undefined,
    telefono:       cell(raw, telCol)     || undefined,
    requerimientos: cell(raw, reqCol)     || undefined,
  }
}

async function parseFile(file: File): Promise<ParsedRow[]> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header:        true,
        skipEmptyLines: true,
        complete: result => {
          const headers = result.meta.fields ?? []
          const rows = (result.data as Record<string, unknown>[])
            .map(r => mapRow(r, headers))
            .filter((r): r is ParsedRow => r !== null)
          if (result.data.length > 0 && rows.length === 0) {
            reject(new Error(
              `No se encontró columna "Nombre" en el archivo. Columnas detectadas: ${headers.join(', ')}`
            ))
          } else {
            resolve(rows)
          }
        },
        error: reject,
      })
    })
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer   = await file.arrayBuffer()
    // XLSX.read with type:'array' requires Uint8Array, not ArrayBuffer
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
    const sheet    = workbook.Sheets[workbook.SheetNames[0]]

    // Scan raw rows to skip leading title/subtitle rows (e.g. Monday.com exports)
    const rawArrays = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
    const headerIdx = detectHeaderRow(rawArrays)

    // Parse using the detected header row as the starting point
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      range:  headerIdx >= 0 ? headerIdx : 0,
    })
    const headers = raw.length > 0 ? Object.keys(raw[0]) : []
    const rows    = raw
      .map(r => mapRow(r, headers))
      .filter((r): r is ParsedRow => r !== null)

    if (raw.length > 0 && rows.length === 0) {
      throw new Error(
        `No se encontró columna "Nombre" en el archivo. Columnas detectadas: ${headers.join(', ')}`
      )
    }
    return rows
  }

  throw new Error('Formato no soportado. Usa .csv o .xlsx')
}

interface Props {
  sectionId: string
}

export function LeadImportButton({ sectionId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen]       = useState(false)
  const [rows, setRows]       = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState('')
  const [fileName, setFileName]     = useState('')
  const [result, setResult]         = useState<{ count: number } | null>(null)
  const [isPending, start]    = useTransition()

  function reset() {
    setRows([])
    setParseError('')
    setFileName('')
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset()
    setOpen(v)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    setResult(null)
    setFileName(file.name)
    try {
      const parsed = await parseFile(file)
      setRows(parsed)
    } catch (err) {
      setParseError((err as Error).message)
      setRows([])
    }
  }

  function handleImport() {
    start(async () => {
      const res = await bulkImportLeads(rows, sectionId)
      if ('error' in res) {
        setParseError(res.error)
      } else {
        setResult(res)
        setRows([])
      }
    })
  }

  const previewRows = rows.slice(0, 5)
  const extraCount  = rows.length - previewRows.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1.5" />
          Importar
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Importar leads</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File picker — only visible when no file loaded yet */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          {!result && rows.length === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md py-8 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <Upload className="h-6 w-6" />
              <span>Selecciona un archivo <strong>.csv</strong> o <strong>.xlsx</strong></span>
              <span className="text-xs">
                Columnas esperadas: Nombre, Empresa, Email, Teléfono, Requerimientos
              </span>
            </button>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}

          {/* Success */}
          {result && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded px-3 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Se importaron <strong>{result.count}</strong> leads correctamente.
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && !result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {rows.length} leads detectados en <span className="text-muted-foreground">{fileName}</span>
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Cambiar archivo
                </button>
              </div>

              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs table-fixed">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[18%]" />
                    <col className="w-[28%]" />
                    <col className="w-[16%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {['Nombre', 'Empresa', 'Email', 'Teléfono', 'Requerimientos'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium truncate">{row.nombre}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate">{row.empresa ?? '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate">{row.email ?? '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate">{row.telefono ?? '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground truncate">{row.requerimientos ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {extraCount > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  + {extraCount} más no mostrados en la vista previa
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={() => handleOpenChange(false)}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isPending || rows.length === 0}
              >
                {isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando…</>
                  : `Importar ${rows.length > 0 ? `${rows.length} leads` : ''}`
                }
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
