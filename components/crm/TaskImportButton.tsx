'use client'

import { useState, useTransition, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Upload, Loader2, X, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { importTasks } from '@/app/(dashboard)/actividades/task-actions'
import type { ImportTaskRow } from '@/lib/validations/task'

interface ParsedRow {
  titulo:        string
  fecha_entrega: string | undefined
}

const DATE_HEADERS = ['fecha entrega', 'fecha_entrega', 'fechaentrega', 'due date', 'fecha', 'entrega']
const TITLE_HEADERS = ['actividad', 'titulo', 'título', 'tarea', 'elemento', 'nombre', 'task', 'activity']

function isDateHeader(h: string) {
  return DATE_HEADERS.some(k => h.toLowerCase().includes(k))
}
function isTitleHeader(h: string) {
  return TITLE_HEADERS.some(k => h.toLowerCase() === k)
}

function parseDate(val: unknown): string | undefined {
  if (!val) return undefined
  if (typeof val === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val)
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  const s = String(val).trim()
  if (!s) return undefined
  // Try ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  // Try DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return undefined
}

function rawToRows(headers: string[], data: unknown[][]): ParsedRow[] {
  const titleIdx  = headers.findIndex(isTitleHeader) ?? 0
  const dateIdx   = headers.findIndex(isDateHeader)

  return data
    .map(row => {
      const titulo = String((row as unknown[])[titleIdx] ?? '').trim()
      if (!titulo) return null
      const fecha_entrega = dateIdx >= 0 ? parseDate((row as unknown[])[dateIdx]) : undefined
      return { titulo, fecha_entrega }
    })
    .filter((r): r is ParsedRow => r !== null)
}

interface Props {
  boardId:  string
  groupId?: string
  onImported?: (count: number) => void
}

export function TaskImportButton({ boardId, groupId, onImported }: Props) {
  const inputRef                      = useRef<HTMLInputElement>(null)
  const [open,        setOpen]        = useState(false)
  const [rows,        setRows]        = useState<ParsedRow[]>([])
  const [fileName,    setFileName]    = useState('')
  const [parseError,  setParseError]  = useState<string | null>(null)
  const [pending,     start]          = useTransition()

  function reset() {
    setRows([]); setFileName(''); setParseError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError(null)
    setFileName(file.name)

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'csv') {
      Papa.parse(file, {
        skipEmptyLines: true,
        complete(result) {
          const [headerRow, ...dataRows] = result.data as string[][]
          if (!headerRow?.length) { setParseError('Archivo CSV vacío o sin encabezados.'); return }
          const parsed = rawToRows(headerRow, dataRows)
          if (!parsed.length) { setParseError('No se encontraron filas con datos válidos.'); return }
          setRows(parsed)
          setOpen(true)
        },
        error(err) { setParseError(err.message) },
      })
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target?.result, { type: 'array', cellDates: false })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
          const [headerRow, ...dataRows] = data as unknown[][]
          if (!headerRow?.length) { setParseError('Hoja vacía o sin encabezados.'); return }
          const parsed = rawToRows(headerRow as string[], dataRows)
          if (!parsed.length) { setParseError('No se encontraron filas con datos válidos.'); return }
          setRows(parsed)
          setOpen(true)
        } catch (err) {
          setParseError((err as Error).message)
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  function handleImport() {
    const validRows: ImportTaskRow[] = rows.map(r => ({
      titulo:        r.titulo,
      fecha_entrega: r.fecha_entrega,
    }))
    start(async () => {
      const result = await importTasks(boardId, validRows, groupId)
      if ('error' in result) {
        setParseError(result.error)
        return
      }
      onImported?.(result.count)
      setOpen(false)
      reset()
    })
  }

  const preview = rows.slice(0, 5)
  const hasDateCol = rows.some(r => r.fecha_entrega)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { reset(); inputRef.current?.click() }}
        className="gap-1.5 text-xs"
      >
        <Upload className="h-3.5 w-3.5" />
        Importar
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />

      {parseError && !open && (
        <p className="text-xs text-destructive mt-1">{parseError}</p>
      )}

      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); reset() } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              Importar actividades
            </DialogTitle>
            <DialogDescription>
              {fileName} — {rows.length} actividad{rows.length !== 1 ? 'es' : ''} detectada{rows.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border border-border overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Actividad</th>
                    {hasDateCol && (
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fecha entrega</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="border-t border-border/40">
                      <td className="px-3 py-1.5 truncate max-w-[260px]">{r.titulo}</td>
                      {hasDateCol && (
                        <td className="px-3 py-1.5 text-muted-foreground">{r.fecha_entrega ?? '—'}</td>
                      )}
                    </tr>
                  ))}
                  {rows.length > 5 && (
                    <tr className="border-t border-border/40">
                      <td colSpan={hasDateCol ? 2 : 1} className="px-3 py-1.5 text-muted-foreground italic">
                        … y {rows.length - 5} más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {parseError && (
              <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 rounded-md p-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {parseError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setOpen(false); reset() }}>Cancelar</Button>
            <Button onClick={handleImport} disabled={pending || !rows.length}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Importar {rows.length} actividad{rows.length !== 1 ? 'es' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
