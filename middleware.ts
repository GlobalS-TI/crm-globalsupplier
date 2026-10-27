import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // api/integrations no usa sesión de Supabase: se autentica por API key en cada
    // route handler (ADR-007). Sin esta exclusión el middleware la redirige a /login.
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|api/integrations/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
