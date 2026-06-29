import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from '@react-email/components'

interface Props {
  outcome:    'ganado' | 'perdido'
  oppNombre:  string
  vendedor:   string
  monto?:     number
  oppUrl:     string
}

const fmtCurrency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

export function OppClosedEmail({ outcome, oppNombre, vendedor, monto, oppUrl }: Props) {
  const isWon    = outcome === 'ganado'
  const accentBg = isWon ? '#15803d' : '#b91c1c'
  const emoji    = isWon ? '🎉' : '📉'
  const label    = isWon ? 'GANADA' : 'PERDIDA'

  return (
    <Html lang="es">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', background: '#f9fafb', padding: '24px', margin: 0 }}>
        <Container style={{ maxWidth: '540px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Section style={{ background: accentBg, padding: '20px 24px' }}>
            <Heading as="h1" style={{ color: '#fff', margin: 0, fontSize: '18px' }}>
              {emoji} Oportunidad {label}
            </Heading>
            <Text style={{ color: isWon ? '#bbf7d0' : '#fecaca', margin: '4px 0 0', fontSize: '13px' }}>
              CRM Global Supplier
            </Text>
          </Section>
          <Section style={{ padding: '28px 24px' }}>
            <Heading as="h2" style={{ margin: '0 0 16px', fontSize: '20px', color: '#111827' }}>
              {oppNombre}
            </Heading>
            <Text style={{ margin: '0 0 6px', color: '#374151' }}>
              <strong>Vendedor:</strong> {vendedor}
            </Text>
            {isWon && monto !== undefined && (
              <Text style={{ margin: '0 0 20px', color: '#374151' }}>
                <strong>Monto:</strong> {fmtCurrency.format(monto)}
              </Text>
            )}
            {!isWon && (
              <Text style={{ margin: '0 0 20px', color: '#374151' }}>
                Revisa el motivo de cierre en el detalle de la oportunidad.
              </Text>
            )}
            <Button
              href={oppUrl}
              style={{ background: accentBg, color: '#fff', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
            >
              Ver oportunidad
            </Button>
            <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
            <Text style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              CRM Global Supplier — notificación automática
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
