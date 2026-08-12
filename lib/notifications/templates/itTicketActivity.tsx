import { Html, Head, Body, Container, Section, Heading, Text, Button, Hr } from '@react-email/components'

interface Props {
  kind:         'status' | 'message'
  ticketTitle:  string
  actorName:    string
  statusLabel?: string
  ticketUrl:    string
}

export function ITTicketActivityEmail({ kind, ticketTitle, actorName, statusLabel, ticketUrl }: Props) {
  const heading = kind === 'status' ? 'Actualización de estado' : 'Nuevo mensaje en tu ticket'
  const body = kind === 'status'
    ? <>
        <strong>{actorName}</strong> movió el ticket <strong>"{ticketTitle}"</strong> a <strong>{statusLabel}</strong>.
      </>
    : <>
        <strong>{actorName}</strong> escribió en el ticket <strong>"{ticketTitle}"</strong>.
      </>

  return (
    <Html lang="es">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', background: '#f9fafb', padding: '24px', margin: 0 }}>
        <Container style={{ maxWidth: '540px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Section style={{ background: '#1d4ed8', padding: '20px 24px' }}>
            <Heading as="h1" style={{ color: '#fff', margin: 0, fontSize: '18px' }}>
              Supply
            </Heading>
          </Section>
          <Section style={{ padding: '28px 24px' }}>
            <Heading as="h2" style={{ margin: '0 0 8px', fontSize: '16px', color: '#111827' }}>
              {heading}
            </Heading>
            <Text style={{ margin: '0 0 20px', color: '#374151' }}>
              {body}
            </Text>
            <Button
              href={ticketUrl}
              style={{ background: '#1d4ed8', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
            >
              Ver ticket
            </Button>
            <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0 12px' }} />
            <Text style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Supply — notificación automática
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
