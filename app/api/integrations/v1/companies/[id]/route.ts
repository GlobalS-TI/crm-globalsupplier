import type { NextRequest } from 'next/server'
import { runIntegration } from '@/lib/integrations/http'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return runIntegration(req, ({ service, keyHash }) => service.getCompany(keyHash, id))
}
